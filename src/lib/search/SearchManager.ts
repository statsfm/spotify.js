import { SearchItems, SearchOptions } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class SearchManager extends Manager {
  /**
   * @description Search the Spotify catalog for anything that matches the searchQuery.
   * @param {string} searchQuery The query you want to search for.
   * @param {SearchOptions} options The search options.
   * @returns {Promise<SearchItems>} Returns a promise with all the {@link SearchItems}.
   */
  async get(searchQuery: string, options: SearchOptions): Promise<SearchItems> {
    const types = Object.keys(options.include).filter((key) => options.include[key]);

    const query: Record<string, string> = {
      q: searchQuery,
      limit: options?.limit?.toString() || '20',
      offset: options?.offset?.toString() || '0',
      type: types.join(',')
    };

    if (options?.market) query.market = options.market;

    if (options?.includeExternal) query.include_external = options.includeExternal;

    const res = await this.http.get('/search', {
      query
    });

    return res.data as SearchItems;
  }
}
