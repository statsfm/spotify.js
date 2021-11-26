import { PagingObject } from 'src';
import { ExternalUrls, Followers, Image, Track, UserPublic } from '.';

export interface SimplifiedPlaylist {
  collaborative: boolean;
  description?: string;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: UserPublic;
  public: boolean;
  snapshot_id: string;
  tracks: { href: string; total: number };
  type: string;
  uri: string;
}

export interface Playlist {
  collaborative: boolean;
  description?: string;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: UserPublic;
  public: boolean;
  snapshot_id: string;
  tracks: PagingObject<Track>;
  type: string;
  uri: string;
}
