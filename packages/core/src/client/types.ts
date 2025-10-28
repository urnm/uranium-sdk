import type { RetryConfig } from "../types/config"

/**
 * Options that can be passed to individual API requests
 */
export interface RequestOptions {
  /**
   * Override global retry configuration for this specific request
   */
  retry?: Partial<RetryConfig>
}
