import { PrivateConfig, SpotifyConfig } from '../interfaces/Config';
import { AlbumManager } from './album/AlbumManager';
import { TrackManager } from './track/TrackManager';

export class SpotifyAPI {
  tracks: TrackManager;

  album: AlbumManager;

  private privateConfig: PrivateConfig = {};

  constructor(config: SpotifyConfig) {
    this.tracks = new TrackManager(config, this.privateConfig);
    this.album = new AlbumManager(config, this.privateConfig);
  }
}
