import { Artist } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class ArtistManager extends Manager { 
  /**
   * @description Get a artist by ID.
   * @param {string} id
   * @returns {Promise<Artist[]>} Returns a promise with a single {@link Artist}.
   */
  async get(id: string): Promise<Artist> {
    const res = await this.http.get(`/artists/${id}`);

    return (await res.json()) as Artist;
  }

  /**
   * @description Get multiple artists by ID.
   * @param {string[]} ids Array of IDs.
   * @returns {Promise<Artist[]>} Returns a promise with an array of {@link Artist}s.
   */
  async list(ids: string[]): Promise<Artist[]> {
    const res = await this.http.get('/artists', { query: { ids: ids.join(',') } });

    return (await res.json()).artists as Artist[];
  }
}
