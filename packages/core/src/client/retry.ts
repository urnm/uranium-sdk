import type { RetryConfig } from "../types/config"
import { shouldRetry } from "./utils"

/**
 * Executes a function with retry logic and exponential backoff
 * @param fn - Async function to execute
 * @param retryConfig - Retry configuration
 * @returns Promise with function result
 * @throws Last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: RetryConfig,
): Promise<T> {
  // If retry is disabled, execute immediately without retry
  if (!retryConfig.enabled) {
    return fn()
  }

  let lastError: unknown
  const maxAttempts = retryConfig.maxRetries + 1 // +1 for initial attempt

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // First attempt or retry attempt
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry this error
      const shouldRetryError = shouldRetry(error, retryConfig.retryableStatuses)

      // If this was the last attempt or error is not retryable, throw immediately
      if (attempt === maxAttempts || !shouldRetryError) {
        throw error
      }

      // Calculate delay with exponential backoff (attempt number × base delay)
      const delayMs = attempt * retryConfig.retryDelay

      // Call onRetry callback if provided
      if (retryConfig.onRetry) {
        await retryConfig.onRetry(attempt, error, delayMs)
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}
