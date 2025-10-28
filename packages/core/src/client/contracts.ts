import { NetworkError } from "@uranium/types"
import type { AxiosInstance } from "axios"
import type {
  ContractEntity,
  CreateUserContractRequestDto,
  CreateUserContractResponseDto,
  UserContractsResponseDto,
} from "../types/api-types"
import { createContractSchema } from "../validation/schemas"
import { validateSchema } from "../validation/utils"
import type { RequestOptions } from "./types"

/**
 * Contracts API router
 * Handles NFT collection/contract operations
 */
export const contractsRouter = (client: AxiosInstance) => ({
  /**
   * List all contracts/collections owned by the user
   * @param options - Optional request options (retry config override)
   * @returns Array of contract entities
   * @throws {NetworkError} If network request fails
   */
  list: async (_options?: RequestOptions): Promise<ContractEntity[]> => {
    const response =
      await client.get<UserContractsResponseDto>("/contracts/list")

    if (!response.data.data) {
      throw new NetworkError(
        "Failed to retrieve contracts list",
        "API_ERROR",
        false,
        undefined,
        { status: response.status, data: response.data },
      )
    }

    return response.data.data
  },

  /**
   * Create a new NFT collection/contract
   * @param params - Contract creation parameters (name, symbol, type)
   * @returns Created contract entity
   * @throws {ValidationError} If validation fails
   * @throws {NetworkError} If network request fails
   */
  create: async (
    params: CreateUserContractRequestDto,
  ): Promise<ContractEntity> => {
    // Validate input before sending request
    const validated = validateSchema(
      createContractSchema,
      params,
      "Invalid contract parameters",
    )

    const response = await client.post<CreateUserContractResponseDto>(
      "/contracts/create",
      validated,
    )

    if (!response.data.data) {
      throw new NetworkError(
        "Failed to create contract",
        "API_ERROR",
        false,
        undefined,
        { status: response.status, data: response.data },
      )
    }

    return response.data.data
  },
})

/**
 * Type for contracts router
 */
export type ContractsRouter = ReturnType<typeof contractsRouter>
