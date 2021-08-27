export interface TopOptions {
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
