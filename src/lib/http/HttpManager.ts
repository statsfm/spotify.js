/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { URL, URLSearchParams } from 'url';
import * as https from 'https';
import { ClientRequest } from 'http';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  RatelimitError,
  RequestRetriesExceededError,
  UnauthorizedError
} from '../../interfaces/Errors';
import { PrivateConfig, SpotifyConfig } from '../../interfaces/Config';
import { sleep } from '../../util/sleep';
import { AuthManager } from './AuthManager';
import { attach, RetryInterceptor } from './RetryInterceptor';

export class HttpClient {
  protected baseURL = 'https://api.spotify.com';

  protected auth: AuthManager;
  protected client: AxiosInstance;

  constructor(
    protected config: SpotifyConfig,
    privateConfig: PrivateConfig
  ) {
    if (config.http?.baseURL) {
      this.baseURL = config.http.baseURL;
    }

    this.auth = new AuthManager(config, privateConfig);

    const retryInterceptor = new RetryInterceptor({
      onRetryAttempt(error): void {
        console.log('do retry for', error.config.url);
      }
    });

    this.client = this.create();

    attach(this.client, retryInterceptor);
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
   * Create an axios instance, set interceptors, handle errors & auth.
   */
  private create(): AxiosInstance {
    const config: AxiosRequestConfig = {
      proxy: this.config.http?.proxy,
      headers: {
        ...this.config.http?.headers,
        'User-Agent':
          this.config.http?.userAgent ?? '@statsfm/spotify.js https://github.com/statsfm/spotify.js'
      }
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
      const accessToken = await this.auth.getToken();

      config.headers.Authorization = `Bearer ${accessToken}`;

      return config;
    });

    return client;
  }

  private async errorHandler(err: AxiosError<Record<string, unknown>>): Promise<AxiosResponse> {
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

    if (this.config.retry === false) {
      throw new RatelimitError(
        `Hit ratelimit, retry after ${res.headers['retry-after']} seconds`,
        err.config.url,
        {
          stack: err.stack,
          data: res.data
        }
      );
    }

    const retryAfter = parseInt(res.headers['retry-after']) || 0;

    if (this.config.logRetry || this.config.logRetry === undefined) {
      console.error(
        `Hit ratelimit, retrying in ${retryAfter} second(s), client id: ${this.config.clientCredentials?.clientId ?? 'none'}, path: ${err.request.path}`
      );
    }

    await sleep(retryAfter * 1_000);

    return await this.client.request(err.config);
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

    const nClient = this.create();

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
                `Request exceeded ${this.config.retry5xxAmount} retry attempts`,
                error.config.url,
                error.response
              );
            }
        }
      }
    }
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
