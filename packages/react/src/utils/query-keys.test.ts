import { describe, expect, test } from "bun:test"
import {
  accountQueryKeys,
  assetsQueryKeys,
  contractsQueryKeys,
  type QueryKey,
} from "./query-keys"

describe("accountQueryKeys", () => {
  test("should return all key", () => {
    expect(accountQueryKeys.all).toEqual(["account"])
  })

  test("should return detail key", () => {
    expect(accountQueryKeys.detail()).toEqual(["account", "me"])
  })

  test("should maintain type safety", () => {
    const allKey: QueryKey<typeof accountQueryKeys.all> = accountQueryKeys.all
    const detailKey: QueryKey<typeof accountQueryKeys.detail> =
      accountQueryKeys.detail()

    expect(allKey).toEqual(["account"])
    expect(detailKey).toEqual(["account", "me"])
  })

  test("should be immutable", () => {
    const key1 = accountQueryKeys.detail()
    const key2 = accountQueryKeys.detail()

    expect(key1).toEqual(key2)
    expect(key1).not.toBe(key2) // Different references
  })
})

describe("contractsQueryKeys", () => {
  test("should return all key", () => {
    expect(contractsQueryKeys.all).toEqual(["contracts"])
  })

  test("should return lists key", () => {
    expect(contractsQueryKeys.lists()).toEqual(["contracts", "list"])
  })

  test("should return list key without filters", () => {
    expect(contractsQueryKeys.list()).toEqual(["contracts", "list", undefined])
  })

  test("should return list key with filters", () => {
    const filters = { search: "test", sortBy: "name" }
    expect(contractsQueryKeys.list(filters)).toEqual([
      "contracts",
      "list",
      filters,
    ])
  })

  test("should handle empty filters object", () => {
    expect(contractsQueryKeys.list({})).toEqual(["contracts", "list", {}])
  })

  test("should handle complex filter values", () => {
    const filters = {
      search: "NFT Collection",
      sortBy: "createdAt",
      order: "desc",
      limit: 20,
      page: 1,
    }
    expect(contractsQueryKeys.list(filters)).toEqual([
      "contracts",
      "list",
      filters,
    ])
  })

  test("should maintain hierarchical structure", () => {
    const filters = { search: "test" }
    const listKey = contractsQueryKeys.list(filters)

    // Should contain all parent keys
    expect(listKey[0]).toBe("contracts")
    expect(listKey[1]).toBe("list")
    expect(listKey[2]).toEqual(filters)
  })

  test("should be immutable", () => {
    const filters = { search: "test" }
    const key1 = contractsQueryKeys.list(filters)
    const key2 = contractsQueryKeys.list(filters)

    expect(key1).toEqual(key2)
    expect(key1).not.toBe(key2)
  })
})

describe("assetsQueryKeys", () => {
  test("should return all key", () => {
    expect(assetsQueryKeys.all).toEqual(["assets"])
  })

  test("should return lists key", () => {
    expect(assetsQueryKeys.lists()).toEqual(["assets", "list"])
  })

  test("should return list key without filters", () => {
    expect(assetsQueryKeys.list()).toEqual(["assets", "list", undefined])
  })

  test("should return list key with filters", () => {
    const filters = { contractId: "123", pageSize: 20 }
    expect(assetsQueryKeys.list(filters)).toEqual(["assets", "list", filters])
  })

  test("should return details key", () => {
    expect(assetsQueryKeys.details()).toEqual(["assets", "detail"])
  })

  test("should return detail key with id", () => {
    const assetId = "asset-123"
    expect(assetsQueryKeys.detail(assetId)).toEqual([
      "assets",
      "detail",
      assetId,
    ])
  })

  test("should handle different asset IDs", () => {
    expect(assetsQueryKeys.detail("1")).toEqual(["assets", "detail", "1"])
    expect(assetsQueryKeys.detail("abc-def-123")).toEqual([
      "assets",
      "detail",
      "abc-def-123",
    ])
    expect(assetsQueryKeys.detail("uuid-v4-format")).toEqual([
      "assets",
      "detail",
      "uuid-v4-format",
    ])
  })

  test("should handle complex list filters", () => {
    const filters = {
      contractId: "contract-123",
      pageSize: 50,
      sortBy: "createdAt",
      order: "desc",
      quickFilter: "search term",
    }
    expect(assetsQueryKeys.list(filters)).toEqual(["assets", "list", filters])
  })

  test("should maintain hierarchical structure for lists", () => {
    const filters = { contractId: "123" }
    const listKey = assetsQueryKeys.list(filters)

    expect(listKey[0]).toBe("assets")
    expect(listKey[1]).toBe("list")
    expect(listKey[2]).toEqual(filters)
  })

  test("should maintain hierarchical structure for details", () => {
    const assetId = "asset-123"
    const detailKey = assetsQueryKeys.detail(assetId)

    expect(detailKey[0]).toBe("assets")
    expect(detailKey[1]).toBe("detail")
    expect(detailKey[2]).toBe(assetId)
  })

  test("should be immutable", () => {
    const filters = { contractId: "123" }
    const key1 = assetsQueryKeys.list(filters)
    const key2 = assetsQueryKeys.list(filters)

    expect(key1).toEqual(key2)
    expect(key1).not.toBe(key2)

    const id = "asset-123"
    const detailKey1 = assetsQueryKeys.detail(id)
    const detailKey2 = assetsQueryKeys.detail(id)

    expect(detailKey1).toEqual(detailKey2)
    expect(detailKey1).not.toBe(detailKey2)
  })
})

