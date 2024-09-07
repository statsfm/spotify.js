import { PlayerState } from '../../interfaces/Spotify/Player';
import {
  RecentlyPlayed,
  UserPrivate,
  Artist,
  Track,
  CursorPagingObject,
  PagingObject,
  TopOptions,
  Playlist,
  Markets,
  LibraryTrack
} from '../../interfaces/Spotify';

import { Manager } from '../Manager';

export class MeManager extends Manager {
  /**
   * @description Get current user's top artists.
   * @param {string} type
   * @param {TopOptions} options?
   * @returns {Promise<PagingObject<Artist>>} Returns a promise with the paginated {@link Artist}.
   */
  // eslint-disable-next-line no-unused-vars
  async top(type: 'artists', options?: TopOptions): Promise<PagingObject<Artist>>;

  /**
   * @description Get current user's top tracks.
   * @param {string} type
   * @param {TopOptions} options?
   * @returns {Promise<PagingObject<Track>>} Returns a promise with the paginated {@link Track}.
   */
  // eslint-disable-next-line no-unused-vars
  async top(type: 'tracks', options?: TopOptions): Promise<PagingObject<Track>>;

  /**
   * @description Get the current user's top tracks or artists.
   * @param  {string} type
   * @param  {TopOptions} options
   */
  async top(type: 'artists' | 'tracks', options?: TopOptions): Promise<unknown> {
    const res = await this.http.get(`/v1/me/top/${type}`, {
      query: {
        time_range: options?.timeRange,
        limit: options?.limit as unknown as string,
        offset: options?.offset as unknown as string
      }
    });

    return res.data as PagingObject<unknown>;
  }

  /**
   * @description Get current user's (private) data. (required scropes: user-read-private, user-read-email).
   * @returns {Promise<UserPrivate>}
   */
  async get(): Promise<UserPrivate> {
    const res = await this.http.get('/v1/me');

    return res.data as UserPrivate;
  }

  /**
   * @description Get current user's recently played tracks. (required scoped: user-read-recently-played).
   * @param {limit?:number after?:number;before?:number} options?
   * @returns {Promise<CursorPagingObject<RecentlyPlayed>>} Returns a promise with the {@link RecentlyPlayed} items.
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

    const res = await this.http.get(`/v1/me/player/recently-played`, {
      query
    });

    const json = res.data;

    json.items = json.items.map((item) => ({
      ...item,
      played_at: new Date(item.played_at)
    }));

    return json as CursorPagingObject<RecentlyPlayed>;
  }

  /**
   * @description Get information about the user’s current playback state, including track or episode, progress, and active device.
   * @returns {Promise} Returns a promise with the current playback state.
   */
  async getPlaybackState(): Promise<PlayerState> {
    const res = await this.http.get(`/v1/me/player`);

    const json = res.data;

    return json as PlayerState;
  }

  /**
   * @description Check if one or more tracks is saved in the current user's library. (required scropes: user-library-read).
   * @returns {Promise<boolean[]>} Returns a promise with the an array of booleans.
   */
  async savedTracks(options?: {
    market?: Markets;
    limit?: number;
    offset?: number;
  }): Promise<CursorPagingObject<LibraryTrack>> {
    const query: Record<string, string> = {};

    if (options?.market) query.market = options.market.toString();
    if (options?.limit) query.limit = options.limit.toString();
    if (options?.offset) query.offset = options.offset.toString();

    const res = await this.http.get(`/v1/me/tracks`, {
      query
    });

    return res.data as CursorPagingObject<LibraryTrack>;
  }

  /**
   * @description Check if one or more tracks is saved in the current user's library. (required scropes: user-library-read).
   * @returns {Promise<boolean[]>} Returns a promise with the an array of booleans.
   */
  async containTracks(ids: string[]): Promise<boolean[]> {
    const res = await this.http.get(`/v1/me/tracks/contains`, {
      query: { ids: ids.join(',') }
    });

    return res.data as boolean[];
  }

  /**
   * @description Save multiple tracks by ID. (required scropes: user-library-read).
   * @param {string} ids Array of IDs.
   */
  async saveTracks(ids: string[]): Promise<void> {
    // Use an async loop to preserve the order of saves
    for (let i = 0; i < ids.length; i += 50) {
      await this.http.put(`/v1/me/tracks`, {
        ids: ids.slice(i, i + 50)
      });
    }
  }

  /**
   * @description Remove multiple saved tracks by ID. (required scropes: user-library-read).
   * @param {string} ids Array of IDs.
   */
  async unsaveTracks(ids: string[]): Promise<void> {
    // Use an async loop to preserve the order of unsaves
    for (let i = 0; i < ids.length; i += 50) {
      await this.http.delete(`/v1/me/tracks`, {
        query: { ids: ids.slice(i, i + 50).join(',') }
      });
    }
  }

  async playlists(options?: {
    limit?: number;
    offset?: number;
  }): Promise<CursorPagingObject<Playlist>> {
    const query: Record<string, string> = {};

    if (options?.limit) query.limit = options.limit.toString();
    if (options?.offset) query.offset = options.offset.toString();

    const res = await this.http.get(`/v1/me/playlists`, {
      query
    });

    return res.data as CursorPagingObject<Playlist>;
  }

  /**
   * @description Remove the current user as a follower of a playlist.
   * @param {string} id The Spotify ID of the playlist to unfollow.
   */
  async unfollowPlaylist(id: string): Promise<void> {
    await this.http.delete(`/v1/playlists/${id}/followers`, {});
  }
}
