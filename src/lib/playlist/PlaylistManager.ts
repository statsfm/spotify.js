import {
  Markets,
  PagingObject,
  PagingOptions,
  Playlist,
  PlaylistTrack
} from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class PlaylistManager extends Manager {
  /**
   * Get a playlist owned by a Spotify user. Use `options.fields` to get a smaller response.
   * @param {string} id The [Spotify ID](https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids) of the playlist.
   * @param {{ fields: string; market?: Markets }} options Additional options.
   * @param {string} options.fields Filters for the query: a comma-separated list of the fields to return.
   * If omitted, all fields are returned.
   * - For example, to get just the playlist''s description and URI: `fields: description,uri`.
   * - A dot separator can be used to specify non-reoccurring fields, while parentheses can be used to specify reoccurring fields within objects. For example, to get just the added date and user ID of the adder: `fields: tracks.items(added_at,added_by.id)`.
   * - Use multiple parentheses to drill down into nested objects, for example: `fields: tracks.items(track(name,href,album(name,href)))`.
   * - Fields can be excluded by prefixing them with an exclamation mark, for example: `fields: tracks.items(track(name,href,album(!name,href)))`.
   * @returns {Promise<Playlist>} A playlist object.
   */
  async get(
    id: string,
    options?: {
      fields?: string;
      market?: Markets;
    }
  ): Promise<Playlist> {
    const query: Record<string, string> = {};

    if (options?.market) query.market = options.market;
    if (options?.fields) query.fields = options.fields;

    const res = await this.http.get(`/playlists/${id}`, {
      query
    });

    return res.data as Playlist;
  }

  /**
   *
   * @param id Playlist ID.
   * @param options Object with additional options.
   * @param {string} options.fields Filters for the query: a comma-separated list of the fields to return.
   * If omitted, all fields are returned.
   * - For example, to get just the playlist''s description and URI: `fields: description,uri`.
   * - A dot separator can be used to specify non-reoccurring fields, while parentheses can be used to specify reoccurring fields within objects. For example, to get just the added date and user ID of the adder: `fields: tracks.items(added_at,added_by.id)`.
   * - Use multiple parentheses to drill down into nested objects, for example: `fields: tracks.items(track(name,href,album(name,href)))`.
   * - Fields can be excluded by prefixing them with an exclamation mark, for example: `fields: tracks.items(track(name,href,album(!name,href)))`.
   * @param {Markets} options.market An ISO 3166-1 alpha-2 country code.
   * If a country code is specified, only episodes that are available in that market will be returned.
   * If a valid user access token is specified in the request header, the country associated with the user account will take priority over this parameter.
   * Note: If neither market or user country are provided, the content is considered unavailable for the client.
   * @returns {Promise<PagingObject<PlaylistTrack>>} A paging object of tracks.
   */
  async items(
    id: string,
    options?: PagingOptions & {
      market?: Markets;
      fields?: string;
    }
  ): Promise<PagingObject<PlaylistTrack>> {
    const query: Record<string, string> = {};

    if (options?.market) query.market = options.market;
    if (options?.fields) query.fields = options.fields;

    const res = await this.http.get(`/playlists/${id}/tracks`, { query });

    return res.data as PagingObject<PlaylistTrack>;
  }
}
