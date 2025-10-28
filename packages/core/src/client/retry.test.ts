import { describe, expect, test } from "bun:test"
import { AxiosError } from "axios"
import type { RetryConfig } from "../types/config"
import { withRetry } from "./retry"

describe("Retry Logic", () => {
  // Helper to create mock AxiosError
  const createAxiosError = (status?: number): AxiosError => {
    const error = new AxiosError("Mock error")
    if (status !== undefined) {
      error.response = { status } as any
    }
    return error
  }

  // Helper to create a function that fails N times then succeeds
  const createFailingFunction = (
    failCount: number,
    statuses: number[] = [500],
  ) => {
    let callCount = 0
    return async () => {
      callCount++
      if (callCount <= failCount) {
        const status = statuses[(callCount - 1) % statuses.length]
        throw createAxiosError(status)
      }
      return "success"
    }
  }

  // Helper to track callback invocations
  interface CallbackCall {
    attempt: number
    error: unknown
    delayMs: number
  }

  describe("Retry disabled", () => {
    const disabledConfig: RetryConfig = {
      enabled: false,
      maxRetries: 3,
      retryDelay: 1000,
      retryableStatuses: [500, 502, 503, 504],
    }

    test("should execute successful request immediately", async () => {
      const fn = async () => "success"
      const result = await withRetry(fn, disabledConfig)
      expect(result).toBe("success")
    })

    test("should throw error immediately without retry", async () => {
      const error = createAxiosError(500)
      const fn = async () => {
        throw error
      }

      try {
        await withRetry(fn, disabledConfig)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBe(error)
      }
    })
  })

  describe("Retry enabled - successful scenarios", () => {
    const enabledConfig: RetryConfig = {
      enabled: true,
      maxRetries: 3,
      retryDelay: 100, // Shorter delay for faster tests
      retryableStatuses: [500, 502, 503, 504],
    }

    test("should succeed on first attempt", async () => {
      const fn = async () => "success"
      const startTime = Date.now()
      const result = await withRetry(fn, enabledConfig)
      const elapsed = Date.now() - startTime

      expect(result).toBe("success")
      // Should complete quickly without retries
      expect(elapsed).toBeLessThan(50)
    })

    test("should succeed after 1 retry (500 → success)", async () => {
      const fn = createFailingFunction(1, [500])
      const result = await withRetry(fn, enabledConfig)
      expect(result).toBe("success")
    })

    test("should succeed after 2 retries (500 → 500 → success)", async () => {
      const fn = createFailingFunction(2, [500])
      const result = await withRetry(fn, enabledConfig)
      expect(result).toBe("success")
    })

    test("should succeed after maxRetries retries", async () => {
      const fn = createFailingFunction(3, [500])
      const result = await withRetry(fn, enabledConfig)
      expect(result).toBe("success")
    })

    test("should succeed with different retryable status codes", async () => {
      const fn = createFailingFunction(2, [502, 503])
      const result = await withRetry(fn, enabledConfig)
      expect(result).toBe("success")
    })
  })

  describe("Retry enabled - error scenarios", () => {
    const enabledConfig: RetryConfig = {
      enabled: true,
      maxRetries: 3,
      retryDelay: 100,
      retryableStatuses: [500, 502, 503, 504],
    }

    test("should throw error when maxRetries is reached", async () => {
      const fn = createFailingFunction(4, [500]) // Fail 4 times (more than maxRetries)

      try {
        await withRetry(fn, enabledConfig)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBeInstanceOf(AxiosError)
        const axiosError = err as AxiosError
        expect(axiosError.response?.status).toBe(500)
      }
    })

    test("should not retry 401 errors", async () => {
      const error = createAxiosError(401)
      const fn = async () => {
        throw error
      }

      const startTime = Date.now()
      try {
        await withRetry(fn, enabledConfig)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBe(error)
        const elapsed = Date.now() - startTime
        // Should fail immediately without retry delay
        expect(elapsed).toBeLessThan(50)
      }
    })

    test("should not retry 403 errors", async () => {
      const error = createAxiosError(403)
      const fn = async () => {
        throw error
      }

      const startTime = Date.now()
      try {
        await withRetry(fn, enabledConfig)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBe(error)
        const elapsed = Date.now() - startTime
        expect(elapsed).toBeLessThan(50)
      }
    })

    test("should not retry 429 errors", async () => {
      const error = createAxiosError(429)
      const fn = async () => {
        throw error
      }

      const startTime = Date.now()
      try {
        await withRetry(fn, enabledConfig)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBe(error)
        const elapsed = Date.now() - startTime
        expect(elapsed).toBeLessThan(50)
      }
    })

    test("should not retry 400 errors", async () => {
      const error = createAxiosError(400)
      const fn = async () => {
        throw error
      }

      try {
        await withRetry(fn, enabledConfig)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBe(error)
      }
    })

    test("should not retry 404 errors", async () => {
      const error = createAxiosError(404)
      const fn = async () => {
        throw error
      }

      try {
        await withRetry(fn, enabledConfig)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBe(error)
      }
    })
  })

  describe("Exponential backoff", () => {
    test("should apply exponential backoff delays (1x, 2x, 3x)", async () => {
      const retryDelay = 100
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        retryDelay,
        retryableStatuses: [500],
      }

      const fn = createFailingFunction(3, [500])

      const startTime = Date.now()
      const result = await withRetry(fn, config)
      const elapsed = Date.now() - startTime

      expect(result).toBe("success")

      // Expected delays: 100ms (1x) + 200ms (2x) + 300ms (3x) = 600ms
      // Allow some tolerance for execution time
      expect(elapsed).toBeGreaterThanOrEqual(550)
      expect(elapsed).toBeLessThan(750)
    })

    test("should use correct delay multiplier for each attempt", async () => {
      const delays: number[] = []
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 100,
        retryableStatuses: [500],
        onRetry: async (_attempt, _error, delayMs) => {
          delays.push(delayMs)
        },
      }

      const fn = createFailingFunction(3, [500])
      await withRetry(fn, config)

      expect(delays).toEqual([100, 200, 300])
    })
  })

  describe("onRetry callback", () => {
    test("should call onRetry with correct parameters", async () => {
      const calls: CallbackCall[] = []
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 100,
        retryableStatuses: [500, 502],
        onRetry: async (attempt, error, delayMs) => {
          calls.push({ attempt, error, delayMs })
        },
      }

      const fn = createFailingFunction(2, [500, 502])
      await withRetry(fn, config)

      expect(calls.length).toBe(2)

      // First retry
      expect(calls[0].attempt).toBe(1)
      expect((calls[0].error as AxiosError).response?.status).toBe(500)
      expect(calls[0].delayMs).toBe(100)

      // Second retry
      expect(calls[1].attempt).toBe(2)
      expect((calls[1].error as AxiosError).response?.status).toBe(502)
      expect(calls[1].delayMs).toBe(200)
    })

    test("should not call onRetry when retry is disabled", async () => {
      let callCount = 0
      const config: RetryConfig = {
        enabled: false,
        maxRetries: 3,
        retryDelay: 100,
        retryableStatuses: [500],
        onRetry: async () => {
          callCount++
        },
      }

      const fn = async () => "success"
      await withRetry(fn, config)

      expect(callCount).toBe(0)
    })

    test("should not call onRetry on first attempt", async () => {
      let callCount = 0
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 100,
        retryableStatuses: [500],
        onRetry: async () => {
          callCount++
        },
      }

      const fn = async () => "success"
      await withRetry(fn, config)

      expect(callCount).toBe(0)
    })

    test("should not call onRetry for non-retryable errors", async () => {
      let callCount = 0
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 100,
        retryableStatuses: [500],
        onRetry: async () => {
          callCount++
        },
      }

      const error = createAxiosError(401)
      const fn = async () => {
        throw error
      }

      try {
        await withRetry(fn, config)
      } catch {
        // Expected
      }

      expect(callCount).toBe(0)
    })

    test("should support async onRetry callback", async () => {
      const calls: CallbackCall[] = []
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 50,
        retryableStatuses: [500],
        onRetry: async (attempt, error, delayMs) => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10))
          calls.push({ attempt, error, delayMs })
        },
      }

      const fn = createFailingFunction(2, [500])
      const result = await withRetry(fn, config)

      expect(result).toBe("success")
      expect(calls.length).toBe(2)
    })

    test("should handle onRetry callback errors gracefully", async () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 50,
        retryableStatuses: [500],
        onRetry: async () => {
          throw new Error("Callback error")
        },
      }

      const fn = createFailingFunction(1, [500])

      // The callback error should propagate
      try {
        await withRetry(fn, config)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        expect((err as Error).message).toBe("Callback error")
      }
    })
  })

  describe("Network errors (no response)", () => {
    test("should retry network errors", async () => {
      const calls: CallbackCall[] = []
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 2,
        retryDelay: 50,
        retryableStatuses: [500],
        onRetry: async (attempt, error, delayMs) => {
          calls.push({ attempt, error, delayMs })
        },
      }

      let callCount = 0
      const fn = async () => {
        callCount++
        if (callCount === 1) {
          // Network error (no response)
          throw new AxiosError("Network Error")
        }
        return "success"
      }

      const result = await withRetry(fn, config)

      expect(result).toBe("success")
      expect(calls.length).toBe(1)
      expect((calls[0].error as AxiosError).message).toBe("Network Error")
    })
  })

  describe("Edge cases", () => {
    test("should handle maxRetries = 0", async () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 0,
        retryDelay: 100,
        retryableStatuses: [500],
      }

      const error = createAxiosError(500)
      const fn = async () => {
        throw error
      }

      try {
        await withRetry(fn, config)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBe(error)
      }
    })

    test("should handle very short retry delays", async () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 2,
        retryDelay: 1, // 1ms delay
        retryableStatuses: [500],
      }

      const fn = createFailingFunction(2, [500])
      const result = await withRetry(fn, config)

      expect(result).toBe("success")
    })

    test("should handle custom retryableStatuses", async () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 2,
        retryDelay: 50,
        retryableStatuses: [418], // I'm a teapot status
      }

      const fn = createFailingFunction(1, [418])
      const result = await withRetry(fn, config)

      expect(result).toBe("success")
    })

    test("should not retry status codes not in retryableStatuses", async () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 50,
        retryableStatuses: [502, 503], // 500 not included
      }

      const error = createAxiosError(500)
      const fn = async () => {
        throw error
      }

      try {
        await withRetry(fn, config)
        expect(true).toBe(false) // Should not reach here
      } catch (err) {
        expect(err).toBe(error)
      }
    })
  })
})
