/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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

export class HttpClient {
  protected baseURL = 'https://api.spotify.com';

  protected tokenURL = 'https://accounts.spotify.com/api/token';

  protected client = this.create({ resInterceptor: true });

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
  private create(options: { resInterceptor?: boolean }): AxiosInstance {
    const config: AxiosRequestConfig = {
      proxy: this.config.http?.proxy
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

    if (options.resInterceptor || options.resInterceptor === undefined) {
      // Response interceptor
      client.interceptors.response.use((config) => config, this.errorHandler.bind(this, client));
    }

    return client;
  }

  private async errorHandler(
    client: AxiosInstance,
    err: AxiosError<Record<string, unknown>>
  ): Promise<AxiosResponse> {
    if (!axios.isAxiosError(err) || !err.response) {
      throw err;
    }

    const { response } = err;

    const { status: statusCode } = response;

    switch (statusCode) {
      case 400:
        throw new BadRequestError(err.config.url, {
          stack: err.stack,
          data: response.data
        });

      case 401:
        throw new UnauthorizedError(err.config.url, {
          stack: err.stack,
          data: response.data
        });

      case 403:
        throw new ForbiddenError(err.config.url, {
          stack: err.stack,
          data: response.data
        });

      case 404:
        throw new NotFoundError(err.config.url, err.stack);

      case 429:
        await this.handleRateLimit(response, err);
        break;

      default:
        if (statusCode >= 500 && statusCode < 600) {
          return await this.handle5xxErrors(response, err, statusCode);
        } else {
          throw err;
        }
    }
  }

  private async handleRateLimit(res: AxiosResponse, err: AxiosError): Promise<AxiosResponse> {
    if (this.config.logRetry) {
      console.log(res);
    }

    if (this.config.retry || this.config.retry === undefined) {
      const retryAfter = parseInt(res.headers['retry-after']) || 0;

      if (this.config.logRetry || this.config.logRetry === undefined) {
        console.error(
          `Hit ratelimit, retrying in ${retryAfter} second(s), client id: ${this.config.clientCredentials?.clientId ?? 'none'}, path: ${err.request.path}`
        );
      }

      await sleep(retryAfter * 1_000);
      return await this.client.request(err.config);
    } else {
      throw new RatelimitError(
        `Hit ratelimit, retry after ${res.headers['retry-after']} seconds`,
        err.config.url,
        {
          stack: err.stack,
          data: res.data
        }
      );
    }
  }

  private async handle5xxErrors(
    res: AxiosResponse,
    err: AxiosError,
    statusCode: number
  ): Promise<AxiosResponse> {
    if (!this.config.retry5xx && this.config.retry5xx !== undefined) {
      throw err;
    }

    this.config.retry5xxAmount = this.config.retry5xxAmount || 3;
    const nClient = this.create({ resInterceptor: false });

    for (let i = 1; i <= this.config.retry5xxAmount; i++) {
      if (this.config.debug) {
        console.log(`(${i}/${this.config.retry5xxAmount}) retry ${err.config.url} - ${statusCode}`);
      }

      await sleep(1_000);

      try {
        const nRes = await nClient.request(err.config);

        if (nRes.status >= 200 && nRes.status < 300) {
          return nRes;
        }
        statusCode = nRes.status;
      } catch (error) {
        if (!axios.isAxiosError(error) || !error.response) {
          throw error;
        }

        statusCode = error.response.status;
        switch (statusCode) {
          case 429:
            await this.handleRateLimit(error.response, error);
            break;

          case 401:
            throw new UnauthorizedError(error.config.url, {
              stack: error.stack,
              data: res.data
            });

          case 403:
            throw new ForbiddenError(error.config.url, {
              stack: error.stack,
              data: res.data
            });

          case 404:
            throw new NotFoundError(error.config.url, error.stack);

          default:
            if (i === this.config.retry5xxAmount) {
              throw new RequestRetriesExceededError(
                `Request exceeded ${this.config.retry5xxAmount} number of retry attempts, failed with status code ${statusCode}`,
                error.config.url,
                error.stack
              );
            }
        }
      }
    }
  }

  /**
   * @param {string} slug The slug to get.
   * @param {{query?: Record<string, string> & AxiosRequestConfig}} options Options.
   * @returns {Promise<AxiosResponse>} Returns a promise with the response.
   */
  async get(
    slug: string,
    options?: { query?: Record<string, string> } & AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return await this.client.get(this.getURL(slug, options?.query), options);
  }

  /**
   * @param {string} slug The slug to post.
   * @param {any} data Body data.
   * @param {{Record<string, string> & RequestInit}} config Config.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async post(
    slug: string,
    data: any,
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
    data: any,
    config?: { query?: Record<string, string> } & AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return await this.client.put(this.getURL(slug, config?.query), data, config);
  }

  /**
   * @param {string} slug The slug to delete.
   * @param {any} data Body data.
   * @param {{Record<string, string> & RequestInit}} options Options.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async delete(
    slug: string,
    data: any,
    options?: { query?: Record<string, string> } & AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return await this.client.delete(this.getURL(slug, options?.query), {
      ...options,
      data
    });
  }
}
