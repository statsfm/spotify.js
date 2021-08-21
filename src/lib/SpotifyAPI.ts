import { SpotifyConfig } from '../interfaces/Config';
import { TrackManager } from './tracks/TrackManager';

export class SpotifyAPI {
  tracks: TrackManager;

  constructor(config: SpotifyConfig) {
    this.tracks = new TrackManager(config);
  }
}
