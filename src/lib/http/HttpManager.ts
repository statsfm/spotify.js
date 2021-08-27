import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import { URL, URLSearchParams } from 'url';
import { PrivateConfig, SpotifyConfig } from '../../interfaces/Config';

export class HttpClient {
  protected baseURL = 'https://api.spotify.com/v1';

  constructor(protected config: SpotifyConfig, protected privateConfig: PrivateConfig) {}

  protected getURL(slug: string, query?: Record<string, string>): string {
    const url = new URL(this.baseURL);
    url.pathname += slug;
    url.search = new URLSearchParams(query).toString();

    return url.toString();
  }

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

  private async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    const headers = {
      Authorization: `Bearer ${await this.handleAuth()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init.headers
    }; // add authorization, content-type and accept headers

    return await fetch(url, { ...init, headers });
  }

  async get(
    slug: string,
    options?: { query?: Record<string, string> } & RequestInit
  ): Promise<Response> {
    return await this.fetch(this.getURL(slug, options?.query), {
      method: 'GET',
      ...options
    });
  }

  async post(
    slug: string,
    options?: { query?: Record<string, string> } & RequestInit
  ): Promise<Response> {
    return await this.fetch(this.getURL(slug, options?.query), {
      method: 'POST',
      ...options
    });
  }

  async delete(
    slug: string,
    options?: { query?: Record<string, string> } & RequestInit
  ): Promise<Response> {
    return await this.fetch(this.getURL(slug, options?.query), {
      method: 'DELETE',
      ...options
    });
  }

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
