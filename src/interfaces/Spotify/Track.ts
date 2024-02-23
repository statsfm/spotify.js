import { AlbumSimplified } from './Album';
import { ArtistSimplified } from './Artist';
import { ExternalIds } from './shared/ExternalIds';
import { ExternalUrls } from './shared/ExternalUrls';

export interface TrackSimplified {
  /**
   * The artists who performed the track.
   */
  artists: ArtistSimplified[];
  /**
   * The markets in which the album is available: [ISO 3166-1 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes.
   * Note that an album is considered available in a market when at least 1 of its tracks is available in that market.
   */
  available_markets: string[];
  /**
   * The disc number (usually 1 unless the album consists of more than one disc).
   */
  disc_number: number;
  /**
   * The track length in milliseconds.
   */
  duration_ms: number;
  /**
   * Whether or not the track has explicit lyrics.
   */
  explicit: boolean;
  /**
   * Known external URLs for this track.
   */
  external_urls: ExternalUrls;
  /**
   * A link to the Web API endpoint providing full details of the track.
   */
  href: string;
  /**
   * The Spotify ID for the track.
   */
  id: string;
  /**
   * Included in the response when a content restriction is applied.
   */
  restrictions?: {
    reason: 'market' | 'product' | 'explicit';
  };
  /**
   * Name of the track.
   */
  name: string;
  /**
   * A link to a 30 second preview (MP3 format) of the track.
   */
  preview_url: string | null;
  /**
   * The number of the track. If an album has several discs, the track number is the number on the specified disc.
   */
  track_number: number;
  /**
   * The object type: "track".
   */
  type: 'track';
  /**
   * The Spotify URI for the track.
   */
  uri: string;
  /**
   * Whether or not the track is from a local file.
   */
  is_local: boolean;
  /**
   * Part of the response when [Track Relinking](https://developer.spotify.com/documentation/web-api/concepts/track-relinking) is applied. If true, the track is playable in the given market. Otherwise false.
   */
  is_playable?: boolean;
  /**
   * Part of the response when [Track Relinking](https://developer.spotify.com/documentation/web-api/concepts/track-relinking) is applied, and the requested track has been replaced with different track. The track in the linked_from object contains information about the originally requested track.
   */
  linked_from?: {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    type: string;
    uri: string;
  };
}

export interface Track extends TrackSimplified {
  /**
   * The album on which the track appears.
   */
  album: AlbumSimplified;
  /**
   * Known external IDs for the track.
   */
  external_ids: ExternalIds;
  /**
   * The popularity of the track. The value will be between 0 and 100, with 100 being the most popular.
   */
  popularity: number;
}
