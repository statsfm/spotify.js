import { Track } from '../../interfaces';
import { Manager } from '../Manager';

export class TrackManager extends Manager {
  async get(id: string): Promise<Track> {
    const res = await this.http.get(`/tracks/${id}`);

    return (await res.json()) as Track;
  }

  async list(ids: string[]): Promise<Track[]> {
    const res = await this.http.get('/tracks', { ids: ids.join(',') });

    return (await res.json()).tracks as Track[];
  }
}
