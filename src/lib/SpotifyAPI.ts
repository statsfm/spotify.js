import { PrivateConfig, SpotifyConfig } from '../interfaces/Config';
import { AlbumManager } from './album/AlbumManager';
import { ArtistManager } from './artist/ArtistManager';
import { AudioManager } from './audio/AudioManager';
import { MeManager } from './me/MeManager';
import { SearchManager } from './search/SearchManager';
import { TrackManager } from './track/TrackManager';
import { UserManager } from './user/UserManager';

export class SpotifyAPI {
  tracks: TrackManager;

  albums: AlbumManager;

  artists: ArtistManager;

  users: UserManager;

  me: MeManager;

  search: SearchManager;

  audio: AudioManager;

  private privateConfig: PrivateConfig = {};

  config: SpotifyConfig;

  constructor(config: SpotifyConfig) {
    this.config = config;
    this.tracks = new TrackManager(this.config, this.privateConfig);
    this.albums = new AlbumManager(this.config, this.privateConfig);
    this.artists = new ArtistManager(this.config, this.privateConfig);
    this.users = new UserManager(this.config, this.privateConfig);
    this.me = new MeManager(this.config, this.privateConfig);
    this.search = new SearchManager(this.config, this.privateConfig);
    this.audio = new AudioManager(this.config, this.privateConfig);
  }
}
