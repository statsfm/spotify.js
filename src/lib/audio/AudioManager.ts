import { AudioAnalysis } from '../../interfaces/Spotify/AudioAnalysis';
import { AudioFeatures } from '../../interfaces/Spotify/AudioFeatures';
import { Manager } from '../Manager';

export class AudioManager extends Manager {
  /**
   * @description Get audio features for a track.
   * @param  {string} id The ID of the track.
   * @returns {Promise<AudioFeatures>} Returns a promise with a {@link AudioFeatures}.
   */
  async feature(id: string): Promise<AudioFeatures> {
    const res = await this.http.get(`/v1/audio-features/${id}`);

    return res.data as AudioFeatures;
  }

  /**
   * @description Get audio features for muliples tracks.
   * @param  {string[]} trackIds The IDs of the tracks.
   * @returns {Promise<AudioFeatures[]>} Returns a promise with a {@link AudioFeatures}.
   */
  async features(trackIds: string[]): Promise<AudioFeatures[]> {
    const res = await this.http.get('/v1/audio-features', {
      query: {
        ids: trackIds.join(',')
      }
    });

    return res.data.audio_features as AudioFeatures[];
  }

  /**
   * @description Get a detailed audio analysis for a single track identified by its unique Spotify ID.
   * @param  {string} id The ID of the track.
   * @returns {Promise<AudioAnalysis>} Returns a promise with a {@link AudioAnalysis}.
   */
  async analysis(id: string): Promise<AudioAnalysis> {
    const res = await this.http.get(`/v1/audio-analysis/${id}`);

    return res.data as AudioAnalysis;
  }
}
