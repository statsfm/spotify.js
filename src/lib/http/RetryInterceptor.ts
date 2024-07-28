import { isCancel } from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { RequestRetriesExceededError } from '../../interfaces/Errors';
import { HttpMethod, RetryConfig } from './RetryConfig';

type ConfigWithRetry = InternalAxiosRequestConfig & { retryAttempt: number };

const defaultRetryMethods: RetryConfig['httpMethodsToRetry'] = [
  'GET',
  'HEAD',
  'PUT',
  'OPTIONS',
  'DELETE'
];

// If this wasn't in the list of status codes where we want to automatically retry, return.
const defaultRetryRanges: RetryConfig['statusCodesToRetry'] = [
  // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
  // 1xx - Retry (Informational, request still processing)
  // 2xx - Do not retry (Success)
  // 3xx - Do not retry (Redirect)
  // 4xx - Do not retry (Client errors)
  // 429 - Retry ("Too Many Requests")
  // 5xx - Retry (Server errors)
  [100, 199],
  [429, 429],
  [500, 599]
];

/**
 * Parse the Retry-After header.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
 * @param header Retry-After header value
 * @returns {number} milliseconds, or undefined if invalid
 */
function parseRetryAfter(header: string): number | undefined {
  // Header value may be string containing integer seconds
  const value = Number(header);
  if (!Number.isNaN(value)) {
    return value * 1_000;
  }

  // Or HTTP date time string
  const dateTime = Date.parse(header);
  if (!Number.isNaN(dateTime)) {
    return dateTime - Date.now();
  }

  return undefined;
}

/**
 * Determine based on config if we should retry the request.
 * @param {AxiosError} error The AxiosError passed to the interceptor.
 */
export function shouldRetryRequest(
  error: AxiosError<unknown, unknown>,
  config: RetryConfig
): boolean {
  // If there's no config, or retries are disabled, return.
  if (!config || config.retry === 0) {
    return false;
  }

  const { retryAttempt } = error.config as ConfigWithRetry;

  // Check if this error has no response (ETIMEDOUT, ENOTFOUND, etc)
  if (!error.response && retryAttempt >= config.noResponseRetries) {
    throw new RequestRetriesExceededError(
      `Request exceeded all ${config.noResponseRetries} number of retry attempts`,
      error.config.url,
      error.response
    );
  }

  // Only retry with configured HttpMethods.
  if (
    !error.config?.method ||
    !config.httpMethodsToRetry?.includes(error.config.method.toUpperCase() as HttpMethod)
  ) {
    return false;
  }

  // If this wasn't in the list of status codes where we want
  // to automatically retry, return.
  if (error.response?.status) {
    let isInRange = false;
    const { status } = error.response;

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    for (const [min, max] of config.statusCodesToRetry!) {
      if (status >= min && status <= max) {
        isInRange = true;
        break;
      }
    }

    if (!isInRange) {
      return false;
    }
  }

  // If we are out of retry attempts, return
  if (retryAttempt >= config.retry) {
    throw new RequestRetriesExceededError(
      `Request exceeded all ${config.retry} number of retry attempts`,
      error.config.url,
      error.response
    );
  }

  return true;
}

function onFulfilled(result: AxiosResponse): AxiosResponse {
  return result;
}

export class RetryInterceptor {
  private readonly config: RetryConfig;

  constructor(config: RetryConfig = {}) {
    this.config = {
      retry: 3,
      retryDelay: 100,
      noResponseRetries: 2,
      checkRetryAfter: true,
      maxRetryAfter: 5 * 60_000,
      backoffType: 'exponential',
      shouldRetry: shouldRetryRequest,
      statusCodesToRetry: defaultRetryRanges,
      httpMethodsToRetry: defaultRetryMethods,
      ...config
    };
  }

