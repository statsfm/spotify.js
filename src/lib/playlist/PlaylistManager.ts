import { chunk } from '../../util';
import {
  FeaturedPlaylist,
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
   * Create a playlist for a Spotify user. (The playlist will be empty until you add tracks)
   * @param {string} userId The user's Spotify user ID.
   * @returns {Promise<Playlist>} A playlist object.
   */
  async create(
    userId: string,
    data: {
      name: string;
      public: boolean;
      collaborative: boolean;
      description: string;
    }
  ): Promise<Playlist> {
    const res = await this.http.post(`/users/${userId}/playlists`, data);

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

    if (options?.limit) query.limit = options.limit.toString();
    if (options?.offset) query.offset = options.offset.toString();

    if (options?.market) query.market = options.market;
    if (options?.fields) query.fields = options.fields;

    const res = await this.http.get(`/playlists/${id}/tracks`, { query });

    return res.data as PagingObject<PlaylistTrack>;
  }

  /**
   *
   * @param id Playlist ID.
   * @param {Array<string>} ids An array of Spotify IDs of the tracks to add
   * @param {number} position The position to insert the items, a zero-based index. For example, to insert the items in the first position: position=0; to insert the items in the third position: position=2.
   * If omitted, the items will be appended to the playlist. Items are added in the order they are listed in the query string or request body.
   */
  async add(id: string, ids: string[], position?: number): Promise<void> {
    if (ids?.length <= 0) {
      throw new Error('Length of ids must be greater than 0');
    }

    for (let chunk = 0; chunk < ids.length; chunk += 100) {
      const body: Record<string, unknown> = {};

      body.uris = ids.slice(chunk, chunk + 100).map((id) => `spotify:track:${id}`);

      if (position > 0) body.position = position.toString();

      // eslint-disable-next-line no-await-in-loop
      await this.http.post(`/playlists/${id}/tracks`, body);
    }

    // Adding items to a playlist must be done in the right order,
    // thus this code cannot be used
    // await Promise.all(
    //   chunk([...ids], 100).map(async (chunk) => {
    //     const body: Record<string, unknown> = {};

    //     body.uris = chunk.map((id) => `spotify:track:${id}`);

    //     if (position > 0) body.position = position.toString();

    //     await this.http.post(`/playlists/${id}/tracks`, body);
    //   })
    // );

    // TODO: return the right response
  }

  /**
   *
   * @param id Playlist ID.
   * @param {Array<string>} ids An array of Spotify IDs of the tracks to remove
   * @param {string} snapshot_id The playlist's snapshot ID against which you want to make the changes.
   * The API will validate that the specified items exist and in the specified positions and make the changes, even if more recent changes have been made to the playlist.
   */
  async remove(id: string, ids: string[], snapshot_id?: string): Promise<void> {
    if (ids?.length <= 0) {
      throw new Error('Length of ids must be greater than 0');
    }

    if (snapshot_id && ids.length > 100) {
      throw new Error('Snapshot id cannot be used on requests with 100+ tracks');
    }

    await Promise.all(
      chunk([...ids], 100).map(async (chunk) => {
        const body: Record<string, unknown> = {};

        body.tracks = chunk.map((id) => ({
          uri: `spotify:track:${id}`
        }));

        if (snapshot_id) body.snapshot_id = snapshot_id.toString();

        await this.http.delete(`/playlists/${id}/tracks`, body);
      })
    );

    // TODO: return the right response
  }

  /**
   *
   * @param id Playlist ID.
   * @param imageData Base64 encoded JPEG image data, maximum image payload size is 256 KB.
   */
  async addCoverImage(id: string, imageData: string): Promise<void> {
    if (id.length === 0) {
      throw new Error('Length of id must be greater than 0');
    }

    await this.http.put(`/playlists/${id}/images`, imageData, {
      headers: {
        'Content-Type': 'image/jpeg'
      }
    });
  }

  /**
   * Get a list of Spotify featured playlists (shown, for example, on a Spotify player's 'Browse' tab).
   *
   * @param options Object with additional options
   * @param options.country An ISO 3166-1 alpha-2 country code or the string from_token.
   * @param options.locale The desired language, consisting of an ISO 639 language code and an ISO 3166-1 alpha-2 country code, joined by an underscore.
   * @param options.timestamp A timestamp in ISO 8601 format: yyyy-MM-ddTHH:mm:ss. Use this parameter to specify the user's local time to get results tailored for that specific date and time in the day.
   * @param options.limit The maximum number of items to return. Default: 20. Minimum: 1. Maximum: 50.
   * @param options.offset The index of the first item to return. Default: 0 (the first object). Use with limit to get the next set of items.
   * @returns {Promise<FeaturedPlaylist>} A list of featured playlists
   */
  async getFeatured(
    options?: PagingOptions & {
      country?: string;
      locale?: string;
      timestamp?: string;
    }
  ): Promise<FeaturedPlaylist> {
    const res = await this.http.get('/browse/featured-playlists', {
      query: {
        ...(options?.offset && { offset: String(options.offset) }),
        ...(options?.limit && { limit: String(options.limit) }),
        ...(options?.country && { country: options.country }),
        ...(options?.locale && { locale: options.locale }),
        ...(options?.timestamp && { timestamp: options.timestamp })
      }
    });

    return res.data as FeaturedPlaylist;
  }
}