describe("Query key hierarchy", () => {
  test("account hierarchy should be valid", () => {
    const all = accountQueryKeys.all
    const detail = accountQueryKeys.detail()

    // Detail should include all
    expect(detail[0]).toBe(all[0])
  })

  test("contracts hierarchy should be valid", () => {
    const all = contractsQueryKeys.all
    const lists = contractsQueryKeys.lists()
    const list = contractsQueryKeys.list({ search: "test" })

    // Lists should include all
    expect(lists[0]).toBe(all[0])

    // List should include all and lists
    expect(list[0]).toBe(all[0])
    expect(list[1]).toBe(lists[1])
  })

  test("assets hierarchy should be valid", () => {
    const all = assetsQueryKeys.all
    const lists = assetsQueryKeys.lists()
    const list = assetsQueryKeys.list({ contractId: "123" })
    const details = assetsQueryKeys.details()
    const detail = assetsQueryKeys.detail("asset-123")

    // Lists should include all
    expect(lists[0]).toBe(all[0])

    // List should include all and lists
    expect(list[0]).toBe(all[0])
    expect(list[1]).toBe(lists[1])

    // Details should include all
    expect(details[0]).toBe(all[0])

    // Detail should include all and details
    expect(detail[0]).toBe(all[0])
    expect(detail[1]).toBe(details[1])
  })
})

describe("Type safety", () => {
  test("should infer correct types from query keys", () => {
    // Test that TypeScript correctly infers readonly tuple types
    const accountAll: readonly ["account"] = accountQueryKeys.all
    const accountDetail: readonly ["account", "me"] = accountQueryKeys.detail()

    const contractsAll: readonly ["contracts"] = contractsQueryKeys.all
    const contractsLists: readonly ["contracts", "list"] =
      contractsQueryKeys.lists()

    const assetsAll: readonly ["assets"] = assetsQueryKeys.all
    const assetsDetails: readonly ["assets", "detail"] =
      assetsQueryKeys.details()

    // Verify values
    expect(accountAll).toEqual(["account"])
    expect(accountDetail).toEqual(["account", "me"])
    expect(contractsAll).toEqual(["contracts"])
    expect(contractsLists).toEqual(["contracts", "list"])
    expect(assetsAll).toEqual(["assets"])
    expect(assetsDetails).toEqual(["assets", "detail"])
  })

  test("QueryKey type helper should work correctly", () => {
    type AccountAllKey = QueryKey<typeof accountQueryKeys.all>
    type AccountDetailKey = QueryKey<typeof accountQueryKeys.detail>

    type ContractsAllKey = QueryKey<typeof contractsQueryKeys.all>
    type ContractsListKey = QueryKey<typeof contractsQueryKeys.list>

    type AssetsAllKey = QueryKey<typeof assetsQueryKeys.all>
    type AssetsDetailKey = QueryKey<typeof assetsQueryKeys.detail>

    // These are compile-time checks, runtime verification
    const accountAll: AccountAllKey = accountQueryKeys.all
    const accountDetail: AccountDetailKey = accountQueryKeys.detail()

    const contractsAll: ContractsAllKey = contractsQueryKeys.all
    const contractsList: ContractsListKey = contractsQueryKeys.list()

    const assetsAll: AssetsAllKey = assetsQueryKeys.all
    const assetsDetail: AssetsDetailKey = assetsQueryKeys.detail("test-id")

    expect(accountAll).toBeDefined()
    expect(accountDetail).toBeDefined()
    expect(contractsAll).toBeDefined()
    expect(contractsList).toBeDefined()
    expect(assetsAll).toBeDefined()
    expect(assetsDetail).toBeDefined()
  })
})
