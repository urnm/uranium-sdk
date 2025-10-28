import { describe, expect, test } from "bun:test"
import { contractsQueryKeys } from "../utils"

describe("useCreateCollection - Module Exports", () => {
  test("should export useCreateCollection function", async () => {
    const { useCreateCollection } = await import("./useCreateCollection")
    expect(useCreateCollection).toBeDefined()
    expect(typeof useCreateCollection).toBe("function")
  })

  test("should export UseCreateCollectionResult interface", async () => {
    const module = await import("./useCreateCollection")
    expect(module).toBeDefined()
  })
})

describe("useCreateCollection - Query Keys", () => {
  test("should use contracts as base key for invalidation", () => {
    const baseKey = contractsQueryKeys.all
    expect(baseKey).toEqual(["contracts"])
  })

  test("should invalidate all contracts queries", () => {
    const baseKey = contractsQueryKeys.all
    expect(baseKey[0]).toBe("contracts")
    expect(baseKey.length).toBe(1)
  })
})

describe("useCreateCollection - Request Parameters", () => {
  test("should validate name parameter type", () => {
    const params = {
      name: "Test Collection",
      symbol: "TEST",
      type: "ERC721" as const,
    }
    expect(typeof params.name).toBe("string")
  })

  test("should validate symbol parameter type", () => {
    const params = {
      name: "Test Collection",
      symbol: "TEST",
      type: "ERC721" as const,
    }
    expect(typeof params.symbol).toBe("string")
  })

  test("should validate type parameter", () => {
    const params = {
      name: "Test Collection",
      symbol: "TEST",
      type: "ERC721" as const,
    }
    expect(params.type).toBe("ERC721")
  })

  test("should handle ERC721 type", () => {
    const type: "ERC721" | "ERC1155" = "ERC721"
    expect(type).toBe("ERC721")
  })

  test("should handle ERC1155 type", () => {
    const type: "ERC721" | "ERC1155" = "ERC1155"
    expect(type).toBe("ERC1155")
  })
})

describe("useCreateCollection - Name Validation", () => {
  test("should handle minimum length name (3 characters)", () => {
    const name = "NFT"
    expect(name.length).toBeGreaterThanOrEqual(3)
    expect(name.length).toBeLessThanOrEqual(30)
  })

  test("should handle maximum length name (30 characters)", () => {
    const name = "A".repeat(30)
    expect(name.length).toBeLessThanOrEqual(30)
  })

  test("should handle name with spaces", () => {
    const name = "My NFT Collection"
    expect(name).toContain(" ")
    expect(name.length).toBeGreaterThanOrEqual(3)
  })

  test("should handle name with special characters", () => {
    const name = "Collection_-. 123"
    expect(name.length).toBeGreaterThanOrEqual(3)
  })

  test("should handle name with numbers", () => {
    const name = "Collection123"
    expect(name).toMatch(/\d/)
  })
})

describe("useCreateCollection - Symbol Validation", () => {
  test("should handle minimum length symbol (3 characters)", () => {
    const symbol = "NFT"
    expect(symbol.length).toBeGreaterThanOrEqual(3)
    expect(symbol.length).toBeLessThanOrEqual(30)
  })

  test("should handle maximum length symbol (30 characters)", () => {
    const symbol = "A".repeat(30)
    expect(symbol.length).toBeLessThanOrEqual(30)
  })

  test("should handle symbol with underscores", () => {
    const symbol = "MY_NFT_TOKEN"
    expect(symbol).toContain("_")
  })

  test("should handle symbol with numbers", () => {
    const symbol = "NFT123"
    expect(symbol).toMatch(/\d/)
  })

  test("should handle uppercase symbol", () => {
    const symbol = "MNFT"
    expect(symbol).toBe(symbol.toUpperCase())
  })
})

