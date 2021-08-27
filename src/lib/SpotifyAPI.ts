import { PrivateConfig, SpotifyConfig } from '../interfaces/Config';
import { AlbumManager } from './album/AlbumManager';
import { ArtistManager } from './artist/ArtistManager';
import { TrackManager } from './track/TrackManager';
import { UserManager } from './user/UserManager';

export class SpotifyAPI {
  tracks: TrackManager;

  albums: AlbumManager;

  artists: ArtistManager;

  users: UserManager;

  private privateConfig: PrivateConfig = {};

  constructor(config: SpotifyConfig) {
    this.tracks = new TrackManager(config, this.privateConfig);
    this.albums = new AlbumManager(config, this.privateConfig);
    this.artists = new ArtistManager(config, this.privateConfig);
    this.users = new UserManager(config, this.privateConfig);
  }
}
