import { Track } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class TrackManager extends Manager {
  /**
   * Get a track by ID.
   * @param id The ID of the track.
   */
  async get(id: string): Promise<Track> {
    const res = await this.http.get(`/tracks/${id}`);

    return (await res.json()) as Track;
  }

  /**
   * Get multiple tracks by ID.
   * @param ids Array of IDs.
   */
  async list(ids: string[]): Promise<Track[]> {
    const res = await this.http.get('/tracks', { query: { ids: ids.join(',') } });

    return (await res.json()).tracks as Track[];
  }
}
