import type { AxiosError } from "axios"

/**
 * Generates a unique device ID for SDK usage
 * @returns Device ID in format "sdk-{uuid}"
 */
export const generateDeviceId = (): string => {
  return `sdk-${crypto.randomUUID()}`
}

/**
 * Extracts AbortSignal from AbortController or AbortSignal
 * @param signal - AbortController or AbortSignal instance
 * @returns AbortSignal or undefined
 */
export const extractSignal = (
  signal?: AbortSignal | AbortController | undefined,
): AbortSignal | undefined => {
  if (signal && typeof signal === "object" && "signal" in signal) {
    return signal.signal
  }
  return signal as AbortSignal | undefined
}

/**
 * Converts an error to a user-friendly message
 * @param error - Error object (typically AxiosError)
 * @returns Human-readable error message
 */
export const getErrorMessage = (error: unknown): string => {
  // Handle Axios errors
  if (isAxiosError(error)) {
    // Network error (no response)
    if (!error.response) {
      return "Network error occurred. Please check your connection."
    }

    const status = error.response.status

    // Authentication errors
    if (status === 401) {
      return "Authentication failed. Please check your API key."
    }

    // Permission errors
    if (status === 403) {
      return "Access denied. Please check your permissions."
    }

    // Not found
    if (status === 404) {
      return "Resource not found."
    }

    // Validation errors
    if (status === 400) {
      // Try to extract error message from response
      const responseData = error.response.data as any
      if (responseData?.errorCode) {
        return `Validation error: ${responseData.errorCode}`
      }
      return "Invalid request. Please check your input."
    }

    // Rate limiting
    if (status === 429) {
      return "Too many requests. Please try again later."
    }

    // Server errors
    if (status >= 500) {
      return "Server error. Please try again later."
    }

    // Other HTTP errors
    return `Request failed with status ${status}.`
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message
  }

  // Unknown error type
  return "An unexpected error occurred."
}

/**
 * Type guard to check if error is an AxiosError
 * @param error - Error to check
 * @returns true if error is AxiosError
 */
export const isAxiosError = (error: unknown): error is AxiosError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as any).isAxiosError === true
  )
}

/**
 * Checks if an error should trigger a retry based on status code. Never retries authentication errors (401, 403) or rate limiting (429).
 * @param error - Error object
 * @param retryableStatuses - Array of HTTP status codes that should be retried
 * @returns true if error should be retried
 */
export const shouldRetry = (
  error: unknown,
  retryableStatuses: number[],
): boolean => {
  if (!isAxiosError(error)) {
    return false
  }

  // No response means network error - could be retried
  if (!error.response) {
    return true
  }

  const status = error.response.status

  // Never retry authentication/permission errors
  if (status === 401 || status === 403) {
    return false
  }

  // Never retry rate limiting (429)
  if (status === 429) {
    return false
  }

  // Check if status is in retryable list
  return retryableStatuses.includes(status)
}
