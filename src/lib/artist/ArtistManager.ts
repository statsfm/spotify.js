import { chunk } from '../../util';
import {
  AlbumSimplified,
  Artist,
  Markets,
  PagingObject,
  PagingOptions,
  Track
} from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class ArtistManager extends Manager {
  /**
   * @description Get a artist by ID.
   * @param {string} id
   * @returns {Promise<Artist[]>} Returns a promise with a single {@link Artist}.
   */
  async get(id: string): Promise<Artist> {
    const res = await this.http.get(`/artists/${id}`);

    return res.data as Artist;
  }

  /**
   * @description Get multiple artists by ID.
   * @param {string[]} ids Array of IDs.
   * @returns {Promise<Artist[]>} Returns a promise with an array of {@link Artist}s.
   */
  async list(ids: string[]): Promise<Artist[]> {
    const artists = await Promise.all(
      chunk([...ids], 50).map(async (chunk) => {
        const res = await this.http.get('/artists', { query: { ids: chunk.join(',') } });
        const json = res.data;

        return json.artists as Artist[];
      })
    );

    return [].concat(...artists);
  }

  /**
   * @description Get multiple albums from an artist by ID.
   * @param {string} id
   * @param {object} options
   * @returns {Promise<PagingObject<AlbumSimplified[]>>} Returns a promise with an array of {@link Album}s.
   */
  async albums(
    id: string,
    options?: PagingOptions & {
      album?: boolean;
      single?: boolean;
      appears_on?: boolean;
      compilation?: boolean;
      market?: Markets;
    }
  ): Promise<PagingObject<AlbumSimplified>> {
    const include_groups: string[] = [];

    if (options) {
      if (!options.album && !options.single && !options.appears_on && !options.compilation) {
        include_groups.push('album', 'single', 'appears_on', 'compilation');
      }

      if (options.album) {
        include_groups.push('album');
      }
      if (options.single) {
        include_groups.push('single');
      }
      if (options.appears_on) {
        include_groups.push('appears_on');
      }
      if (options.compilation) {
        include_groups.push('compilation');
      }
    } else if (!options) {
      include_groups.push('album', 'single', 'appears_on', 'compilation');
    }

    const query: Record<string, string> = {
      include_groups: include_groups.join(','),
      limit: options?.limit ? (options.limit as unknown as string) : '20',
      offset: options?.offset ? (options.offset as unknown as string) : '0'
    };

    if (options?.market) {
      query.market = options.market;
    }

    const res = await this.http.get(`/artists/${id}/albums`, {
      query
    });

    return res.data as PagingObject<AlbumSimplified>;
  }

  /**
   * @description Get related artists by ID.
   * @param {string} id
   * @returns {Promise<CursorPagingObject<Album[]>>} Returns a promise with an array of {@link Artist}s.
   */
  async related(id: string): Promise<Artist[]> {
    const res = await this.http.get(`/artists/${id}/related-artists`);
    return res.data.artists as Artist[];
  }

  /**
   * @description Get top tracks from artist by ID.
   * @param {string} id
   * @param {market: string} options?
   * @returns {Promise<Track[]>} Returns a promise with an array of {@link Track}s.
   */
  async topTracks(
    id: string,
    options?: {
      market: string;
    }
  ): Promise<Track[]> {
    const res = await this.http.get(`/artists/${id}/top-tracks`, {
      query: {
        market: options.market
      }
    });
    return res.data.tracks as Track[];
  }
}
