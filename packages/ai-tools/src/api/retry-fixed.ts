/**
 * Retry utility for API calls
 * Uses a function wrapper approach instead of decorators for better TypeScript and ESM compatibility
 */

/**
 * Retry options for API calls
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay in milliseconds */
  baseDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Whether to retry all errors or just rate limits */
  retryAllErrors?: boolean;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryAllErrors: false,
};

/**
 * Type for an async generator function
 */
export type AsyncGeneratorFunction<T, Args extends any[] = any[]> = 
  (...args: Args) => AsyncGenerator<T>;

/**
 * Wraps a generator function with retry logic
 * @param generatorFn - Generator function to wrap
 * @param options - Retry options
 * @returns Wrapped generator function with retry logic
 */
export function withRetryWrapper<T, Args extends any[] = any[]>(
  generatorFn: AsyncGeneratorFunction<T, Args>,
  options: RetryOptions = {}
): AsyncGeneratorFunction<T, Args> {
  const { maxRetries, baseDelay, maxDelay, retryAllErrors } = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  return async function* (this: any, ...args: Args): AsyncGenerator<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        yield* generatorFn.apply(this, args);
        return;
      } catch (error: any) {
        const isRateLimit = error?.status === 429;
        const isLastAttempt = attempt === maxRetries - 1;

        if ((!isRateLimit && !retryAllErrors) || isLastAttempt) {
          throw error;
        }

        // Get retry delay from header or calculate exponential backoff
        const retryAfter =
          error.headers?.["retry-after"] ||
          error.headers?.["x-ratelimit-reset"] ||
          error.headers?.["ratelimit-reset"];

        let delay: number;
        if (retryAfter) {
          // Handle both delta-seconds and Unix timestamp formats
          const retryValue = parseInt(retryAfter, 10);
          if (retryValue > Date.now() / 1000) {
            // Unix timestamp
            delay = retryValue * 1000 - Date.now();
          } else {
            // Delta seconds
            delay = retryValue * 1000;
          }
        } else {
          // Use exponential backoff if no header
          delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };
}

/**
 * Utility function to apply retry logic to a method
 * This can be used instead of a decorator when decorator syntax causes TypeScript errors
 */
export function applyRetryToMethod<T extends any[], R>(
  instance: any,
  method: (...args: T) => AsyncGenerator<R>,
  options: RetryOptions = {}
): (...args: T) => AsyncGenerator<R> {
  // Bind the method to the instance and then wrap it with retry logic
  const boundMethod = method.bind(instance);
  return withRetryWrapper(boundMethod, options);
} 