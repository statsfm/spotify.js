import { chunk } from '../../util';
import {
  Album,
  Markets,
  PagingObject,
  PagingOptions,
  Track,
  NewReleases
} from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class AlbumManager extends Manager {
  /**
   * @description Get a album by ID.
   * @param {string} id The ID of the album.
   * @returns {Promise<Album>} Returns a promise with a single {@link Album}.
   */
  async get(id: string): Promise<Album> {
    const res = await this.http.get(`/v1/albums/${id}`);

    return res.data as Album;
  }

  /**
   * @description Get multiple albums by ID.
   * @param {string[]} ids Array of IDs.
   * @returns {Promise<Album[]>} Returns a promise with an array of {@link Album}s.
   */
  async list(ids: string[]): Promise<Album[]> {
    const albums = await Promise.all(
      chunk([...ids], 20).map(async (chunk) => {
        const res = await this.http.get('/v1/albums', { query: { ids: chunk.join(',') } });
        const json = res.data;

        return json.albums as Album[];
      })
    );

    return [].concat(...albums);
  }

  async tracks(
    id: string,
    options?: PagingOptions & { market?: Markets }
  ): Promise<PagingObject<Track>> {
    const query: Record<string, string> = {
      limit: options?.limit ? options.limit.toString() : '20',
      offset: options?.offset ? options.offset.toString() : '0'
    };

    if (options.market) query.market = options.market;

    const res = await this.http.get(`/v1/albums/${id}/tracks`, { query });

    return res.data as PagingObject<Track>;
  }

  async newReleases(options?: PagingOptions & { country?: Markets }): Promise<NewReleases> {
    const query: Record<string, string> = {
      limit: options?.limit?.toString() || '20',
      offset: options?.offset?.toString() || '0'
    };

    const res = await this.http.get('/v1/browse/new-releases', { query });

    return res.data as NewReleases;
  }
}
