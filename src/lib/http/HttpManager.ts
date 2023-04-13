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
  InternalServerError,
  NotFoundError,
  RatelimitError
} from '../../interfaces/Errors';
import { PrivateConfig, SpotifyConfig } from '../../interfaces/Config';

export class HttpClient {
  protected baseURL = 'https://api.spotify.com/v1';

  protected tokenURL = 'https://accounts.spotify.com/api/token';

  protected client = this.create({ resInterceptor: true });

  constructor(protected config: SpotifyConfig, protected privateConfig: PrivateConfig) {}

  /**
   * @param {string} slug
   * @param {string} query
   * @returns {string} Returns the full url.
   */
  getURL(slug: string, query?: Record<string, string>): string {
    const url = new URL(this.baseURL);
    url.pathname += slug;
    url.search = new URLSearchParams(query).toString();

    return url.toString();
  }

  /**
   * @description Get a refresh token.
   * @returns {string} Returns the refresh token.
   */
  private async refreshToken(retryAmount = 0): Promise<string> {
    if (
      !this.config.clientCredentials.clientId ||
      !this.config.clientCredentials.clientSecret ||
      !this.config.refreshToken
    ) {
      throw new AuthError('missing information needed to refresh token');
    }

    const res = await axios.post(
      this.tokenURL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken
      }),
      {
        headers: {
          authorization: `Basic ${Buffer.from(
            `${this.config.clientCredentials.clientId}:${this.config.clientCredentials.clientSecret}`
          ).toString('base64')}`
        },
        validateStatus: () => true
      }
    );

    // error handling
    if (res.status !== 200) {
      if (res.status === 400) {
        throw new AuthError(
          `refreshing token failed: bad request\n${JSON.stringify(res.data, null, ' ')}`
        );
      }

      if (retryAmount < 5) {
        console.log(`refreshing token failed (${res.status}). retrying... (${retryAmount + 1})`);
        await this.refreshToken(retryAmount + 1);
      } else if (res.status < 600 && res.status >= 500) {
        throw new AuthError(`refreshing token failed: server error (${res.status})`);
      } else {
        throw new AuthError(`refreshing token failed (${res.status})`);
      }
    }

    this.config.accessToken = res.data.access_token; // save access token

    // save expire now
    this.privateConfig.tokenExpire = new Date(
      new Date().setSeconds(new Date().getSeconds() + 3600)
    );

    return this.config.accessToken; // return token
  }

  /**
   * Get authorization token with client credentials flow.
   */
  private async getToken(retryAmount = 0): Promise<string> {
    const res = await axios.post(
      this.tokenURL,
      new URLSearchParams({
        grant_type: 'client_credentials'
      }),
      {
        headers: {
          authorization: `Basic ${Buffer.from(
            `${this.config.clientCredentials.clientId}:${this.config.clientCredentials.clientSecret}`
          ).toString('base64')}`
        },
        validateStatus: () => true
      }
    );

    // error handling
    if (res.status !== 200) {
      if (res.status === 400) {
        throw new AuthError(
          `getting token failed: bad request\n${JSON.stringify(res.data, null, ' ')}`
        );
      }

      if (retryAmount < 5) {
        console.log(`getting token failed (${res.status}). retrying... (${retryAmount + 1})`);
        await this.getToken(retryAmount + 1);
      } else if (res.status < 600 && res.status >= 500) {
        throw new AuthError(`getting token failed: server error (${res.status})`);
      } else {
        throw new AuthError(`getting token failed (${res.status})`);
      }
    }

    this.config.accessToken = res.data.access_token;

    this.privateConfig.tokenExpire = new Date(
      new Date().setSeconds(new Date().getSeconds() + 3600)
    );

    return this.config.accessToken;
  }

  /**
   * @description Handles the auth tokens.
   * @returns {string} Returns a auth token.
   */
  private async handleAuth(): Promise<string> {
    if (this.config.accessToken) {
      // check if token is expired
      if (new Date() >= this.privateConfig.tokenExpire) {
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
      return await this.refreshToken(); // refresh token
    }

    // add credentials flow
    if (this.config?.clientCredentials?.clientId && this.config?.clientCredentials?.clientSecret) {
      return await this.getToken();
    }

    throw new AuthError('auth failed: missing information to handle auth');
  }

  /**
   * Sleep function.
   * @param {number} delay Delay in milliseconds.
   */
  private sleep(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // create axios client, set interceptors, handle errors & auth
  private create(options: { resInterceptor?: boolean }): AxiosInstance {
    const config: AxiosRequestConfig = {
      proxy: this.config.http?.proxy
    };

    if (this.config.http?.localAddress) {
      // TODO: https://github.com/axios/axios/issues/3876
      // @ts-expect-error `transport` is not included in axios types (see https://github.com/axios/axios/issues/3876)
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
      // add authorization, content
      config.headers = {
        Authorization: `Bearer ${await this.handleAuth()}`,
        // 'Content-Type': 'application/json',
        // Accept: 'application/json',
        'User-Agent':
          this.config.http?.userAgent || `spotify.js https://github.com/statsfm/spotify.js`,
        ...config.headers
      };

      return config;
    });

    if (options.resInterceptor || options.resInterceptor === undefined) {
      // response interceptor
      client.interceptors.response.use(
        (config) => config,
        // error handler
        async (err: AxiosError) => {
          let res = err.response;

          if (res?.status) {
            // throw error if bad request
            if (res.status === 400) {
              throw new BadRequestError(
                `bad request (${err.config.url})\n${JSON.stringify(err.response.data, null, ' ')}`,
                err.stack
              );
            }

            // throw error if forbideden
            if (res.status === 403) {
              throw new ForbiddenError(
                `forbidden, are you sure you have the right scopes? (${
                  err.config.url
                })\n${JSON.stringify(res.data, null, ' ')}`,
                err.stack
              );
            }

            // throw error if 404
            if (res.status === 404) {
              throw new NotFoundError(`not found (${res.config.url})`, err.stack);
            }

            if (res.status === 401) {
              throw new AuthError(
                `unauthorized (${err.config.url}) ${JSON.stringify(res.data, null, ' ')}`,
                err.stack
              );
              //   await this.handleAuth();
              //   const res = await client.request(err.config);
              //   return res;
            }

            // 5xx
            if (res.status.toString().startsWith('5')) {
              if (this.config.retry5xx || this.config.retry5xx === undefined) {
                // set default
                if (!this.config.retry5xxAmount) this.config.retry5xxAmount = 3;

                // create new axios client without interceptors
                const nClient = this.create({ resInterceptor: false });

                // retry x times
                for (let i = 0; i < this.config.retry5xxAmount; i++) {
                  console.log(
                    `${res.status} error, retrying... (${i + 1}/${this.config.retry5xxAmount})`
                  );

                  // timeout one second
                  // eslint-disable-next-line no-await-in-loop
                  await this.sleep(1 * 1000); // wait for retry time

                  // disable error checking
                  // err.config.validateStatus = (): boolean => true;

                  try {
                    // retry request
                    // eslint-disable-next-line no-await-in-loop
                    const nRes = await nClient.request(err.config);

                    // starts with 200, successful
                    if (nRes.status.toString().startsWith('2')) {
                      return nRes;
                    }
                  } catch (err) {
                    if (i === this.config.retry5xxAmount - 1) {
                      throw new Error(
                        `${res.status} error, retried ${this.config.retry5xxAmount} times\n${err.stack}`
                      );
                    }
                  }
                }
              }
            }

            // if (res.status === 500) {
            //   throw new InternalServerError('internal server error', err.stack);
            // }

            if (res.status === 429) {
              if (this.config.logRetry) {
                console.log(res);
              }
              if (this.config.retry || this.config.retry === undefined) {
                const retry = res.headers[`retry-after`] as unknown as number; // get retry time

                // log ratelimit (if enabled)
                if (this.config.logRetry || this.config.logRetry === undefined) {
                  // eslint-disable-next-line no-console
                  console.error(
                    `hit ratelimit, retrying in ${retry} second(s), client id: ${this.config?.clientCredentials?.clientId}, localAddress: ${this.config.http.localAddress}, path: ${err.request.path}`
                  );
                }

                await this.sleep(retry * 1000); // wait for retry time
                res = await client.request(err.config); // retry request
              } else {
                throw new RatelimitError(`hit ratelimit (${err.config.url})`, err.stack);
              }
              return res;
            }
          }

          throw err;
        }
      );
    }

    return client;
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
