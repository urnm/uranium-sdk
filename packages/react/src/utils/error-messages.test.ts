import { describe, expect, test } from "bun:test"
import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  UploadError,
  UraniumError,
  ValidationError,
} from "@uranium/types"
import { getErrorMessage, isErrorRetryable } from "./error-messages"

describe("getErrorMessage", () => {
  describe("UraniumError handling", () => {
    test("should handle base UraniumError", () => {
      const error = new UraniumError("Something went wrong", "GENERIC_ERROR")
      expect(getErrorMessage(error)).toBe("Something went wrong")
    })

    test("should handle UraniumError without message", () => {
      const error = new UraniumError("", "GENERIC_ERROR")
      expect(getErrorMessage(error)).toBe(
        "An error occurred while processing your request.",
      )
    })

    test("should handle AuthenticationError", () => {
      const error = new AuthenticationError("Invalid API key")
      expect(getErrorMessage(error)).toBe("Invalid API key")
    })

    test("should handle AuthenticationError with default message", () => {
      const error = new AuthenticationError()
      expect(getErrorMessage(error)).toBe("Authentication failed")
    })

    test("should handle ValidationError with fields", () => {
      const error = new ValidationError("Invalid input", "VALIDATION_ERROR", {
        email: ["Invalid email format"],
        password: ["Too short", "Must contain special characters"],
      })
      const message = getErrorMessage(error)
      expect(message).toContain("Validation failed")
      expect(message).toContain("email: Invalid email format")
      expect(message).toContain(
        "password: Too short, Must contain special characters",
      )
    })

    test("should handle ValidationError without fields", () => {
      const error = new ValidationError("Invalid data")
      expect(getErrorMessage(error)).toBe("Invalid data")
    })

    test("should handle ValidationError with empty fields", () => {
      const error = new ValidationError("", "VALIDATION_ERROR", {})
      expect(getErrorMessage(error)).toBe(
        "Validation failed. Please check your input.",
      )
    })

    test("should handle NetworkError that is retryable", () => {
      const error = new NetworkError(
        "Connection timeout",
        "NETWORK_ERROR",
        true,
      )
      expect(getErrorMessage(error)).toBe("Connection timeout")
    })

    test("should handle NetworkError that is not retryable", () => {
      const error = new NetworkError(
        "Connection refused",
        "NETWORK_ERROR",
        false,
      )
      expect(getErrorMessage(error)).toBe("Connection refused")
    })

    test("should handle NetworkError with default message", () => {
      const error = new NetworkError()
      expect(getErrorMessage(error)).toBe("Network error occurred")
    })

    test("should handle NotFoundError with resource type and id", () => {
      const error = new NotFoundError(
        "Not found",
        "NOT_FOUND",
        "Asset",
        "asset-123",
      )
      expect(getErrorMessage(error)).toBe(
        'Asset with ID "asset-123" was not found.',
      )
    })

    test("should handle NotFoundError with only resource type", () => {
      const error = new NotFoundError("Not found", "NOT_FOUND", "Collection")
      expect(getErrorMessage(error)).toBe("Collection was not found.")
    })

    test("should handle NotFoundError without resource details", () => {
      const error = new NotFoundError("Custom not found message")
      expect(getErrorMessage(error)).toBe("Custom not found message")
    })

    test("should handle NotFoundError with default message", () => {
      const error = new NotFoundError()
      expect(getErrorMessage(error)).toBe("Resource not found")
    })

    test("should handle UploadError with retry attempts", () => {
      const error = new UploadError("Upload failed", "UPLOAD_ERROR", 3)
      expect(getErrorMessage(error)).toBe("Upload failed after 3 attempts.")
    })

    test("should handle UploadError with single retry attempt", () => {
      const error = new UploadError("Upload failed", "UPLOAD_ERROR", 1)
      expect(getErrorMessage(error)).toBe("Upload failed after 1 attempt.")
    })

    test("should handle UploadError without retry attempts", () => {
      const error = new UploadError("File too large")
      expect(getErrorMessage(error)).toBe("File too large")
    })

    test("should handle UploadError with default message", () => {
      const error = new UploadError()
      expect(getErrorMessage(error)).toBe("Upload failed")
    })
  })

  describe("AxiosError handling", () => {
    test("should handle network error (no status)", () => {
      const error = {
        isAxiosError: true,
        response: undefined,
        message: "Network Error",
      }
      expect(getErrorMessage(error)).toBe(
        "Network error occurred. Please check your internet connection.",
      )
    })

    test("should handle 401 Unauthorized", () => {
      const error = {
        isAxiosError: true,
        response: { status: 401 },
        message: "Unauthorized",
      }
      expect(getErrorMessage(error)).toBe(
        "Authentication failed. Please check your API key and try again.",
      )
    })

    test("should handle 403 Forbidden", () => {
      const error = {
        isAxiosError: true,
        response: { status: 403 },
        message: "Forbidden",
      }
      expect(getErrorMessage(error)).toBe(
        "Access denied. You do not have permission to perform this action.",
      )
    })

    test("should handle 404 Not Found", () => {
      const error = {
        isAxiosError: true,
        response: { status: 404 },
        message: "Not Found",
      }
      expect(getErrorMessage(error)).toBe(
        "The requested resource was not found.",
      )
    })

    test("should handle 429 Rate Limit", () => {
      const error = {
        isAxiosError: true,
        response: { status: 429 },
        message: "Too Many Requests",
      }
      expect(getErrorMessage(error)).toBe(
        "Too many requests. Please slow down and try again later.",
      )
    })

    test("should handle 500 Internal Server Error", () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
        message: "Internal Server Error",
      }
      expect(getErrorMessage(error)).toBe(
        "Server error occurred. Please try again later.",
      )
    })

    test("should handle 503 Service Unavailable", () => {
      const error = {
        isAxiosError: true,
        response: { status: 503 },
        message: "Service Unavailable",
      }
      expect(getErrorMessage(error)).toBe(
        "Server error occurred. Please try again later.",
      )
    })

    test("should handle 400 Bad Request with custom message", () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: "Invalid request parameters" },
        },
        message: "Bad Request",
      }
      expect(getErrorMessage(error)).toBe("Invalid request parameters")
    })

    test("should handle 400 Bad Request without custom message", () => {
      const error = {
        isAxiosError: true,
        response: { status: 400 },
        message: "Bad Request",
      }
      expect(getErrorMessage(error)).toBe("Bad Request")
    })

    test("should handle 400 Bad Request with empty message", () => {
      const error = {
        isAxiosError: true,
        response: { status: 400 },
        message: "",
      }
      expect(getErrorMessage(error)).toBe(
        "Request failed. Please check your input.",
      )
    })

    test("should handle other 4xx errors", () => {
      const error = {
        isAxiosError: true,
        response: { status: 422 },
        message: "Unprocessable Entity",
      }
      expect(getErrorMessage(error)).toBe("Unprocessable Entity")
    })

    test("should handle error with fallback message", () => {
      const error = {
        isAxiosError: true,
        response: { status: 999 },
        message: "Unknown error",
      }
      // Status 999 is >= 500, so it's treated as a server error
      expect(getErrorMessage(error)).toBe(
        "Server error occurred. Please try again later.",
      )
    })

    test("should handle error without message", () => {
      const error = {
        isAxiosError: true,
        response: { status: 999 },
        message: "",
      }
      // Status 999 is >= 500, so it's treated as a server error
      expect(getErrorMessage(error)).toBe(
        "Server error occurred. Please try again later.",
      )
    })
  })

  describe("Standard Error handling", () => {
    test("should handle Error with message", () => {
      const error = new Error("Something went wrong")
      expect(getErrorMessage(error)).toBe("Something went wrong")
    })

    test("should handle Error without message", () => {
      const error = new Error("")
      expect(getErrorMessage(error)).toBe("An unexpected error occurred.")
    })

    test("should handle TypeError", () => {
      const error = new TypeError("Cannot read property of undefined")
      expect(getErrorMessage(error)).toBe("Cannot read property of undefined")
    })

    test("should handle RangeError", () => {
      const error = new RangeError("Invalid array length")
      expect(getErrorMessage(error)).toBe("Invalid array length")
    })
  })

  describe("Other error types", () => {
    test("should handle string error", () => {
      expect(getErrorMessage("String error")).toBe("String error")
    })

    test("should handle empty string error", () => {
      expect(getErrorMessage("")).toBe("An unexpected error occurred.")
    })

    test("should handle null", () => {
      expect(getErrorMessage(null)).toBe("An unexpected error occurred.")
    })

    test("should handle undefined", () => {
      expect(getErrorMessage(undefined)).toBe("An unexpected error occurred.")
    })

    test("should handle number", () => {
      expect(getErrorMessage(123)).toBe("An unexpected error occurred.")
    })

    test("should handle boolean", () => {
      expect(getErrorMessage(true)).toBe("An unexpected error occurred.")
    })

    test("should handle object with message property", () => {
      expect(getErrorMessage({ message: "Custom error" })).toBe("Custom error")
    })

    test("should handle object with empty message property", () => {
      expect(getErrorMessage({ message: "" })).toBe(
        "An unexpected error occurred.",
      )
    })

    test("should handle object without message property", () => {
      expect(getErrorMessage({ error: "No message" })).toBe(
        "An unexpected error occurred.",
      )
    })

    test("should handle array", () => {
      expect(getErrorMessage(["error"])).toBe("An unexpected error occurred.")
    })
  })
})