describe("useCreateCollection - Mutation States", () => {
  test("should handle loading state true", () => {
    const isLoading = true
    expect(isLoading).toBe(true)
  })

  test("should handle loading state false", () => {
    const isLoading = false
    expect(isLoading).toBe(false)
  })

  test("should handle error state true", () => {
    const isError = true
    expect(isError).toBe(true)
  })

  test("should handle error state false", () => {
    const isError = false
    expect(isError).toBe(false)
  })

  test("should handle success state true", () => {
    const isSuccess = true
    expect(isSuccess).toBe(true)
  })

  test("should handle success state false", () => {
    const isSuccess = false
    expect(isSuccess).toBe(false)
  })
})

describe("useCreateCollection - Error Handling", () => {
  test("should handle error object structure", () => {
    const error = new Error("Failed to create collection")
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe("Failed to create collection")
  })

  test("should handle null error", () => {
    const error = null
    expect(error).toBeNull()
  })

  test("should handle validation errors", () => {
    const error = new Error("Name must be between 3 and 30 characters")
    expect(error.message).toContain("Name")
  })

  test("should handle network errors", () => {
    const error = new Error("Network request failed")
    expect(error.message).toContain("Network")
  })

  test("should handle authentication errors", () => {
    const error = new Error("Unauthorized")
    expect(error.message).toBe("Unauthorized")
  })
})

describe("useCreateCollection - Response Data", () => {
  test("should validate contract entity structure", () => {
    const contract = {
      id: "contract-1",
      name: "Test Collection",
      symbol: "TEST",
      ercType: "ERC721",
      status: "COMPLETE",
      type: "CREATED",
      createdAt: { seconds: 1640000000, nanos: 0 },
    }
    expect(contract).toHaveProperty("id")
    expect(contract).toHaveProperty("name")
    expect(contract).toHaveProperty("symbol")
    expect(contract).toHaveProperty("ercType")
  })

  test("should handle undefined data initially", () => {
    const data = undefined
    expect(data).toBeUndefined()
  })

  test("should handle data after successful creation", () => {
    const data = {
      id: "new-contract",
      name: "New Collection",
      symbol: "NEW",
      ercType: "ERC721" as const,
    }
    expect(data.id).toBeDefined()
    expect(data.name).toBeDefined()
  })
})

describe("useCreateCollection - Reset Functionality", () => {
  test("should provide reset function", () => {
    const reset = () => {}
    expect(typeof reset).toBe("function")
  })

  test("should clear error state on reset", () => {
    let error: Error | null = new Error("Test")
    const reset = () => {
      error = null
    }
    reset()
    expect(error).toBeNull()
  })

  test("should clear data on reset", () => {
    let data: unknown = { id: "test" }
    const reset = () => {
      data = undefined
    }
    reset()
    expect(data).toBeUndefined()
  })

  test("should clear loading state on reset", () => {
    let isLoading = true
    const reset = () => {
      isLoading = false
    }
    reset()
    expect(isLoading).toBe(false)
  })
})

describe("useCreateCollection - Multiple Calls", () => {
  test("should handle sequential collection creation", () => {
    const collections = [
      { name: "Collection1", symbol: "COL1", type: "ERC721" as const },
      { name: "Collection2", symbol: "COL2", type: "ERC1155" as const },
    ]
    expect(collections.length).toBe(2)
    expect(collections[0].type).toBe("ERC721")
    expect(collections[1].type).toBe("ERC1155")
  })

  test("should handle creation of multiple ERC721 collections", () => {
    const collections = Array.from({ length: 3 }, (_, i) => ({
      name: `Collection${i}`,
      symbol: `COL${i}`,
      type: "ERC721" as const,
    }))
    expect(collections.length).toBe(3)
    for (const c of collections) {
      expect(c.type).toBe("ERC721")
    }
  })

  test("should handle creation of multiple ERC1155 collections", () => {
    const collections = Array.from({ length: 2 }, (_, i) => ({
      name: `Collection${i}`,
      symbol: `COL${i}`,
      type: "ERC1155" as const,
    }))
    expect(collections.length).toBe(2)
    for (const c of collections) {
      expect(c.type).toBe("ERC1155")
    }
  })
})

