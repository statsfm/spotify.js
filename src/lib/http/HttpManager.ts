/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { URL, URLSearchParams } from 'url';
import { AuthError } from '../../interfaces/Errors';
import { PrivateConfig, SpotifyConfig } from '../../interfaces/Config';

axios.defaults.validateStatus = (): true => true;

export class HttpClient {
  protected baseURL = 'https://api.spotify.com/v1';

  protected tokenURL = 'https://accounts.spotify.com/api/token';

  protected client = this.create();

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
  private async refreshToken(): Promise<string> {
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
        }
      }
    );

    if (res.status !== 200) {
      throw new AuthError('refreshing token failed');
    }

    this.config.acccessToken = res.data.access_token; // save access token

    // save expire now
    this.privateConfig.tokenExpire = new Date(
      new Date().setSeconds(new Date().getSeconds() + 3600)
    );

    return this.config.acccessToken; // return token
  }

  /**
   * Get authorization token with client credentials flow.
   */
  private async getToken(): Promise<string> {
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
        }
      }
    );

    if (res.status !== 200) {
      throw new AuthError('getting token failed');
    }

    this.config.acccessToken = res.data.access_token;

    this.privateConfig.tokenExpire = new Date(
      new Date().setSeconds(new Date().getSeconds() + 3600)
    );

    return this.config.acccessToken;
  }

  /**
   * @description Handles the auth tokens.
   * @returns {string} Returns a auth token.
   */
  private async handleAuth(): Promise<string> {
    if (this.config.acccessToken) {
      // check if token is expired
      if (new Date() >= this.privateConfig.tokenExpire) {
        return await this.refreshToken(); // refresh token
      }

      // return already defined access token
      return this.config.acccessToken;
    }

    // refresh token
    if (
      this.config.clientCredentials.clientId &&
      this.config.clientCredentials.clientSecret &&
      this.config.refreshToken
    ) {
      return await this.refreshToken(); // refresh token
    }

    // add credentials flow
    if (this.config.clientCredentials.clientId && this.config.clientCredentials.clientSecret) {
      return await this.getToken();
    }
    throw new AuthError('auth failed');
  }

  private sleep(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // private async handleError(
  //   res: Response,
  //   url: RequestInfo,
  //   init?: RequestInit
  // ): Promise<Response> {
  //   if (res.status === 401) {
  //     await this.handleAuth();

  //     res = await this.fetch(url, init);

  //     return res;
  //   }

  //   if (res.status === 400) {
  //     throw new BadRequestError(`bad request\n${await res.json()}`);
  //   }

  //   if (res.status === 403) {
  //     throw new ForbiddenError(`forbidden, are you sure you have the right scopes?\n${res.json()}`);
  //   }

  //   if (res.status === 404) {
  //     throw new NotFoundError(`not found (${url})`);
  //   }

  //   if (res.status === 429) {
  //     if (this.config.retry || this.config.retry === undefined) {
  //       const retry = res.headers.get(`retry-after`) as unknown as number; // get retry time

  //       // log ratelimit (if enabled)
  //       if (this.config.logRetry || this.config.logRetry === undefined)
  //         // eslint-disable-next-line no-console
  //         console.error(`hit ratelimit, retrying in ${retry} seconds`);

  //       await this.sleep(retry * 1000); // wait for retry time
  //       res = await this.fetch(url, init); // retry request
  //     } else {
  //       throw new RatelimitError('hit ratelimit');
  //     }
  //     return res;
  //   }

  //   if (res.status === 500) {
  //     throw new InternalServerError('internal server error');
  //   }

  //   return res;
  // }

  // create axios client, set interceptors, handle errors & auth
  private create(): AxiosInstance {
    const client = axios.create({ proxy: this.config.http?.proxy, validateStatus: () => true });

    // request interceptor
    client.interceptors.request.use(async (config) => {
      // add authorization, content
      config.headers = {
        Authorization: `Bearer ${await this.handleAuth()}`,
        // 'Content-Type': 'application/json',
        // Accept: 'application/json',
        'User-Agent':
          this.config.http?.userAgent || 'spotify.js https://github.com/backtrackapp/spotify.js',
        ...config.headers
      };

      return config;
    });

    // client.interceptors.response.use(
    //   (config) => config,
    //   (err) => {
    //     console.log('error');
    //     return err;
    //   }
    // );

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
   * @param {{Record<string, string> & RequestInit}} options Options.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async delete(
    slug: string,
    options?: { query?: Record<string, string> } & AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return await this.client.delete(this.getURL(slug, options?.query), options);
  }
}
