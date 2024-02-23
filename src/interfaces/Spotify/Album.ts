import { Artist, ArtistSimplified } from './Artist';
import { ExternalUrls, ExternalIds, PagingObject } from './shared';
import { Copyright } from './shared/Copyrights';
import { Image } from './shared/Image';
import { TrackSimplified } from './Track';

export interface AlbumBase {
  /**
   * The type of the album.
   */
  album_type: 'album' | 'single' | 'compilation';
  /**
   * The number of tracks in the album.
   */
  total_tracks: number;
  /**
   * The markets in which the album is available: [ISO 3166-1 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes.
   * Note that an album is considered available in a market when at least 1 of its tracks is available in that market.
   */
  available_markets: string[];
  /**
   * Known external URLs for this album.
   */
  external_urls: ExternalUrls;
  /**
   * A link to the Web API endpoint providing full details of the album.
   */
  href: string;
  /**
   * The Spotify ID for the album.
   */
  id: string;
  /**
   * The cover art for the album in various sizes, widest first.
   */
  images: Image[];
  /**
   * The name of the album.
   * In case of an album takedown, the value may be an empty string.
   */
  name?: string;
  /**
   * The date the album was first released.
   */
  release_date: string;
  /**
   * The precision with which `release_date` value is known.
   */
  release_date_precision: 'year' | 'month' | 'day';
  /**
   * Included in the response when a content restriction is applied.
   */
  restrictions?: {
    /**
     * The reason for the restriction.
     * Albums may be restricted if the content is not available in a given market, to the user's subscription type, or when the user's account is set to not play explicit content.
     */
    reason: 'market' | 'product' | 'explicit';
  };
  /**
   * The object type.
   */
  type: 'album';
  /**
   * The Spotify URI for the album.
   */
  uri: string;
  /**
   * The popularity of the artist. The value will be between 0 and 100, with 100 being the most popular. The artist's popularity is calculated from the popularity of all the artist's tracks.
   */
  popularity: number;
  /**
   * Known external IDs for the track.
   */
  external_ids?: ExternalIds;
  /**
   * The label for the album.
   */
  label: string;
  /**
   * The genres of the album.
   */
  genres: string[];
  /**
   * The copyright statements of the album.
   */
  copyrights: Copyright[];
}

export interface AlbumSimplified extends AlbumBase {
  /**
   * **The field is present when getting an artist's albums.**
   * Compare to album_type this field represents relationship between the artist and the album.
   */
  album_group?: 'album' | 'single' | 'compilation' | 'appears_on';
  /**
   * The artists of the album.
   */
  artists: ArtistSimplified[];
}

export interface Album extends AlbumBase {
  /**
   * The artists of the album.
   */
  artists: Artist[];
  /**
   * The tracks of the album.
   */
  tracks: PagingObject<TrackSimplified>;
}