describe("isErrorRetryable", () => {
  describe("NetworkError", () => {
    test("should return true for retryable NetworkError", () => {
      const error = new NetworkError("Timeout", "NETWORK_ERROR", true)
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return false for non-retryable NetworkError", () => {
      const error = new NetworkError(
        "Connection refused",
        "NETWORK_ERROR",
        false,
      )
      expect(isErrorRetryable(error)).toBe(false)
    })
  })

  describe("UraniumError with status codes", () => {
    test("should return true for 429 rate limit", () => {
      const error = new UraniumError("Rate limit", "RATE_LIMIT", 429)
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return true for 408 timeout", () => {
      const error = new UraniumError("Timeout", "TIMEOUT", 408)
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return true for 503 service unavailable", () => {
      const error = new UraniumError("Unavailable", "UNAVAILABLE", 503)
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return false for 400 bad request", () => {
      const error = new UraniumError("Bad request", "BAD_REQUEST", 400)
      expect(isErrorRetryable(error)).toBe(false)
    })

    test("should return false for 401 unauthorized", () => {
      const error = new AuthenticationError()
      expect(isErrorRetryable(error)).toBe(false)
    })

    test("should return false for 404 not found", () => {
      const error = new NotFoundError()
      expect(isErrorRetryable(error)).toBe(false)
    })

    test("should return false for 500 server error", () => {
      const error = new UraniumError("Server error", "SERVER_ERROR", 500)
      expect(isErrorRetryable(error)).toBe(false)
    })
  })

  describe("AxiosError", () => {
    test("should return true for network error (no status)", () => {
      const error = {
        isAxiosError: true,
        response: undefined,
      }
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return true for 429 rate limit", () => {
      const error = {
        isAxiosError: true,
        response: { status: 429 },
      }
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return true for 408 timeout", () => {
      const error = {
        isAxiosError: true,
        response: { status: 408 },
      }
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return true for 500 server error", () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
      }
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return true for 503 service unavailable", () => {
      const error = {
        isAxiosError: true,
        response: { status: 503 },
      }
      expect(isErrorRetryable(error)).toBe(true)
    })

    test("should return false for 400 bad request", () => {
      const error = {
        isAxiosError: true,
        response: { status: 400 },
      }
      expect(isErrorRetryable(error)).toBe(false)
    })

    test("should return false for 401 unauthorized", () => {
      const error = {
        isAxiosError: true,
        response: { status: 401 },
      }
      expect(isErrorRetryable(error)).toBe(false)
    })

    test("should return false for 404 not found", () => {
      const error = {
        isAxiosError: true,
        response: { status: 404 },
      }
      expect(isErrorRetryable(error)).toBe(false)
    })
  })

  describe("Other error types", () => {
    test("should return false for standard Error", () => {
      const error = new Error("Generic error")
      expect(isErrorRetryable(error)).toBe(false)
    })

    test("should return false for string error", () => {
      expect(isErrorRetryable("Error string")).toBe(false)
    })

    test("should return false for null", () => {
      expect(isErrorRetryable(null)).toBe(false)
    })

    test("should return false for undefined", () => {
      expect(isErrorRetryable(undefined)).toBe(false)
    })

    test("should return false for object", () => {
      expect(isErrorRetryable({ error: "Error object" })).toBe(false)
    })
  })
})
