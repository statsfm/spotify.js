/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import { URL, URLSearchParams } from 'url';
import * as https from 'https';
import { ClientRequest } from 'http';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import {
  AuthError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  RatelimitError,
  RequestRetriesExceededError,
  UnauthorizedError
} from '../../interfaces/Errors';
import { PrivateConfig, SpotifyConfig } from '../../interfaces/Config';
import { sleep } from '../../util/sleep';

const accessTokenExpireTTL = 60 * 60 * 1_000; // 1hour

type ConfigWithRetry = InternalAxiosRequestConfig & { retryAttempt?: number };

export class HttpClient {
  protected baseURL = 'https://api.spotify.com';

  protected tokenURL = 'https://accounts.spotify.com/api/token';

  protected client = this.createClient();

  constructor(
    protected config: SpotifyConfig,
    protected privateConfig: PrivateConfig
  ) {
    if (config.http?.baseURL) {
      this.baseURL = config.http.baseURL;
    }
  }

  /**
   * @param {string} slug
   * @param {Record<string, string>} query
   * @returns {string} Returns the full url.
   */
  getURL(slug: string, query?: Record<string, string>): string {
    const url = new URL(this.baseURL);

    url.pathname = slug;
    url.search = new URLSearchParams(query).toString();

    return url.toString();
  }

