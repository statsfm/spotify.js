import { Artist } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class ArtistManager extends Manager {
  async get(id: string): Promise<Artist> {
    const res = await this.http.get(`/artists/${id}`);

    return (await res.json()) as Artist;
  }

  async list(ids: string[]): Promise<Artist[]> {
    const res = await this.http.get('/artists', { query: { ids: ids.join(',') } });

    return (await res.json()).artists as Artist[];
  }
}
