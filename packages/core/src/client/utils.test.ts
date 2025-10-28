import { describe, expect, test } from "bun:test"
import { AxiosError } from "axios"
import {
  extractSignal,
  generateDeviceId,
  getErrorMessage,
  isAxiosError,
  shouldRetry,
} from "./utils"

describe("Client Utilities", () => {
  describe("generateDeviceId", () => {
    test("should generate device ID with sdk- prefix and UUID", () => {
      const deviceId = generateDeviceId()
      expect(deviceId).toMatch(
        /^sdk-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
    })

    test("should generate unique device IDs", () => {
      const id1 = generateDeviceId()
      const id2 = generateDeviceId()
      expect(id1).not.toBe(id2)
    })
  })

  describe("extractSignal", () => {
    test("should extract signal from AbortController", () => {
      const controller = new AbortController()
      const signal = extractSignal(controller)
      expect(signal).toBe(controller.signal)
    })

    test("should return AbortSignal as-is", () => {
      const controller = new AbortController()
      const signal = extractSignal(controller.signal)
      expect(signal).toBe(controller.signal)
    })

    test("should return undefined for undefined input", () => {
      const signal = extractSignal(undefined)
      expect(signal).toBeUndefined()
    })
  })

  describe("isAxiosError", () => {
    test("should return true for AxiosError", () => {
      const error = new AxiosError("Test error")
      expect(isAxiosError(error)).toBe(true)
    })

    test("should return false for regular Error", () => {
      const error = new Error("Test error")
      expect(isAxiosError(error)).toBe(false)
    })

    test("should return false for non-error objects", () => {
      expect(isAxiosError({ message: "test" })).toBe(false)
      expect(isAxiosError(null)).toBe(false)
      expect(isAxiosError(undefined)).toBe(false)
    })
  })

  describe("getErrorMessage", () => {
    test("should handle network error (no response)", () => {
      const error = new AxiosError("Network Error")
      const message = getErrorMessage(error)
      expect(message).toBe(
        "Network error occurred. Please check your connection.",
      )
    })

    test("should handle 401 authentication error", () => {
      const error = new AxiosError("Unauthorized")
      error.response = { status: 401, data: null } as any
      const message = getErrorMessage(error)
      expect(message).toBe("Authentication failed. Please check your API key.")
    })

    test("should handle 403 permission error", () => {
      const error = new AxiosError("Forbidden")
      error.response = { status: 403, data: null } as any
      const message = getErrorMessage(error)
      expect(message).toBe("Access denied. Please check your permissions.")
    })

    test("should handle 404 not found error", () => {
      const error = new AxiosError("Not Found")
      error.response = { status: 404, data: null } as any
      const message = getErrorMessage(error)
      expect(message).toBe("Resource not found.")
    })

    test("should handle 400 validation error with errorCode", () => {
      const error = new AxiosError("Bad Request")
      error.response = {
        status: 400,
        data: { errorCode: "INVALID_INPUT" },
      } as any
      const message = getErrorMessage(error)
      expect(message).toBe("Validation error: INVALID_INPUT")
    })

    test("should handle 429 rate limiting error", () => {
      const error = new AxiosError("Too Many Requests")
      error.response = { status: 429, data: null } as any
      const message = getErrorMessage(error)
      expect(message).toBe("Too many requests. Please try again later.")
    })

    test("should handle 500 server error", () => {
      const error = new AxiosError("Internal Server Error")
      error.response = { status: 500, data: null } as any
      const message = getErrorMessage(error)
      expect(message).toBe("Server error. Please try again later.")
    })

    test("should handle regular Error", () => {
      const error = new Error("Custom error message")
      const message = getErrorMessage(error)
      expect(message).toBe("Custom error message")
    })

    test("should handle unknown error types", () => {
      const message = getErrorMessage("string error")
      expect(message).toBe("An unexpected error occurred.")
    })
  })

  describe("shouldRetry", () => {
    test("should return true for network errors (no response)", () => {
      const error = new AxiosError("Network Error")
      expect(shouldRetry(error, [500, 502, 503, 504])).toBe(true)
    })

    test("should return false for 401 errors", () => {
      const error = new AxiosError("Unauthorized")
      error.response = { status: 401 } as any
      expect(shouldRetry(error, [500, 502, 503, 504])).toBe(false)
    })

    test("should return false for 403 errors", () => {
      const error = new AxiosError("Forbidden")
      error.response = { status: 403 } as any
      expect(shouldRetry(error, [500, 502, 503, 504])).toBe(false)
    })

    test("should return true for retryable status codes", () => {
      const retryableStatuses = [500, 502, 503, 504]

      for (const status of retryableStatuses) {
        const error = new AxiosError("Server Error")
        error.response = { status } as any
        expect(shouldRetry(error, retryableStatuses)).toBe(true)
      }
    })

    test("should return false for non-retryable status codes", () => {
      const error = new AxiosError("Bad Request")
      error.response = { status: 400 } as any
      expect(shouldRetry(error, [500, 502, 503, 504])).toBe(false)
    })

    test("should return false for non-AxiosError", () => {
      const error = new Error("Regular error")
      expect(shouldRetry(error, [500, 502, 503, 504])).toBe(false)
    })
  })
})
