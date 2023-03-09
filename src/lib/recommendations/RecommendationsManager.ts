import { RecommendationsFilterOptions, RecommendationsResult } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class RecommendationsManager extends Manager {
  /**
   * @description Recommendations are generated based on the available information for a given seed entity and matched against similar artists and tracks. If there is sufficient information about the provided seeds, a list of tracks will be returned together with pool size details. For artists and tracks that are very new or obscure there might not be enough data to generate a list of tracks.
   * @param {SearchOptions} options The recommendation filters.
   * @returns {Promise<RecommendationsResult>} Returns a promise with all recommended tracks and seed options {@link RecommendationsResult}.
   */
  async get(options: RecommendationsFilterOptions): Promise<RecommendationsResult> {
    const query: Record<string, string> = {};
    Object.entries(options).forEach(([key, value]) => {
      query[key] = Number.isNaN(value) ? value : value.toString();
    });

    if (Array.isArray(options.seed_tracks)) {
      query.seed_tracks = options.seed_tracks?.join(',');
    }
    if (Array.isArray(options.seed_artists)) {
      query.seed_artists = options.seed_artists?.join(',');
    }
    if (Array.isArray(options.seed_genres)) {
      query.seed_genres = options.seed_genres?.join(',');
    }

    const res = await this.http.get('/recommendations', {
      query
    });

    return res.data as RecommendationsResult;
  }
}
