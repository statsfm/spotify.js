import type { AxiosError } from 'axios';

export type HttpMethod = 'GET' | 'PUT' | 'HEAD' | 'OPTIONS' | 'DELETE';

export interface RetryConfig {
  /**
   * The number of times to retry the request.  Defaults to 3.
   */
  retry?: number;

  /**
   * The amount of time to initially delay the retry.  Defaults to 100.
   */
  retryDelay?: number;

  /**
   * The HTTP Methods that will be automatically retried.
   * Defaults to ['GET','PUT','HEAD','OPTIONS','DELETE']
   */
  httpMethodsToRetry?: HttpMethod[];

  /**
   * The HTTP response status codes that will automatically be retried.
   * Defaults to: [[100, 199], [429, 429], [500, 599]]
   */
  statusCodesToRetry?: [number, number][];

  /**
   * Function to invoke when a retry attempt is made.
   */
  onRetryAttempt?: (error: AxiosError) => void;

  /**
   * Function to invoke which determines if you should retry
   */
  shouldRetry?: (error: AxiosError, config: RetryConfig) => boolean;

  /**
   * When there is no response, the number of retries to attempt. Defaults to 2.
   */
  noResponseRetries?: number;

  /**
   * Backoff Type; 'linear', 'static' or 'exponential'.
   */
  backoffType?: 'linear' | 'static' | 'exponential';

  /**
   * Whether to check for 'Retry-After' header in response and use value as delay. Defaults to true.
   */
  checkRetryAfter?: boolean;

  /**
   * Max permitted Retry-After value (in ms) - rejects if greater. Defaults to 5 mins.
   */
  maxRetryAfter?: number;

  /**
   * Ceiling for calculated delay (in ms) - delay will not exceed this value.
   */
  maxRetryDelay?: number;
}
