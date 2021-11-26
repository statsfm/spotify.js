import { SimplifiedPlaylist } from './Playlist';
import { Album, Artist, Track } from '.';
import { PagingObject } from './shared';

export interface SearchItems {
  tracks: PagingObject<Track>;
  artists: PagingObject<Artist>;
  albums: PagingObject<Album>;
  playlists: PagingObject<SimplifiedPlaylist>;
  // TODO: Add more types
  // shows: PagingObject<>;
  // episodes: PagingObject<>;
}
