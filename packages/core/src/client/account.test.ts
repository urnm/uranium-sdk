import { describe, expect, test } from "bun:test"
import { NetworkError } from "@uranium/types"
import {
  createMockAxiosClient,
  createMockResponse,
  mockData,
} from "../test-utils/mocks"
import type { GetCurrentUserResponseDto } from "../types/api-types"
import { accountRouter } from "./account"

describe("Account Router", () => {
  describe("getMe", () => {
    test("should successfully get user information", async () => {
      // Mock response data
      const mockUserData = mockData.user()

      const mockResponse: GetCurrentUserResponseDto = createMockResponse(
        "ok",
        mockUserData,
      )

      // Create mock Axios client
      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse }),
      })

      // Create router with mock client
      const router = accountRouter(mockClient)

      // Call getMe
      const result = await router.getMe("device123")

      // Verify the call was made correctly
      expect(mockClient.post).toHaveBeenCalledTimes(1)
      expect(mockClient.post).toHaveBeenCalledWith("/clients-account/me", {
        deviceId: "device123",
      })

      // Verify the result
      expect(result).toEqual(mockUserData)
      expect(result.userId).toBe("user123")
      expect(result.role).toBe("USER")
    })

    test("should throw NetworkError when response has no user data", async () => {
      // Mock response without ok field
      const mockResponse: GetCurrentUserResponseDto = createMockResponse(
        "error",
        undefined,
        "USER_NOT_FOUND",
      )

      // Create mock Axios client
      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse, status: 400 }),
      })

      // Create router with mock client
      const router = accountRouter(mockClient)

      // Call should throw NetworkError
      await expect(router.getMe("device123")).rejects.toThrow(NetworkError)
      await expect(router.getMe("device123")).rejects.toThrow(
        "Failed to get user information",
      )
    })

    test("should handle network errors", async () => {
      // Create mock Axios client that throws
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Network error")),
      })

      // Create router with mock client
      const router = accountRouter(mockClient)

      // Call should throw
      await expect(router.getMe("device123")).rejects.toThrow("Network error")
    })
  })
})
