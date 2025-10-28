import { NetworkError } from "@uranium/types"
import type { AxiosInstance } from "axios"
import type {
  GetCurrentUserResponse_OK,
  GetCurrentUserResponseDto,
} from "../types/api-types"
import type { RequestOptions } from "./types"

/**
 * Account API router
 * Handles user account operations
 */
export const accountRouter = (client: AxiosInstance) => ({
  /**
   * Get current authenticated user information
   * @param deviceId - Device identifier for the request
   * @param options - Optional request options (retry config override)
   * @returns User entity with account details
   * @throws {AuthenticationError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  getMe: async (
    deviceId: string,
    _options?: RequestOptions,
  ): Promise<GetCurrentUserResponse_OK> => {
    const response = await client.post<GetCurrentUserResponseDto>(
      "/clients-account/me",
      {
        deviceId,
      },
    )

    if (!response.data.ok) {
      throw new NetworkError(
        "Failed to get user information",
        "API_ERROR",
        false,
        undefined,
        { status: response.status, data: response.data },
      )
    }

    return response.data.ok
  },
})

/**
 * Type for account router
 */
export type AccountRouter = ReturnType<typeof accountRouter>
