import { describe, expect, test } from "bun:test"
import { NetworkError, ValidationError } from "@uranium/types"
import {
  createMockAxiosClient,
  createMockResponse,
  mockData,
} from "../test-utils/mocks"
import type {
  ContractEntity,
  CreateUserContractResponseDto,
  UserContractsResponseDto,
} from "../types/api-types"
import { contractsRouter } from "./contracts"

describe("Contracts Router", () => {
  describe("list", () => {
    test("should successfully list contracts", async () => {
      // Mock contract data
      const mockContracts: ContractEntity[] = [
        mockData.contract({
          id: "contract1",
          name: "MyContract",
          symbol: "MYC",
        }),
        mockData.contract({
          id: "contract2",
          address: "0xdef456",
          name: "AnotherContract",
          symbol: "ANC",
          type: "ERC1155",
          ercType: "ERC1155",
          createdAt: { seconds: 1234567900, nanos: 0 },
          lastTokenId: 10,
          count: 20,
        }),
      ]

      const mockResponse: UserContractsResponseDto = createMockResponse(
        "ok",
        mockContracts,
      )

      // Create mock Axios client
      const mockClient = createMockAxiosClient({
        get: () => Promise.resolve({ data: mockResponse }),
      })

      // Create router with mock client
      const router = contractsRouter(mockClient)

      // Call list
      const result = await router.list()

      // Verify the call was made correctly
      expect(mockClient.get).toHaveBeenCalledTimes(1)
      expect(mockClient.get).toHaveBeenCalledWith("/contracts/list")

      // Verify the result
      expect(result).toEqual(mockContracts)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe("MyContract")
    })

    test("should throw NetworkError when response has no data", async () => {
      const mockResponse: UserContractsResponseDto = createMockResponse(
        "error",
        null as any,
        "INVALID_REQUEST",
      )

      const mockClient = createMockAxiosClient({
        get: () => Promise.resolve({ data: mockResponse, status: 400 }),
      })

      const router = contractsRouter(mockClient)

      await expect(router.list()).rejects.toThrow(NetworkError)
      await expect(router.list()).rejects.toThrow(
        "Failed to retrieve contracts list",
      )
    })
  })

  describe("create", () => {
    test("should successfully create a contract", async () => {
      const mockContract: ContractEntity = mockData.contract({
        address: null,
        name: "NewContract",
        symbol: "NEW",
        status: "pending",
        lastTokenId: 0,
        count: 0,
      })

      const mockResponse: CreateUserContractResponseDto = createMockResponse(
        "ok",
        mockContract,
      )

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse }),
      })

      const router = contractsRouter(mockClient)

      const params = {
        name: "NewContract",
        symbol: "NEW",
        type: "ERC721" as const,
      }

      const result = await router.create(params)

      // Verify the call was made correctly
      expect(mockClient.post).toHaveBeenCalledTimes(1)
      expect(mockClient.post).toHaveBeenCalledWith("/contracts/create", params)

      // Verify the result
      expect(result).toEqual(mockContract)
      expect(result.name).toBe("NewContract")
      expect(result.symbol).toBe("NEW")
    })

    test("should validate contract parameters before sending", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: {} }),
      })

      const router = contractsRouter(mockClient)

      // Invalid name (too short)
      await expect(
        router.create({
          name: "AB",
          symbol: "MYC",
          type: "ERC721",
        }),
      ).rejects.toThrow(ValidationError)

      // Invalid symbol (too short)
      await expect(
        router.create({
          name: "MyContract",
          symbol: "AB",
          type: "ERC721",
        }),
      ).rejects.toThrow(ValidationError)

      // Invalid type
      await expect(
        router.create({
          name: "MyContract",
          symbol: "MYC",
          type: "ERC20" as any,
        }),
      ).rejects.toThrow(ValidationError)

      // Verify post was never called due to validation errors
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw NetworkError when response has no data", async () => {
      const mockResponse: CreateUserContractResponseDto = createMockResponse(
        "error",
        undefined,
        "LIMIT_EXCEEDED",
      )

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse, status: 400 }),
      })

      const router = contractsRouter(mockClient)

      const params = {
        name: "NewContract",
        symbol: "NEW",
        type: "ERC721" as const,
      }

      await expect(router.create(params)).rejects.toThrow(NetworkError)
      await expect(router.create(params)).rejects.toThrow(
        "Failed to create contract",
      )
    })
  })
})
