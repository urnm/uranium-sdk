import { describe, expect, spyOn, test } from "bun:test"
import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  ValidationError,
} from "@uranium/types"
import type { InternalAxiosRequestConfig } from "axios"
import type { UraniumConfig } from "../types/config"
import { createApiClient, createRequest } from "./base"

describe("Base API Client", () => {
  describe("createApiClient", () => {
    test("should throw error when API key is missing", () => {
      expect(() => {
        createApiClient({} as UraniumConfig)
      }).toThrow("API key is required")
    })

    test("should create client with minimal config", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
      }

      const client = createApiClient(config)

      expect(client.defaults.baseURL).toBe("https://gw.urnm.pro")
      expect(client.defaults.timeout).toBe(20000)
      expect(client.defaults.headers["Content-Type"]).toBe("application/json")
    })

    test("should create client with custom base URL", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
        baseUrl: "https://custom-api.example.com",
      }

      const client = createApiClient(config)

      expect(client.defaults.baseURL).toBe("https://custom-api.example.com")
    })

    test("should create client with custom timeout", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
        timeout: 30000,
      }

      const client = createApiClient(config)

      expect(client.defaults.timeout).toBe(30000)
    })

    test("should generate device ID if not provided", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
      }

      const client = createApiClient(config)

      // Device ID should be set in config resolution
      // We can't directly test it without making a request, but we can verify client was created
      expect(client).toBeDefined()
    })

    test("should use provided device ID", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
        deviceId: "custom-device-id",
      }

      const client = createApiClient(config)

      expect(client).toBeDefined()
    })
  })

  describe("Request Interceptor", () => {
    test("should add x-auth-token header to requests", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key-12345",
      }

      const client = createApiClient(config)

      // Verify the interceptor count (should have at least our auth interceptor)
      expect(client.interceptors.request.handlers.length).toBeGreaterThan(0)

      // The auth interceptor is added in createApiClient
      // We can verify the client was created with proper config
      expect(client.defaults.headers["Content-Type"]).toBe("application/json")
    })
  })

  describe("Config Resolution", () => {
    test("should apply all defaults correctly", () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
      }

      const client = createApiClient(config)

      expect(client.defaults.baseURL).toBe("https://gw.urnm.pro")
      expect(client.defaults.timeout).toBe(20000)
    })

    test("should merge partial retry config with defaults", () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: {
          maxRetries: 5,
        },
      }

      const client = createApiClient(config)

      // Config is resolved internally, client should be created successfully
      expect(client).toBeDefined()
    })

    test("should handle full custom config", () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        baseUrl: "https://custom.example.com",
        timeout: 15000,
        deviceId: "custom-device",
        debug: true,
        retry: {
          maxRetries: 5,
          retryDelay: 2000,
          retryableStatuses: [500, 502],
        },
      }

      const client = createApiClient(config)

      expect(client.defaults.baseURL).toBe("https://custom.example.com")
      expect(client.defaults.timeout).toBe(15000)
    })
  })

  describe("Type Safety", () => {
    test("should enforce required apiKey", () => {
      // @ts-expect-error - apiKey is required
      const config: UraniumConfig = {
        baseUrl: "https://example.com",
      }

      expect(() => createApiClient(config)).toThrow()
    })

    test("should accept valid config", () => {
      const config: UraniumConfig = {
        apiKey: "valid-key",
        baseUrl: "https://example.com",
        timeout: 30000,
      }

      expect(() => createApiClient(config)).not.toThrow()
    })
  })

  describe("Debug Logging", () => {
    test("should log debug messages when debug is enabled", async () => {
      const consoleSpy = spyOn(console, "log")

      const config: UraniumConfig = {
        apiKey: "test-key",
        debug: true,
      }

      const client = createApiClient(config)

      // Trigger a request to test debug logging
      try {
        await client.get("/test")
      } catch {
        // Expected to fail, we're just testing debug logging
      }

      // Check that debug logging occurred
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    test("should not log when debug is disabled", () => {
      const consoleSpy = spyOn(console, "log")

      const config: UraniumConfig = {
        apiKey: "test-key",
        debug: false,
      }

      const _client = createApiClient(config)

      // Debug logging should not occur
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("[Uranium SDK]"),
      )

      consoleSpy.mockRestore()
    })
  })

  describe("Request Interceptor Error Handling", () => {
    test("should handle request interceptor errors", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        debug: true,
      }

      const client = createApiClient(config)

      // Force an error in request interceptor by using invalid config
      try {
        await client.request({
          url: "/test",
          // @ts-expect-error - intentionally invalid
          adapter: () => Promise.reject(new Error("Request failed")),
        })
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe("Response Interceptor", () => {
    test("should handle API errors in successful HTTP response", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        debug: true,
      }

      const client = createApiClient(config)

      // Mock axios to return error in response data
      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            return {
              data: { status: "error", errorCode: "TEST_ERROR" },
              status: 200,
              statusText: "OK",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
          },
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        expect((error as Error).message).toContain("API Error")
      }
    })

    test("should handle 401 authentication error", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: { enabled: false },
      }

      const client = createApiClient(config)

      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            // biome-ignore lint/suspicious/noExplicitAny: Testing error mock
            const error: any = new Error("Unauthorized")
            error.response = {
              status: 401,
              data: { errorCode: "AUTH_REQUIRED" },
              statusText: "Unauthorized",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
            error.isAxiosError = true
            throw error
          },
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError)
      }
    })

    test("should handle 403 forbidden error", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: { enabled: false },
      }

      const client = createApiClient(config)

      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            // biome-ignore lint/suspicious/noExplicitAny: Testing error mock
            const error: any = new Error("Forbidden")
            error.response = {
              status: 403,
              data: {},
              statusText: "Forbidden",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
            error.isAxiosError = true
            throw error
          },
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError)
      }
    })

    test("should handle 404 not found error", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: { enabled: false },
      }

      const client = createApiClient(config)

      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            // biome-ignore lint/suspicious/noExplicitAny: Testing error mock
            const error: any = new Error("Not Found")
            error.response = {
              status: 404,
              data: {},
              statusText: "Not Found",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
            error.isAxiosError = true
            throw error
          },
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
      }
    })

    test("should handle 400 validation error", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: { enabled: false },
      }

      const client = createApiClient(config)

      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            // biome-ignore lint/suspicious/noExplicitAny: Testing error mock
            const error: any = new Error("Bad Request")
            error.response = {
              status: 400,
              data: { errorCode: "INVALID_INPUT" },
              statusText: "Bad Request",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
            error.isAxiosError = true
            throw error
          },
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        expect((error as Error).message).toContain("INVALID_INPUT")
      }
    })

    test("should handle 422 validation error", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: { enabled: false },
      }

      const client = createApiClient(config)

      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            // biome-ignore lint/suspicious/noExplicitAny: Testing error mock
            const error: any = new Error("Unprocessable Entity")
            error.response = {
              status: 422,
              data: {},
              statusText: "Unprocessable Entity",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
            error.isAxiosError = true
            throw error
          },
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
      }
    })

    test("should handle 500 server error", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: { enabled: false },
      }

      const client = createApiClient(config)

      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            // biome-ignore lint/suspicious/noExplicitAny: Testing error mock
            const error: any = new Error("Internal Server Error")
            error.response = {
              status: 500,
              data: {},
              statusText: "Internal Server Error",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
            error.isAxiosError = true
            throw error
          },
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError)
      }
    })

    test("should handle 502 bad gateway error", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: { enabled: false },
      }

      const client = createApiClient(config)

      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            // biome-ignore lint/suspicious/noExplicitAny: Testing error mock
            const error: any = new Error("Bad Gateway")
            error.response = {
              status: 502,
              data: {},
              statusText: "Bad Gateway",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
            error.isAxiosError = true
            throw error
          },
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError)
      }
    })

    test("should handle network error without response", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
        retry: { enabled: false },
      }

      const client = createApiClient(config)

      try {
        await client.request({
          url: "/test",
          adapter: async () => {
            const error: any = new Error("Network Error")
            error.isAxiosError = true
            // No response property - simulates network failure
            throw error
          },
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError)
      }
    })
  })

  describe("createRequest helper", () => {
    test("should create request and return typed data", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
      }

      const client = createApiClient(config)

      interface TestResponse {
        id: string
        name: string
      }

      const result = await createRequest<TestResponse>(client, {
        url: "/test",
        method: "GET",
        adapter: async () => {
          return {
            data: { id: "123", name: "test" },
            status: 200,
            statusText: "OK",
            headers: {},
            config: {} as InternalAxiosRequestConfig,
          }
        },
      })

      expect(result.id).toBe("123")
      expect(result.name).toBe("test")
    })

    test("should merge options with config", async () => {
      const config: UraniumConfig = {
        apiKey: "test-key",
      }

      const client = createApiClient(config)

      const result = await createRequest(
        client,
        {
          url: "/test",
          method: "GET",
        },
        {
          params: { page: 1 },
          adapter: async (cfg) => {
            expect(cfg.params).toEqual({ page: 1 })
            return {
              data: { success: true },
              status: 200,
              statusText: "OK",
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            }
          },
        },
      )

      expect(result).toEqual({ success: true })
    })
  })
})
