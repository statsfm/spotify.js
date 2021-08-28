import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import { URL, URLSearchParams } from 'url';
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

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(
          `${this.config.clientCredentials.clientId}:${this.config.clientCredentials.clientSecret}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken
      })
    });

    if (res.status !== 200) {
      throw new AuthError('refreshing token failed');
    }

    const json = await res.json(); // get JSON

    this.config.acccessToken = json.access_token; // save access token

    // save expire now
    this.privateConfig.tokenExpire = new Date(
      new Date().setSeconds(new Date().getSeconds() + 3600)
    );

    return this.config.acccessToken; // return token
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
    throw new AuthError('auth failed');
  }

  private sleep(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async handleError(
    res: Response,
    url: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    if (res.status === 401) {
      await this.handleAuth();

      res = await this.fetch(url, init);

      return res;
    }

    if (res.status === 400) {
      throw new BadRequestError(`bad request\n${await res.json()}`);
    }

    if (res.status === 403) {
      throw new ForbiddenError(`forbidden, are you sure you have the right scopes?\n${res.json()}`);
    }

    if (res.status === 404) {
      throw new NotFoundError(`not found (${url})`);
    }

    if (res.status === 429) {
      if (this.config.retry || this.config.retry === undefined) {
        const retry = res.headers.get(`retry-after`) as unknown as number; // get retry time

        // log ratelimit (if enabled)
        if (this.config.logRetry || this.config.logRetry === undefined)
          // eslint-disable-next-line no-console
          console.error(`hit ratelimit, retrying in ${retry} seconds`);

        await this.sleep(retry * 1000); // wait for retry time
        res = await this.fetch(url, init); // retry request
      } else {
        throw new RatelimitError('hit ratelimit');
      }
      return res;
    }

    if (res.status === 500) {
      throw new InternalServerError('internal server error');
    }

    return res;
  }

  /**
   * @description Fetches the url.
   * @param  {RequestInfo} url The url to fetch.
   * @param  {RequestInit} init Options.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  private async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    init = {
      ...init,
      headers: {
        Authorization: `Bearer ${await this.handleAuth()}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init.headers
      } // add authorization, content-type and accept headers
    };

    let res = await fetch(url, init);

    res = await this.handleError(res, url, init);
    return res;
  }

  /**
   * @param {string} slug The slug to get.
   * @param {Record<string, string> & RequestInit} options Options.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async get(
    slug: string,
    options?: { query?: Record<string, string> } & RequestInit
  ): Promise<Response> {
    return await this.fetch(this.getURL(slug, options?.query), {
      method: 'GET',
      ...options
    });
  }

  /**
   * @param {string} slug The slug to post.
   * @param {Record<string, string> & RequestInit} options Options.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async post(
    slug: string,
    options?: { query?: Record<string, string> } & RequestInit
  ): Promise<Response> {
    return await this.fetch(this.getURL(slug, options?.query), {
      method: 'POST',
      ...options
    });
  }

  /**
   * @param {string} slug The slug to delete.
   * @param {Record<string, string> & RequestInit} options Options.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async delete(
    slug: string,
    options?: { query?: Record<string, string> } & RequestInit
  ): Promise<Response> {
    return await this.fetch(this.getURL(slug, options?.query), {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * @param {string} slug The slug to update.
   * @param {Record<string, string> & RequestInit} options Options.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  async put(
    slug: string,
    options?: { query?: Record<string, string> } & RequestInit
  ): Promise<Response> {
    return await this.fetch(this.getURL(slug, options?.query), {
      method: 'PUT',
      ...options
    });
  }
}
