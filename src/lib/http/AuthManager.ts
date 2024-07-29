/* eslint-disable no-console */
import axios, { AxiosInstance } from 'axios';
import { AuthError } from '../../interfaces/Errors';
import { PrivateConfig, SpotifyConfig } from '../../interfaces/Config';

const accountsApiUrl = 'https://accounts.spotify.com/api';

const accessTokenExpireTTL = 60 * 60 * 1_000; // 1hour

export class AuthManager {
  protected client: AxiosInstance;

  constructor(
    // eslint-disable-next-line no-unused-vars
    protected config: SpotifyConfig,
    // eslint-disable-next-line no-unused-vars
    protected privateConfig: PrivateConfig
  ) {
    this.client = axios.create({
      baseURL: accountsApiUrl,
      auth: {
        username: this.config.clientCredentials?.clientId,
        password: this.config.clientCredentials?.clientSecret
      },
      validateStatus: () => true
    });
  }

  /**
   * @description Get a refresh token.
   * @param {number} retryAttempt Number of of retries.
   * @returns {string} Returns the refresh token.
   */
  private async refreshToken(retryAttempt): Promise<string> {
    if (
      !this.config.clientCredentials.clientId ||
      !this.config.clientCredentials.clientSecret ||
      !this.config.refreshToken
    ) {
      throw new AuthError(
        'Missing information needed to refresh token, required: client id, client secret, refresh token'
      );
    }

    const response = await this.client.post(
      '/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken
      })
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

    if (retryAttempt >= 5) {
      if (statusCode >= 500 && statusCode < 600) {
        throw new AuthError(`Failed to refresh token: server error (${statusCode})`);
      }

      throw new AuthError(`Request retry attempts exceeded, failed with status code ${statusCode}`);
    }

    if (this.config.debug) {
      console.log(
        `Failed to refresh token: got (${statusCode}) response. Retrying... (${retryAttempt + 1})`
      );
    }

    return await this.refreshToken(retryAttempt + 1);
  }

  /**
   * Get authorization token with client credentials flow.
   * @param {number} retryAttempt Number of of retries.
   * @returns {string} Returns the authorization token.
   */
  private async requestToken(retryAttempt): Promise<string> {
    const response = await this.client.post(
      '/token',
      new URLSearchParams({
        grant_type: 'client_credentials'
      })
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

    if (retryAttempt >= 5) {
      if (statusCode >= 500 && statusCode < 600) {
        throw new AuthError(`Failed to get token: server error (${statusCode})`);
      }

      throw new AuthError(`Request retry attempts exceeded, failed with status code ${statusCode}`);
    }

    if (typeof this.config.debug === 'boolean' && this.config.debug === true) {
      console.log(
        `Failed to get token: got (${statusCode}) response. retrying... (${retryAttempt + 1})`
      );
    }

    return await this.requestToken(retryAttempt + 1);
  }

  /**
   * @description Handles the auth tokens.
   * @returns {string} Returns a auth token.
   */
  async getToken(): Promise<string> {
    if (this.config.accessToken) {
      // check if token is expired
      if (Date.now() < this.privateConfig.tokenExpireAt) {
        // return already defined access token
        return this.config.accessToken;
      }

      // reset token to force trigger refresh
      this.config.accessToken = undefined;
    }

    // refresh token
    if (
      this.config.clientCredentials?.clientId &&
      this.config.clientCredentials?.clientSecret &&
      this.config.refreshToken
    ) {
      const accessToken = await this.refreshToken(1);

      this.config.accessToken = accessToken;
      this.privateConfig.tokenExpireAt = Date.now() + accessTokenExpireTTL;

      return accessToken;
    }

    // add credentials flow
    if (this.config.clientCredentials?.clientId && this.config.clientCredentials?.clientSecret) {
      const accessToken = await this.requestToken(1);

      this.config.accessToken = accessToken;
      this.privateConfig.tokenExpireAt = Date.now() + accessTokenExpireTTL;

      return accessToken;
    }

    throw new AuthError('auth failed: missing information to handle auth');
  }
}
