import { SpotifyConfig } from 'src/interfaces/Config';
import { URLSearchParams } from 'url';

export class Manager {
  protected config: SpotifyConfig;

  constructor(config: SpotifyConfig) {
    this.config = config;
  }

  protected getURL(slug: string, query?: Record<string, string>): string {
    return `https://api.spotify.com/v1${slug}${new URLSearchParams(query).toString()}`;
  }
}
