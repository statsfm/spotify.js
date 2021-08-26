import { Album } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class AlbumManager extends Manager {
  /**
   * Get a album by ID.
   * @param id The ID of the album.
   */
  async get(id: string): Promise<Album> {
    const res = await this.http.get(`/albums/${id}`);

    return (await res.json()) as Album;
  }

  /**
   * Get multiple albums by ID.
   * @param ids Array of IDs.
   */
  async list(ids: string[]): Promise<Album[]> {
    const res = await this.http.get('/albums', { query: { ids: ids.join(',') } });

    return (await res.json()).albums as Album[];
  }
}
