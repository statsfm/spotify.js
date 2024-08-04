import { PrivateConfig, SpotifyConfig } from '../interfaces/Config';
import { AlbumManager } from './album/AlbumManager';
import { ArtistManager } from './artist/ArtistManager';
import { AudioManager } from './audio/AudioManager';
import { HttpClient } from './http/HttpManager';
import { MeManager } from './me/MeManager';
import { PlaylistManager } from './playlist/PlaylistManager';
import { RecommendationsManager } from './recommendations/RecommendationsManager';
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

  recommendations: RecommendationsManager;

  audio: AudioManager;

  playlist: PlaylistManager;

  private privateConfig: PrivateConfig = {};

  constructor(public config: SpotifyConfig) {
    // TODO: remove for v2
    // eslint-disable-next-line deprecation/deprecation
    if (!this.config.accessToken && config.acccessToken) {
      // eslint-disable-next-line deprecation/deprecation
      this.config.accessToken = config.acccessToken;
    }

    const client = new HttpClient(this.config, this.privateConfig);

    this.tracks = new TrackManager(client);
    this.albums = new AlbumManager(client);
    this.artists = new ArtistManager(client);
    this.users = new UserManager(client);
    this.me = new MeManager(client);
    this.search = new SearchManager(client);
    this.recommendations = new RecommendationsManager(client);
    this.audio = new AudioManager(client);
    this.playlist = new PlaylistManager(client);
  }
}
