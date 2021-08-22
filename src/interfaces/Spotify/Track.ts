import { SimplifiedAlbum } from './Album';
import { Artist } from './Artist';
import { ExternalIds } from './shared/ExternalIds';
import { ExternalUrls } from './shared/ExternalUrls';

export interface Track {
  album: SimplifiedAlbum;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: ExternalIds;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
}
