/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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
  RequestRetriesExceededError
} from '../../interfaces/Errors';
import { PrivateConfig, SpotifyConfig } from '../../interfaces/Config';

/**
 * Sleep function.
 * @param {number} delay Delay in milliseconds.
 */
const sleep = (delay: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, delay));

export class HttpClient {
  protected baseURL = 'https://api.spotify.com';

  protected tokenURL = 'https://accounts.spotify.com/api/token';

  protected client = this.create({ resInterceptor: true });

  constructor(protected config: SpotifyConfig, protected privateConfig: PrivateConfig) {
    if (config.http?.baseURL) {
      this.baseURL = config.http.baseURL;
    }
  }

  /**
   * @param {string} slug
   * @param {string} query
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
        if (typeof this.config.debug === 'boolean' && this.config.debug === true) {
          console.log(`refreshing token failed (${res.status}). retrying... (${retryAmount + 1})`);
        }
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
        if (typeof this.config.debug === 'boolean' && this.config.debug === true) {
          console.log(`getting token failed (${res.status}). retrying... (${retryAmount + 1})`);
        }
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
        'User-Agent':
          this.config.http?.userAgent ??
          `@statsfm/spotify.js https://github.com/statsfm/spotify.js`,
        ...(this.config.http?.headers ?? {}),
        ...config.headers
      };

      return config;
    });

    if (options.resInterceptor || options.resInterceptor === undefined) {
      // response interceptor
      client.interceptors.response.use(
        (config) => config,
        // error handler
        async (err) => {
          if (!axios.isAxiosError(err) || !err.response) {
            throw err;
          }

          const { response } = err;

          let { status: statusCode } = response;

          if (statusCode) {
            // throw error if bad request
            if (statusCode === 400) {
              throw new BadRequestError(
                `bad request (${err.config.url})\n${JSON.stringify(err.response.data, null, ' ')}`,
                err.stack
              );
            }

            // throw error if forbideden
            if (statusCode === 403) {
              const responseDataJSON = JSON.stringify(response.data, null, ' ');

              throw new ForbiddenError(
                `forbidden, are you sure you have the right scopes? (${err.config.url})\n${responseDataJSON}`,
                err.stack
              );
            }

            // throw error if 404
            if (statusCode === 404) {
              throw new NotFoundError(`not found (${response.config.url})`, err.stack);
            }

            if (statusCode === 401) {
              const responseDataJSON = JSON.stringify(response.data, null, ' ');

              throw new AuthError(
                `unauthorized (${err.config.url}) ${responseDataJSON}`,
                err.stack
              );
            }

            // 5xx
            if (statusCode >= 500 && statusCode < 600) {
              if (this.config.retry5xx || this.config.retry5xx === undefined) {
                // set default
                if (!this.config.retry5xxAmount) this.config.retry5xxAmount = 3;

                // create new axios client without interceptors
                const nClient = this.create({ resInterceptor: false });

                // retry x times
                for (let i = 1; i <= this.config.retry5xxAmount; i++) {
                  if (this.config.debug === true) {
                    console.log(
                      `(${i}/${this.config.retry5xxAmount}) retry ${err.config.url} - ${statusCode}`
                    );
                  }

                  // timeout one second
                  // eslint-disable-next-line no-await-in-loop
                  await sleep(1_000); // wait for retry time

                  // disable error checking
                  // err.config.validateStatus = (): boolean => true;

                  try {
                    // retry request
                    // eslint-disable-next-line no-await-in-loop
                    const nRes = await nClient.request(err.config);

                    // starts with 200, successful
                    if (nRes.status >= 200 && nRes.status < 300) {
                      return nRes;
                    }

                    statusCode = nRes.status;
                  } catch (error) {
                    if (!axios.isAxiosError(error)) {
                      throw err;
                    }

                    if (i === this.config.retry5xxAmount) {
                      // handling axios error @see https://axios-http.com/docs/handling_errors
                      if (error.response) {
                        throw new RequestRetriesExceededError(
                          `Request to ${err.config.url} exceeded ${this.config.retry5xxAmount} number of retry attempts, failed with status code ${error.response.status}`,
                          error.stack
                        );
                      }

                      if (error.request) {
                        throw new RequestRetriesExceededError(
                          `Request to ${err.config.url} exceeded ${this.config.retry5xxAmount} number of retry attempts, no response received`,
                          error.stack
                        );
                      }
                    }
                  }
                }
              }
            }

            // if (res.status === 500) {
            //   throw new InternalServerError('internal server error', err.stack);
            // }

            if (statusCode === 429) {
              if (this.config.logRetry) {
                console.log(response);
              }

              if (this.config.retry || this.config.retry === undefined) {
                const retry = response.headers[`retry-after`] as unknown as number; // get retry time

                // log ratelimit (if enabled)
                if (this.config.logRetry || this.config.logRetry === undefined) {
                  // eslint-disable-next-line no-console
                  console.error(
                    `hit ratelimit, retrying in ${retry} second(s), client id: ${this.config?.clientCredentials?.clientId}, localAddress: ${this.config.http.localAddress}, path: ${err.request.path}`
                  );
                }

                await sleep(retry * 1_000); // wait for retry time

                return await client.request(err.config); // retry request
              }

              throw new RatelimitError(`hit ratelimit (${err.config.url})`, err.stack);
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
