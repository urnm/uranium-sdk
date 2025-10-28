import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  ValidationError,
} from "@uranium/types"
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios"
import * as axiosModule from "axios"
import type { ResolvedUraniumConfig, UraniumConfig } from "../types/config"
import { DEFAULT_CONFIG, DEFAULT_RETRY_CONFIG } from "../types/config"
import { withRetry } from "./retry"
import { generateDeviceId, getErrorMessage, shouldRetry } from "./utils"

const axios = axiosModule.default

/**
 * Resolves user config with defaults
 */
function resolveConfig(config: UraniumConfig): ResolvedUraniumConfig {
  if (!config.apiKey) {
    throw new Error(
      "API key is required. Get your API key from: https://portal.uranium.pro/dashboard/profile/api-keys",
    )
  }

  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
    deviceId: config.deviceId ?? generateDeviceId(),
    debug: config.debug ?? DEFAULT_CONFIG.debug,
    retry: {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retry,
    },
  }
}

/**
 * Logs debug information if debug mode is enabled
 */
// biome-ignore lint/suspicious/noExplicitAny: Debug utility accepts any data type
function debugLog(debug: boolean, message: string, data?: any): void {
  if (debug) {
    console.log(`[Uranium SDK] ${message}`, data ?? "")
  }
}

/**
 * Creates an Axios instance configured for Uranium API
 */
export const createApiClient = (config: UraniumConfig): AxiosInstance => {
  const resolvedConfig = resolveConfig(config)

  // Create axios instance with base configuration
  const client = axios.create({
    baseURL: resolvedConfig.baseUrl,
    timeout: resolvedConfig.timeout,
    headers: {
      "Content-Type": "application/json",
    },
  })

  // Request interceptor: add authentication and debug logging
  client.interceptors.request.use(
    (requestConfig) => {
      // Add API key to headers
      requestConfig.headers["x-auth-token"] = resolvedConfig.apiKey

      // Debug logging
      debugLog(
        resolvedConfig.debug,
        `Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`,
        {
          params: requestConfig.params,
          data: requestConfig.data,
        },
      )

      return requestConfig
    },
    (error) => {
      debugLog(resolvedConfig.debug, "Request Error:", error)
      throw error
    },
  )

  // Response interceptor: handle errors and debug logging
  client.interceptors.response.use(
    (response) => {
      // Debug logging
      debugLog(
        resolvedConfig.debug,
        `Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.data?.status,
          errorCode: response.data?.errorCode,
        },
      )

      // Check if API returned an error in successful HTTP response
      if (response.data?.status === "error" || response.data?.errorCode) {
        const errorCode = response.data.errorCode || "UNKNOWN_ERROR"
        const errorMessage = `API Error: ${errorCode}`

        debugLog(resolvedConfig.debug, "API Error in response:", {
          errorCode,
          status: response.data.status,
        })

        // Throw appropriate error based on error code
        throw new ValidationError(errorMessage)
      }

      return response
    },
    (error: AxiosError) => {
      // Retry logic: check if error is retryable and retry is enabled
      if (
        resolvedConfig.retry.enabled &&
        shouldRetry(error, resolvedConfig.retry.retryableStatuses)
      ) {
        // biome-ignore lint/style/noNonNullAssertion: Config exists on retry errors
        return withRetry(
          () => client.request(error.config!),
          resolvedConfig.retry,
        )
      }

      // Debug logging
      debugLog(resolvedConfig.debug, "Response Error:", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      })

      // Handle different error types
      if (!error.response) {
        // Network error (no response from server)
        throw new NetworkError(getErrorMessage(error))
      }

      const status = error.response.status
      // biome-ignore lint/suspicious/noExplicitAny: Response data structure is dynamic
      const responseData = error.response.data as any
      const errorCode = responseData?.errorCode
      const errorMessage = errorCode
        ? `${getErrorMessage(error)} (Error Code: ${errorCode})`
        : getErrorMessage(error)

      // Map HTTP status codes to error types
      switch (status) {
        case 401:
          throw new AuthenticationError(errorMessage)

        case 403:
          throw new AuthenticationError(errorMessage)

        case 404:
          throw new NotFoundError(errorMessage)

        case 400:
        case 422:
          throw new ValidationError(errorMessage)

        default:
          // For 5xx and other errors, throw NetworkError
          if (status >= 500) {
            throw new NetworkError(errorMessage)
          }
          throw new NetworkError(errorMessage)
      }
    },
  )

  return client
}

/**
 * Helper function to create a request with proper typing
 */
export const createRequest = async <T>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const response = await client.request<T>({
    ...config,
    ...options,
  })
  return response.data
}
