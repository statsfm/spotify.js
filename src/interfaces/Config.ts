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
}

export interface PrivateConfig {
  tokenExpire?: Date;
}
