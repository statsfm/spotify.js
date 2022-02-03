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
     * Set a custom user agent. Default: "spotify.js/<version> https://github.com/statsfm/spotify.js".
     */
    userAgent?: string;
    /**
     * Change the default outbind IP (can be IPV6 or IPV4).
     */
    localAddress?: string;
  };
}

export interface PrivateConfig {
  tokenExpire?: Date;
}
