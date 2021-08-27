import { RecentlyPlayed } from 'src/interfaces/Spotify';
import {
  PrivateUser,
  Artist,
  Track,
  CursorPagingObject,
  PagingObject,
  TopOptions
} from '../../interfaces/Spotify';

import { Manager } from '../Manager';

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
