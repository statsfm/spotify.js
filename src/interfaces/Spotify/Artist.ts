import { Image } from './shared';
import { ExternalUrls } from './shared/ExternalUrls';
import { Followers } from './shared/Followers';

export interface ArtistSimplified {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface Artist extends ArtistSimplified {
  followers: Followers;
  genres: string[];
  images: Image[];
  popularity: number;
}
