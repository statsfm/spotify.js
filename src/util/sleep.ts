/**
 * Sleep function.
 * @param {number} delay Delay in milliseconds.
 */
export const sleep = (delay: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, delay));
