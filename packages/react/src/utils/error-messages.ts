/**
 * Error message utilities for @uranium/react
 *
 * Provides user-friendly error message generation from various error types.
 * Handles UraniumError classes and AxiosError with appropriate fallbacks.
 */

import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  UploadError,
  UraniumError,
  ValidationError,
} from "@uranium/types"
import type { AxiosError } from "axios"

/**
 * Check if error is an AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    error.isAxiosError === true
  )
}

/**
 * Get user-friendly error message from AxiosError
 */
function getAxiosErrorMessage(error: AxiosError): string {
  const status = error.response?.status

  // No status means network connectivity issue
  if (status === undefined) {
    return "Network error occurred. Please check your internet connection."
  }

  // Authentication errors (401)
  if (status === 401) {
    return "Authentication failed. Please check your API key and try again."
  }

  // Authorization errors (403)
  if (status === 403) {
    return "Access denied. You do not have permission to perform this action."
  }

  // Not found errors (404)
  if (status === 404) {
    return "The requested resource was not found."
  }

  // Rate limiting (429)
  if (status === 429) {
    return "Too many requests. Please slow down and try again later."
  }

  // Server errors (500+)
  if (status >= 500) {
    return "Server error occurred. Please try again later."
  }

  // Client errors (400-499)
  if (status >= 400 && status < 500) {
    const responseData = error.response?.data as
      | { message?: string }
      | undefined
    return (
      responseData?.message ||
      error.message ||
      "Request failed. Please check your input."
    )
  }

  // Fallback for other status codes
  return error.message || "Network error occurred."
}

/**
 * Get user-friendly error message from UraniumError
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex error handling with multiple error types and conditions is acceptable for error message generation
function getUraniumErrorMessage(error: UraniumError): string {
  // AuthenticationError
  if (error instanceof AuthenticationError) {
    return (
      error.message || "Authentication failed. Please check your credentials."
    )
  }

  // ValidationError with field details
  if (error instanceof ValidationError) {
    if (error.fields && Object.keys(error.fields).length > 0) {
      const fieldErrors = Object.entries(error.fields)
        .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
        .join("; ")
      return `Validation failed: ${fieldErrors}`
    }
    return error.message || "Validation failed. Please check your input."
  }

  // NetworkError
  if (error instanceof NetworkError) {
    if (error.isRetryable) {
      return error.message || "Network error occurred. Please try again."
    }
    return (
      error.message || "Network error occurred. Please check your connection."
    )
  }

  // NotFoundError with resource details
  if (error instanceof NotFoundError) {
    if (error.resourceType && error.resourceId) {
      return `${error.resourceType} with ID "${error.resourceId}" was not found.`
    }
    if (error.resourceType) {
      return `${error.resourceType} was not found.`
    }
    return error.message || "The requested resource was not found."
  }

  // UploadError
  if (error instanceof UploadError) {
    if (error.retryAttempts !== undefined && error.retryAttempts > 0) {
      return `${error.message || "Upload failed"} after ${error.retryAttempts} ${error.retryAttempts === 1 ? "attempt" : "attempts"}.`
    }
    return error.message || "Upload failed. Please try again."
  }

  // Generic UraniumError
  return error.message || "An error occurred while processing your request."
}

/**
 * Convert any error to a user-friendly message
 *
 * Handles:
 * - UraniumError and its subclasses (AuthenticationError, ValidationError, etc.)
 * - AxiosError with status code-specific messages
 * - Standard Error objects
 * - Unknown error types
 *
 * @param error - The error to convert
 * @returns User-friendly error message
 *
 * @example
 * ```ts
 * try {
 *   await api.assets.list()
 * } catch (error) {
 *   const message = getErrorMessage(error)
 *   toast.error(message)
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (error == null) {
    return "An unexpected error occurred."
  }

  // Handle UraniumError and its subclasses
  if (error instanceof UraniumError) {
    return getUraniumErrorMessage(error)
  }

  // Handle AxiosError
  if (isAxiosError(error)) {
    return getAxiosErrorMessage(error)
  }

  // Handle standard Error
  if (error instanceof Error) {
    return error.message || "An unexpected error occurred."
  }

  // Handle string errors
  if (typeof error === "string") {
    return error || "An unexpected error occurred."
  }

  // Handle error objects with message property
  if (
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message || "An unexpected error occurred."
  }

  // Final fallback
  return "An unexpected error occurred."
}

/**
 * Check if error should be retried
 *
 * @param error - The error to check
 * @returns True if the error is retryable
 *
 * @example
 * ```ts
 * retry: (failureCount, error) => {
 *   if (!isErrorRetryable(error)) {
 *     return false
 *   }
 *   return failureCount < 3
 * }
 * ```
 */
export function isErrorRetryable(error: unknown): boolean {
  // NetworkError with isRetryable flag
  if (error instanceof NetworkError) {
    return error.isRetryable
  }

  // UraniumError with specific status codes
  if (error instanceof UraniumError) {
    return (
      error.statusCode === 429 || // Rate limit
      error.statusCode === 408 || // Request timeout
      error.statusCode === 503 // Service unavailable
    )
  }

  // AxiosError with specific status codes
  if (isAxiosError(error)) {
    const status = error.response?.status
    // Network errors (no status) are retryable
    if (status === undefined) {
      return true
    }
    // Rate limits, timeouts, and server errors are retryable
    return status === 429 || status === 408 || status >= 500
  }

  // By default, don't retry
  return false
}