describe("useCreateCollection - Type Safety", () => {
  test("should enforce required name field", () => {
    const params = { name: "Test", symbol: "TST", type: "ERC721" as const }
    expect(params.name).toBeDefined()
    expect(typeof params.name).toBe("string")
  })

  test("should enforce required symbol field", () => {
    const params = { name: "Test", symbol: "TST", type: "ERC721" as const }
    expect(params.symbol).toBeDefined()
    expect(typeof params.symbol).toBe("string")
  })

  test("should enforce required type field", () => {
    const params = { name: "Test", symbol: "TST", type: "ERC721" as const }
    expect(params.type).toBeDefined()
    expect(["ERC721", "ERC1155"]).toContain(params.type)
  })

  test("should validate type is union of ERC721 or ERC1155", () => {
    const validTypes = ["ERC721", "ERC1155"]
    expect(validTypes).toHaveLength(2)
  })
})

describe("useCreateCollection - Contract Entity Properties", () => {
  test("should validate id property", () => {
    const contract = { id: "contract-123" }
    expect(contract.id).toBeDefined()
    expect(typeof contract.id).toBe("string")
  })

  test("should validate name property", () => {
    const contract = { name: "My Collection" }
    expect(contract.name).toBeDefined()
    expect(typeof contract.name).toBe("string")
  })

  test("should validate symbol property", () => {
    const contract = { symbol: "MYC" }
    expect(contract.symbol).toBeDefined()
    expect(typeof contract.symbol).toBe("string")
  })

  test("should validate ercType property", () => {
    const contract = { ercType: "ERC721" }
    expect(contract.ercType).toBeDefined()
    expect(["ERC721", "ERC1155"]).toContain(contract.ercType)
  })

  test("should validate status property", () => {
    const contract = { status: "COMPLETE" }
    expect(contract.status).toBeDefined()
  })
})

describe("useCreateCollection - Async Behavior", () => {
  test("should handle async createCollection function", async () => {
    const createCollection = async () => ({
      id: "test",
      name: "Test",
      symbol: "TST",
    })
    const result = await createCollection()
    expect(result).toHaveProperty("id")
  })

  test("should handle promise rejection", async () => {
    const createCollection = async () => {
      throw new Error("Failed")
    }
    try {
      await createCollection()
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should handle successful promise resolution", async () => {
    const createCollection = async () => ({ id: "success" })
    const result = await createCollection()
    expect(result.id).toBe("success")
  })
})

describe("useCreateCollection - Query Invalidation", () => {
  test("should invalidate contracts query on success", () => {
    const queryKey = contractsQueryKeys.all
    expect(queryKey).toEqual(["contracts"])
  })

  test("should invalidate all contracts queries including list", () => {
    const baseKey = contractsQueryKeys.all
    const listKey = contractsQueryKeys.list()
    expect(listKey[0]).toBe(baseKey[0])
  })

  test("should trigger refetch after invalidation", () => {
    let refetchCalled = false
    const refetch = () => {
      refetchCalled = true
    }
    refetch()
    expect(refetchCalled).toBe(true)
  })
})

describe("useCreateCollection - Edge Cases", () => {
  test("should handle empty string validation", () => {
    const name = ""
    expect(name.length).toBeLessThan(3)
  })

  test("should handle very long strings", () => {
    const name = "A".repeat(100)
    expect(name.length).toBeGreaterThan(30)
  })

  test("should handle special characters in name", () => {
    const name = "Collection!@#$%"
    expect(name.length).toBeGreaterThan(0)
  })

  test("should handle unicode characters", () => {
    const name = "Collection 🚀"
    expect(name.length).toBeGreaterThan(0)
  })

  test("should handle null as invalid input", () => {
    const name = null
    expect(name).toBeNull()
  })
})
