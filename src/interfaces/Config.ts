import { AxiosProxyConfig } from 'axios';

export interface SpotifyConfig {
  clientCredentials?: {
    clientId?: string;
    clientSecret?: string;
  };
  acccessToken?: string;
  refreshToken?: string;
  /**
   * Retry request when ratelimit is hit.
   */
  retry?: boolean;
  /**
   * Log retries.
   */
  logRetry?: boolean;
  /**
   * HTTP options.
   */
  http?: {
    /**
     * HTTP proxy config.
     */
    proxy?: AxiosProxyConfig;
    /**
     * Set a custom user agent. Default: "spotify.js/<version> https://github.com/backtrackapp/spotify.js".
     */
    userAgent?: string;
  };
}

export interface PrivateConfig {
  tokenExpire?: Date;
}
