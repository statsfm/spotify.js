import { RecentlyPlayed } from 'src/interfaces/Spotify/RecentlyPlayed';
import { PrivateUser } from 'src/interfaces/Spotify/User';
import { Artist, Track } from '../../interfaces/Spotify';
import { CursorPagingObject, PagingObject } from '../../interfaces/Spotify/shared/PagingObject';
import { Manager } from '../Manager';

interface TopOptions {
  /**
   * Over what time frame the affinities are computed.
   * Valid values:
   * `long_term` (calculated from several years of data and including all new data as it becomes available),
   * `medium_term` (approximately last 6 months),
   * `short_term` (approximately last 4 weeks).
   * Default: medium_term.
   */
  timeRange?: 'long_term' | 'medium_term' | 'short_term';
  /**
   * The number of entities to return. Default: 20. Minimum: 1. Maximum: 50.
   */
  limit?: number;
  /**
   * The index of the first entity to return. Default: 0 (i.e., the first track).
   * Use with limit to get the next set of entities.
   */
  offset?: number;
}

export class MeManager extends Manager {
  /**
   * Get current user's top artists or tracks.
   * **Required scope**: user-top-read.
   */
  async top(type: 'artists', options?: TopOptions): Promise<PagingObject<Artist>>;

  async top(type: 'tracks', options?: TopOptions): Promise<PagingObject<Track>>;

  async top(type: 'artists' | 'tracks', options?: TopOptions): Promise<unknown> {
    const res = await this.http.get(`/me/top/${type}`, {
      query: {
        time_range: options?.timeRange,
        limit: options?.limit as unknown as string,
        offset: options?.offset as unknown as string
      }
    });

    return (await res.json()) as PagingObject<unknown>;
  }

  /**
   * Get current user's (private) data.
   * **Required scopes**: user-read-private, user-read-email.
   */
  async get(): Promise<PrivateUser> {
    const res = await this.http.get('/me');

    return (await res.json()) as PrivateUser;
  }

  /**
   * Get current user's recently played tracks.
   * **Required scope**: user-read-recently-played.
   */
  async recentlyPlayed(options?: {
    limit?: number;
    after?: number;
    before?: number;
  }): Promise<CursorPagingObject<RecentlyPlayed>> {
    const query: Record<string, string> = {
      limit: options?.limit ? (options.limit as unknown as string) : '20'
    };

    if (options?.after) query.after = options.after as unknown as string;
    if (options?.before) query.before = options.before as unknown as string;

    const res = await this.http.get(`/me/player/recently-played`, {
      query
    });

    const json = await res.json();

    const mappedJSON = json.items.map((item) => ({
      ...item,
      played_at: new Date(item.played_at)
    }));

    return mappedJSON as CursorPagingObject<RecentlyPlayed>;
  }
}
