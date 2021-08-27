import { SearchItems, SearchOptions } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class SearchManager extends Manager {
  /**
   * Search the Spotify catalog for anything that matches the searchQuery.
   */
  async get(searchQuery: string, options?: SearchOptions): Promise<SearchItems> {
    let types: string[];

    if (!options?.include) {
      types = Object.keys(options.include);
    } else {
      types = Object.keys(options.include).filter((key) => options.include[key]);
    }

    const query: Record<string, string> = {
      q: searchQuery
    };

    query.type = types.join(',');
    if (options?.market) query.market = options.market;
    if (options?.limit) query.limit = options.limit.toString();
    if (options?.offset) query.offset = options.offset.toString();
    if (options?.includeExternal) query.include_external = options.includeExternal;

    const res = await this.http.get('/search', {
      query
    });

    return (await res.json()) as SearchItems;
  }
}
