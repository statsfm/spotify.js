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
   * @param {Markets} options.market An ISO 3166-1 alpha-2 country code.
   * If a country code is specified, only episodes that are available in that market will be returned.
   * If a valid user access token is specified in the request header, the country associated with the user account will take priority over this parameter.
   * Note: If neither market or user country are provided, the content is considered unavailable for the client.
   * @returns {Promise<PagingObject<AlbumSimplified[]>>} Returns a promise with an array of {@link Album}s.
   */
  async albums(
    id: string,
    options?: PagingOptions & {
      include?: { album?: boolean; single?: boolean; appears_on?: boolean; compilation?: boolean };
      market?: Markets;
    }
  ): Promise<PagingObject<AlbumSimplified>> {
    let include_groups: string[] = [];

    if (options?.include) {
      include_groups = Object.keys(options.include).filter((key) => options.include[key]);
    } else {
      include_groups = ['album', 'single', 'appears_on', 'compilation'];
    }

    const query: Record<string, string> = {
      include_groups: include_groups.join(','),
      limit: options?.limit?.toString() || '20',
      offset: options?.offset?.toString() || '0',
      market: options?.market || 'from_token'
    };

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
   * @param {Markets} market An ISO 3166-1 alpha-2 country code.
   * If a country code is specified, only episodes that are available in that market will be returned.
   * If a valid user access token is specified in the request header, the country associated with the user account will take priority over this parameter.
   * Note: If neither market or user country are provided, the content is considered unavailable for the client.
   * @returns {Promise<Track[]>} Returns a promise with an array of {@link Track}s.
   */
  async topTracks(id: string, market?: Markets): Promise<Track[]> {
    const query: Record<string, string> = {
      market: market || 'from_token'
    };

    const res = await this.http.get(`/artists/${id}/top-tracks`, {
      query
    });

    return res.data.tracks as Track[];
  }
}
