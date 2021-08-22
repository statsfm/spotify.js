export interface SpotifyConfig {
  clientCredentials?: {
    clientId?: string;
    clientSecret?: string;
  };
  acccessToken?: string;
  refreshToken?: string;
}

export interface PrivateConfig {
  tokenExpire?: Date;
}
