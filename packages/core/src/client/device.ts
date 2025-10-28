/**
 * Device ID Manager
 *
 * Manages device identification with persistent storage.
 * Inspired by the web-app implementation, but simplified for SDK use.
 */

/**
 * DeviceManager handles device ID generation and persistence
 *
 * Features:
 * - Generates unique device IDs using crypto.randomUUID()
 * - Persists IDs in localStorage (browser) or memory (Node.js)
 * - Reuses existing IDs across sessions
 * - Format: "sdk-{uuid}"
 *
 * @example
 * ```typescript
 * // Get or create device ID (persistent)
 * const deviceId = DeviceManager.getDeviceId();
 *
 * // Generate new device ID (not persistent)
 * const newId = DeviceManager.generateDeviceId();
 *
 * // Clear stored device ID
 * DeviceManager.clearDeviceId();
 * ```
 */
export class DeviceManager {
  /**
   * Storage key for device ID in localStorage
   */
  private static readonly STORAGE_KEY = "uranium_device_id"

  /**
   * In-memory cache for device ID (fallback when storage unavailable)
   */
  private static memoryCache: string | null = null

  /**
   * Get or create device ID with persistence
   *
   * Tries to load from storage first. If not found, generates a new ID
   * and saves it for future use.
   *
   * @param options - Configuration options
   * @param options.storage - Custom storage implementation (defaults to localStorage in browser)
   * @returns Device ID in format "sdk-{uuid}"
   *
   * @example
   * ```typescript
   * // Use default storage (localStorage)
   * const deviceId = DeviceManager.getDeviceId();
   *
   * // Use custom storage
   * const deviceId = DeviceManager.getDeviceId({ storage: sessionStorage });
   *
   * // Disable storage (generate new every time)
   * const deviceId = DeviceManager.getDeviceId({ storage: null });
   * ```
   */
  static getDeviceId(options?: { storage?: Storage | null }): string {
    const storage =
      options?.storage !== undefined
        ? options.storage
        : DeviceManager.getDefaultStorage()

    // Try to load from storage
    if (storage) {
      try {
        const stored = storage.getItem(DeviceManager.STORAGE_KEY)
        if (stored) {
          DeviceManager.memoryCache = stored // Update cache
          return stored
        }
      } catch (_error) {
        // Storage not available or quota exceeded
        // Continue to memory cache check
      }
    }

    // Try memory cache (for Node.js or when storage fails)
    if (DeviceManager.memoryCache) {
      return DeviceManager.memoryCache
    }

    // Generate new device ID
    const deviceId = DeviceManager.generateDeviceId()

    // Save to storage
    if (storage) {
      try {
        storage.setItem(DeviceManager.STORAGE_KEY, deviceId)
      } catch (_error) {
        // Storage not available or quota exceeded
        // Continue without persistence
      }
    }

    // Save to memory cache
    DeviceManager.memoryCache = deviceId

    return deviceId
  }

  /**
   * Generate new device ID
   *
   * Creates a new unique device ID without saving it.
   * Uses crypto.randomUUID() for cryptographically secure randomness.
   *
   * @returns Device ID in format "sdk-{uuid}"
   *
   * @example
   * ```typescript
   * const deviceId = DeviceManager.generateDeviceId();
   * // Returns: "sdk-550e8400-e29b-41d4-a716-446655440000"
   * ```
   */
  static generateDeviceId(): string {
    return `sdk-${crypto.randomUUID()}`
  }

  /**
   * Clear stored device ID
   *
   * Removes device ID from both storage and memory cache.
   * Next call to getDeviceId() will generate a new ID.
   *
   * @param options - Configuration options
   * @param options.storage - Custom storage implementation (defaults to localStorage in browser)
   *
   * @example
   * ```typescript
   * // Clear from default storage
   * DeviceManager.clearDeviceId();
   *
   * // Clear from custom storage
   * DeviceManager.clearDeviceId({ storage: sessionStorage });
   * ```
   */
  static clearDeviceId(options?: { storage?: Storage | null }): void {
    const storage =
      options?.storage !== undefined
        ? options.storage
        : DeviceManager.getDefaultStorage()

    // Clear from storage
    if (storage) {
      try {
        storage.removeItem(DeviceManager.STORAGE_KEY)
      } catch (_error) {
        // Storage not available
      }
    }

    // Clear memory cache
    DeviceManager.memoryCache = null
  }

  /**
   * Get default storage implementation
   *
   * Returns localStorage in browser environment, null in Node.js.
   *
   * @returns Storage instance or null
   */
  private static getDefaultStorage(): Storage | null {
    try {
      // Check if we're in browser environment
      if (typeof window !== "undefined" && window.localStorage) {
        // Test if localStorage is actually accessible (might be disabled)
        const testKey = "__uranium_storage_test__"
        window.localStorage.setItem(testKey, "test")
        window.localStorage.removeItem(testKey)
        return window.localStorage
      }
    } catch (_error) {
      // localStorage not available or disabled
    }

    return null
  }
}

/**
 * Generate device ID (legacy export)
 *
 * @deprecated Use DeviceManager.generateDeviceId() instead
 */
export function generateDeviceId(): string {
  return DeviceManager.generateDeviceId()
}
