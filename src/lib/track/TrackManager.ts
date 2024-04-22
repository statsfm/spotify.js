import { Track } from '../../interfaces/Spotify';
import { Manager } from '../Manager';
import { chunk } from '../../util';

export class TrackManager extends Manager {
  /**
   * @description Get a track by ID.
   * @param {string} id The ID of the track.
   * @returns {Promise<Track>} Returns a promise with a single {@link Track}.
   */
  async get(id: string): Promise<Track> {
    const res = await this.http.get(`/v1/tracks/${id}`);

    return res.data as Track;
  }

  /**
   * @description Get multiple tracks by ID.
   * @param {string[]} ids Array of IDs.
   * @returns {Promise<Track[]>} Returns a promise with {@link Track}s.
   */
  async list(ids: string[]): Promise<Track[]> {
    const tracks = await Promise.all(
      chunk([...ids], 50).map(async (chunk) => {
        const res = await this.http.get('/v1/tracks', { query: { ids: chunk.join(',') } });
        const json = res.data;

        return json.tracks as Track[];
      })
    );

    return [].concat(...tracks);
  }
}