  async onError(instance: AxiosInstance, error: AxiosError): Promise<AxiosResponse> {
    if (isCancel(error)) {
      throw error;
    }

    // Put the config back into the err
    const axiosError = error as AxiosError;

    (axiosError.config as ConfigWithRetry).retryAttempt ||= 0;

    // Determine if we should retry the request
    if (!this.config.shouldRetry(axiosError, this.config)) {
      throw axiosError;
    }

    // Create a promise that invokes the retry after the backOffDelay
    const onBackoffPromise = new Promise((resolve, reject) => {
      let delay = 0;
      // If enabled, check for 'Retry-After' header in response to use as delay
      if (this.config.checkRetryAfter && axiosError.response?.headers['retry-after']) {
        const retryAfter = parseRetryAfter(axiosError.response.headers['retry-after']);

        if (retryAfter && retryAfter > 0 && retryAfter <= this.config.maxRetryAfter) {
          delay = retryAfter;
        } else {
          reject(axiosError);
          return;
        }
      }

      // Now it's certain that a retry is supposed to happen. Incremenent the
      // counter, critical for linear and exp backoff delay calc. Note that
      // `config.currentRetryAttempt` is local to this function whereas
      // `(err.config as RaxConfig).raxConfig` is state that is tranferred across
      // retries. That is, we want to mutate `(err.config as
      // RaxConfig).raxConfig`. Another important note is about the definition of
      // `currentRetryAttempt`: When we are here becasue the first and actual
      // HTTP request attempt failed then `currentRetryAttempt` is still zero. We
      // have found that a retry is indeed required. Since that is (will be)
      // indeed the first retry it makes sense to now increase
      // `currentRetryAttempt` by 1. So that it is in fact 1 for the first retry
      // (as opposed to 0 or 2); an intuitive convention to use for the math
      // below.
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      (axiosError.config as ConfigWithRetry).retryAttempt! += 1;

      // Store with shorter and more expressive variable name.
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const { retryAttempt } = axiosError.config as ConfigWithRetry;

      // Calculate delay according to chosen strategy
      // Default to exponential backoff - formula: ((2^c - 1) / 2) * 1000
      if (delay === 0) {
        // Was not set by Retry-After logic
        if (this.config.backoffType === 'linear') {
          // The delay between the first (actual) attempt and the first retry
          // should be non-zero. Rely on the convention that `retrycount` is
          // equal to 1 for the first retry when we are in here (was once 0,
          // which was a bug -- see #122).
          delay = retryAttempt * 1_000;
        } else if (this.config.backoffType === 'static') {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          delay = this.config.retryDelay!;
        } else {
          delay = ((2 ** retryAttempt - 1) / 2) * 1_000;
        }

        if (typeof this.config.maxRetryDelay === 'number') {
          delay = Math.min(delay, this.config.maxRetryDelay);
        }
      }

      setTimeout(resolve, delay);
    });

    // Notify the user if they added an `onRetryAttempt` handler
    if (this.config.onRetryAttempt) {
      this.config.onRetryAttempt(axiosError);
    }

    const onRetryAttemptPromise = Promise.resolve();

    // Return the promise in which recalls axios to retry the request
    return await Promise.resolve()
      .then(() => onBackoffPromise)
      .then(() => onRetryAttemptPromise)
      .then(() => instance?.request(axiosError.config!));
  }
}

/**
 * Attach the interceptor to the Axios instance.
 * @param instance The optional Axios instance on which to attach the
 * interceptor.
 * @returns {number} The id of the interceptor attached to the axios instance.
 */

export function attach(instance: AxiosInstance, interceptor: RetryInterceptor): number {
  return instance.interceptors.response.use(onFulfilled, (error: AxiosError) =>
    interceptor.onError(instance, error)
  );
}

/**
 * Eject the Axios interceptor that is providing retry capabilities.
 * @param interceptorId The interceptorId provided in the config.
 * @param instance The axios instance using this interceptor.
 */
export function detach(interceptorId: number, instance: AxiosInstance): void {
  instance.interceptors.response.eject(interceptorId);
}
