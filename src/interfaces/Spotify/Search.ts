import { Album, Artist, Track } from '.';
import { Playlist } from './Playlist';
import { PagingObject } from './shared';

export interface SearchItems {
  tracks: PagingObject<Track>;
  artists: PagingObject<Artist>;
  albums: PagingObject<Album>;
  playlists: PagingObject<Playlist>;
  // TODO: Add more types
  // shows: PagingObject<>;
  // episodes: PagingObject<>;
}
