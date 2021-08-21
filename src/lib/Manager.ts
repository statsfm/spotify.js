import { SpotifyConfig } from 'src/interfaces/Config';

export class Manager {
  config: SpotifyConfig;

  constructor(config: SpotifyConfig) {
    this.config = config;
  }
}
