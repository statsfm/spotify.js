import { SpotifyConfig } from '../interfaces/Config';
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

  constructor(config: SpotifyConfig) {
    // eslint-disable-next-line deprecation/deprecation
    const { acccessToken, ...httpClientConfig } = config;

    // TODO: remove for v2
    if (!httpClientConfig.accessToken && acccessToken) {
      httpClientConfig.accessToken = acccessToken;
    }

    const client = new HttpClient(httpClientConfig, {});

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
