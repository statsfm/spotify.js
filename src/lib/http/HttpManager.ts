import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import { URL, URLSearchParams } from 'url';
import { PrivateConfig, SpotifyConfig } from '../../interfaces/Config';

export class HttpClient {
  protected baseURL = 'https://api.spotify.com/v1';

  constructor(protected config: SpotifyConfig, protected privateConfig: PrivateConfig) {}

  /**
   * @param {string} slug
   * @param {string} query
   * @returns {string} Returns the full url.
   */
  protected getURL(slug: string, query?: Record<string, string>): string {
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
      throw new Error('missing information needed to refresh token');
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
    throw new Error('auth error');
  }

  /**
   * @description Fetches the url.
   * @param  {RequestInfo} url The url to fetch.
   * @param  {RequestInit} init Options.
   * @returns {Promise<Response>} Returns a promise with the response.
   */
  private async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    const headers = {
      Authorization: `Bearer ${await this.handleAuth()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init.headers
    }; // add authorization, content-type and accept headers

    return await fetch(url, { ...init, headers });
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
