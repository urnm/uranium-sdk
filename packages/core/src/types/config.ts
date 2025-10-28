/**
 * Configuration options for retry behavior
 */
export interface RetryConfig {
  /**
   * Enable retry mechanism. When false, requests fail immediately without retrying.
   * @default false
   */
  enabled: boolean

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries: number

  /**
   * Initial delay between retries in milliseconds
   * @default 1000
   */
  retryDelay: number

  /**
   * HTTP status codes that should trigger a retry
   * Note: 429 (rate limiting) is intentionally excluded
   * @default [500, 502, 503, 504]
   */
  retryableStatuses: number[]

  /**
   * Optional callback invoked before each retry attempt
   * @param attempt - Current retry attempt number (1-based)
   * @param error - The error that triggered the retry
   * @param delayMs - Delay in milliseconds before this retry
   */
  onRetry?: (
    attempt: number,
    error: unknown,
    delayMs: number,
  ) => void | Promise<void>
}

/**
 * Main configuration interface for Uranium SDK
 */
export interface UraniumConfig {
  /**
   * API key for authentication (required)
   * Get your API key from: https://portal.uranium.pro/dashboard/profile/api-keys
   */
  apiKey: string

  /**
   * Base URL for Uranium API
   * @default "https://gw.urnm.pro"
   */
  baseUrl?: string

  /**
   * Request timeout in milliseconds
   * @default 20000
   */
  timeout?: number

  /**
   * Device identifier for tracking
   * @default "sdk-{uuid}"
   */
  deviceId?: string

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean

  /**
   * Retry configuration for failed requests
   * @default { enabled: false, maxRetries: 3, retryDelay: 1000, retryableStatuses: [500, 502, 503, 504], onRetry: undefined }
   */
  retry?: Partial<RetryConfig>
}

/**
 * Internal configuration with all defaults applied
 */
export interface ResolvedUraniumConfig
  extends Required<Omit<UraniumConfig, "retry">> {
  retry: RetryConfig
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  enabled: false,
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [500, 502, 503, 504],
  onRetry: undefined,
}

/**
 * Default SDK configuration
 */
export const DEFAULT_CONFIG: Omit<
  ResolvedUraniumConfig,
  "apiKey" | "deviceId"
> = {
  baseUrl: "https://gw.urnm.pro",
  timeout: 20000,
  debug: false,
  retry: DEFAULT_RETRY_CONFIG,
}
