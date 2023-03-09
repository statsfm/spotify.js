import { RecommendationsFilterOptions, RecommendationsResult } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class RecommendationsManager extends Manager {
  /**
   * @description Recommendations are generated based on the available information for a given seed entity and matched against similar artists and tracks. If there is sufficient information about the provided seeds, a list of tracks will be returned together with pool size details. For artists and tracks that are very new or obscure there might not be enough data to generate a list of tracks.
   * @param {SearchOptions} options The recommendation filters.
   * @returns {Promise<RecommendationsResult>} Returns a promise with all recommended tracks and seed options {@link RecommendationsResult}.
   */
  async get(options: RecommendationsFilterOptions): Promise<RecommendationsResult> {
    const query: Record<string, string | number> = {
      ...options, // TODO: parse numbers to strings
      seed_tracks: options.seed_tracks?.join(','),
      seed_artists: options.seed_artists?.join(','),
      seed_genres: options.seed_genres?.join(',')
    };

    const res = await this.http.get('/recommendations', {
      // @ts-expect-error expect numbers as values
      query
    });

    return res.data as RecommendationsResult;
  }
}
