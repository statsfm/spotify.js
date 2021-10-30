export interface SearchOptions {
  /**
   * List of item types to search across.
   */
  include: {
    track?: boolean;
    artist?: boolean;
    album?: boolean;
    playlist?: boolean;
    show?: boolean;
    episode?: boolean;
  };
  /**
   * If include_external is specified the response will include any relevant audio content that is hosted externally.
   * By default external content is filtered out from responses.
   */
  includeExternal?: 'audio';
  /**
   * Maximum number of results to return.
   * Minimum: 1. Maximum: 50. Default: 20.
   * **Note**: The limit is applied within each type, not on the total response.
   */
  limit?: number;
  /**
   * An ISO 3166-1 alpha-2 country code or the string `from_token`.
   * If market is set to `from_token`, and a valid access token is specified in the request header, only content playable in the country associated with the user account, is returned.
   */
  market?: string;
  /**
   * The index of the first result to return.
   * Maximum: 1000. Default: 0.
   */
  offset?: number;
}