  /**
   * @description Get a refresh token.
   * @param {number} retryAmount The amount of retries.
   * @returns {string} Returns the refresh token.
   */
  private async refreshToken(retryAmount = 0): Promise<string> {
    if (
      !this.config.clientCredentials.clientId ||
      !this.config.clientCredentials.clientSecret ||
      !this.config.refreshToken
    ) {
      throw new AuthError(
        'Missing information needed to refresh token, required: client id, client secret, refresh token'
      );
    }

    const response = await axios.post(
      this.tokenURL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken
      }),
      {
        auth: {
          username: this.config.clientCredentials.clientId,
          password: this.config.clientCredentials.clientSecret
        },
        validateStatus: () => true
      }
    );

    const { status: statusCode } = response;

    if (statusCode === 200) {
      return response.data.access_token;
    }

    if (statusCode === 400) {
      throw new AuthError('Failed to refresh token: bad request', {
        data: response.data
      });
    }

    if (retryAmount === 5) {
      if (statusCode >= 500 && statusCode < 600) {
        throw new AuthError(`Failed to refresh token: server error (${statusCode})`);
      }

      throw new AuthError(`Request retry attempts exceeded, failed with status code ${statusCode}`);
    }

    if (this.config.debug) {
      console.log(
        `Failed to refresh token: got (${statusCode}) response. Retrying... (${retryAmount + 1})`
      );
    }

    return await this.refreshToken(retryAmount + 1);
  }

  /**
   * Get authorization token with client credentials flow.
   * @param {number} retryAmount The amount of retries.
   * @returns {string} Returns the authorization token.
   */
  private async getToken(retryAmount = 0): Promise<string> {
    const response = await axios.post(
      this.tokenURL,
      new URLSearchParams({
        grant_type: 'client_credentials'
      }),
      {
        auth: {
          username: this.config.clientCredentials.clientId,
          password: this.config.clientCredentials.clientSecret
        },
        validateStatus: () => true
      }
    );

    const { status: statusCode } = response;

    if (statusCode === 200) {
      return response.data.access_token;
    }

    if (statusCode === 400) {
      throw new AuthError(`Failed to get token: bad request`, {
        data: response.data
      });
    }

    if (retryAmount === 5) {
      if (statusCode >= 500 && statusCode < 600) {
        throw new AuthError(`Failed to get token: server error (${statusCode})`);
      }

      throw new AuthError(`Request retry attempts exceeded, failed with status code ${statusCode}`);
    }

    if (typeof this.config.debug === 'boolean' && this.config.debug === true) {
      console.log(
        `Failed to get token: got (${statusCode}) response. retrying... (${retryAmount + 1})`
      );
    }

    return await this.getToken(retryAmount + 1);
  }

  /**
   * @description Handles the auth tokens.
   * @returns {string} Returns a auth token.
   */
  private async handleAuth(): Promise<string> {
    if (this.config.accessToken) {
      // check if token is expired
      if (this.privateConfig.tokenExpireAt < Date.now()) {
        this.config.accessToken = undefined;

        return await this.handleAuth();
      }

      // return already defined access token
      return this.config.accessToken;
    }

    // refresh token
    if (
      this.config?.clientCredentials?.clientId &&
      this.config?.clientCredentials?.clientSecret &&
      this.config?.refreshToken
    ) {
      const accessToken = await this.refreshToken();

      this.config.accessToken = accessToken;
      this.privateConfig.tokenExpireAt = Date.now() + accessTokenExpireTTL;

      return accessToken;
    }

    // add credentials flow
    if (this.config?.clientCredentials?.clientId && this.config?.clientCredentials?.clientSecret) {
      const accessToken = await this.getToken();

      this.config.accessToken = accessToken;
      this.privateConfig.tokenExpireAt = Date.now() + accessTokenExpireTTL;

      return accessToken;
    }

    throw new AuthError('auth failed: missing information to handle auth');
  }

  /**
   * Create an axios instance, set interceptors, handle errors & auth.
   */
  private createClient(): AxiosInstance {
    const config: AxiosRequestConfig = {
      proxy: this.config.http?.proxy,
      validateStatus: (status) => status >= 200 && status < 300
    };

    if (this.config.http?.localAddress) {
      config.transport = {
        ...https,
        request: (options, callback): ClientRequest =>
          https.request(
            {
              ...options,
              localAddress: this.config.http?.localAddress,
              family: this.config.http?.localAddress.includes(':') ? 6 : 4
            },
            callback
          )
      };
    }

    const client = axios.create(config);

    axiosBetterStacktrace(client);

    // request interceptor
    client.interceptors.request.use(async (config) => {
      config.headers.Authorization = `Bearer ${await this.handleAuth()}`;
      config.headers['User-Agent'] =
        this.config.http?.userAgent ?? `@statsfm/spotify.js https://github.com/statsfm/spotify.js`;
      config.headers = Object.assign(this.config.http?.headers ?? {}, config.headers);

      return config;
    });

    // attach error handling interceptor
    client.interceptors.response.use(
      (response) => response,
      (err: unknown) => this.handleError(client, err)
    );

    return client;
  }

  private async handleError(client: AxiosInstance, err: unknown): Promise<AxiosResponse> {
    if (axios.isCancel(err) || axios.isAxiosError(err) === false || !this.shouldRetryRequest(err)) {
      return await Promise.reject(this.extractResponseError(err));
    }

    const requestConfig = err.config as ConfigWithRetry;

    requestConfig.retryAttempt ||= 0;

    const isRateLimited = err.response && err.response.status === 429;

    if (isRateLimited) {
      if (this.config.logRetry) {
        console.log(err.response);
      }

      const retryAfter = Number(err.response.headers['retry-after']) || 0;

      if (this.config.logRetry || this.config.logRetry === undefined) {
        console.error(
          `Hit ratelimit, retrying in ${retryAfter} second(s), client id: ${this.config.clientCredentials?.clientId ?? 'none'}, path: ${err.request.path}`
        );
      }

      await sleep(retryAfter * 1_000);

      requestConfig.retryAttempt = 0;
    } else {
      await sleep(1_000);

      requestConfig.retryAttempt! += 1;

      if (this.config.debug) {
        console.log(
          `(${requestConfig.retryAttempt}/${this.maxRetryAttempts}) retry ${requestConfig.url} - ${err}`
        );
      }
    }

    return await client.request(requestConfig);
  }

  private shouldRetryRequest(err: AxiosError): boolean {
    // non-response errors should clarified as 5xx and retried (socket hangup, ECONNRESET, etc.)
    if (!err.response) {
      if (this.config.retry5xx === false) {
        return false;
      }

      const { retryAttempt = 0 } = err.config as ConfigWithRetry;

      return retryAttempt < this.maxRetryAttempts;
    }

    const { status } = err.response;

    if (status === 429) {
      return this.config.retry !== false;
    }

    if (status >= 500 && status < 600) {
      if (this.config.retry5xx === false) {
        return false;
      }

      const { retryAttempt = 0 } = err.config as ConfigWithRetry;

      return retryAttempt < this.maxRetryAttempts;
    }

    return false;
  }

  private extractResponseError(err: unknown): unknown {
    if (axios.isCancel(err) || axios.isAxiosError(err) === false) {
      return err;
    }

    // non-response errors should clarified as 5xx and retried (socket hangup, ECONNRESET, etc.)
    if (!err.response) {
      const { retryAttempt = 0 } = err.config as ConfigWithRetry;

      if (this.config.retry5xx === false || retryAttempt < this.maxRetryAttempts) {
        return err;
      }

      return new RequestRetriesExceededError(
        `Request max${this.maxRetryAttempts} retry attempts exceeded`,
        err.config.url,
        err.stack
      );
    }

    const { stack, config, response } = err;
    const { status, headers, data } = response;

    if (status >= 500 && status < 600) {
      const { retryAttempt } = err.config as ConfigWithRetry;

      if (this.config.retry5xx === false || retryAttempt < this.maxRetryAttempts) {
        return err;
      }

      return new RequestRetriesExceededError(
        `Request ${this.maxRetryAttempts} retry attempts exceeded`,
        err.config.url,
        err.stack
      );
    }

    switch (status) {
      case 400:
        return new BadRequestError(config.url, {
          stack,
          data
        });

      case 401:
        return new UnauthorizedError(config.url, {
          stack,
          data
        });

      case 403:
        return new ForbiddenError(config.url, {
          stack,
          data
        });

      case 404:
        throw new NotFoundError(config.url, stack);

      case 429:
        return new RatelimitError(
          `Hit ratelimit, retry after ${headers['retry-after']} seconds`,
          err.config.url,
          {
            stack,
            data
          }
        );
    }

    return err;
  }

  private get maxRetryAttempts(): number {
    return this.config.retry5xxAmount ?? 3;
  }

  /**
   * @param {string} slug The slug to get.
   * @param {{query?: Record<string, string> & AxiosRequestConfig}} config Config.
   * @returns {Promise<AxiosResponse>} Returns a promise with the response.
   */
  async get(
    slug: string,
    config?: { query?: Record<string, string> } & AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return await this.client.get(this.getURL(slug, config?.query), config);
  }

  /**
   * @param {string} slug The slug to post.
   * @param {any} data Body data.
   * @param {{Record<string, string> & RequestInit}} config Config.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async post(
    slug: string,
    data: unknown,
    config?: { query?: Record<string, string> } & AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return await this.client.post(this.getURL(slug, config?.query), data, config);
  }

  /**
   * @param {string} slug The slug to put.
   * @param {any} data Body data.
   * @param {{Record<string, string> & RequestInit}} config Config.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async put(
    slug: string,
    data: unknown,
    config?: { query?: Record<string, string> } & AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return await this.client.put(this.getURL(slug, config?.query), data, config);
  }

  /**
   * @param {string} slug The slug to delete.
   * @param {unknown} data Body data.
   * @param {{Record<string, string> & RequestInit}} config Config.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async delete(
    slug: string,
    data: unknown,
    config?: { query?: Record<string, string> } & AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return await this.client.delete(this.getURL(slug, config?.query), {
      ...config,
      data
    });
  }
}
