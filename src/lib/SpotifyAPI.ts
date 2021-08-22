import { SpotifyConfig } from '../interfaces/Config';
import { TrackManager } from './tracks/TrackManager';

export class SpotifyAPI {
  tracks: TrackManager;

  private privateConfig: PrivateConfig = {};

  constructor(config: SpotifyConfig) {
    this.tracks = new TrackManager(config, this.privateConfig);
  }
}
