import { PrivateConfig, SpotifyConfig } from '../interfaces/Config';
import { AlbumManager } from './album/AlbumManager';
import { ArtistManager } from './artist/ArtistManager';
import { TrackManager } from './track/TrackManager';

export class SpotifyAPI {
  tracks: TrackManager;

  album: AlbumManager;

  artists: ArtistManager;

  private privateConfig: PrivateConfig = {};

  constructor(config: SpotifyConfig) {
    this.tracks = new TrackManager(config, this.privateConfig);
    this.album = new AlbumManager(config, this.privateConfig);
    this.artists = new ArtistManager(config, this.privateConfig);
  }
}
