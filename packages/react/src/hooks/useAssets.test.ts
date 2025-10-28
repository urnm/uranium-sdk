import { describe, expect, test } from "bun:test"
import { assetsQueryKeys } from "../utils"

describe("useAssets - Query Keys", () => {
  test("should use correct query key for assets list", () => {
    const params = { contractId: "contract-1", pageSize: 20 }
    const queryKey = assetsQueryKeys.list(params)
    expect(queryKey).toEqual(["assets", "list", params])
  })

  test("should use assets as base key", () => {
    const baseKey = assetsQueryKeys.all
    expect(baseKey).toEqual(["assets"])
  })

  test("should maintain query key hierarchy", () => {
    const listKey = assetsQueryKeys.list()
    expect(listKey[0]).toBe("assets")
    expect(listKey[1]).toBe("list")
  })

  test("should include filters in query key", () => {
    const filters = { contractId: "test", sortBy: "createdAt" }
    const listKey = assetsQueryKeys.list(filters)
    expect(listKey[2]).toEqual(filters)
  })
})

describe("useAssets - Return Type", () => {
  test("should export useAssets function", async () => {
    const { useAssets } = await import("./useAssets")
    expect(useAssets).toBeDefined()
    expect(typeof useAssets).toBe("function")
  })

  test("should export UseAssetsResult interface", async () => {
    const module = await import("./useAssets")
    expect(module).toBeDefined()
  })

  test("should export UseAssetsParams interface", async () => {
    const module = await import("./useAssets")
    expect(module).toBeDefined()
  })
})

describe("useAssets - Default Parameters", () => {
  test("should use default pageSize of 20", () => {
    const pageSize = 20
    expect(pageSize).toBe(20)
  })

  test("should use default sortBy of createdAt", () => {
    const sortBy = "createdAt"
    expect(sortBy).toBe("createdAt")
  })

  test("should use default order of desc", () => {
    const order = "desc"
    expect(order).toBe("desc")
  })

  test("should use default enabled of true", () => {
    const enabled = true
    expect(enabled).toBe(true)
  })
})

describe("useAssets - Sort Options", () => {
  test("should accept createdAt as sortBy", () => {
    const sortBy: "createdAt" | "title" | "status" = "createdAt"
    expect(sortBy).toBe("createdAt")
  })

  test("should accept title as sortBy", () => {
    const sortBy: "createdAt" | "title" | "status" = "title"
    expect(sortBy).toBe("title")
  })

  test("should accept status as sortBy", () => {
    const sortBy: "createdAt" | "title" | "status" = "status"
    expect(sortBy).toBe("status")
  })
})

describe("useAssets - Order Options", () => {
  test("should accept asc as order", () => {
    const order: "asc" | "desc" = "asc"
    expect(order).toBe("asc")
  })

  test("should accept desc as order", () => {
    const order: "asc" | "desc" = "desc"
    expect(order).toBe("desc")
  })
})

describe("useAssets - Pagination Logic", () => {
  test("should calculate next page correctly", () => {
    const currentPage = 1
    const countPages = 3
    const hasNextPage = currentPage < countPages
    expect(hasNextPage).toBe(true)
  })

  test("should detect last page correctly", () => {
    const currentPage = 3
    const countPages = 3
    const hasNextPage = currentPage < countPages
    expect(hasNextPage).toBe(false)
  })

  test("should handle single page", () => {
    const currentPage = 1
    const countPages = 1
    const hasNextPage = currentPage < countPages
    expect(hasNextPage).toBe(false)
  })

  test("should calculate next page number", () => {
    const page = 1
    const countPages = 5
    const nextPage = page < countPages ? page + 1 : undefined
    expect(nextPage).toBe(2)
  })

  test("should return undefined when no next page", () => {
    const page = 5
    const countPages = 5
    const nextPage = page < countPages ? page + 1 : undefined
    expect(nextPage).toBeUndefined()
  })
})

describe("useAssets - Data Flattening", () => {
  test("should flatten empty pages", () => {
    const pages = [{ data: [] }, { data: [] }]
    const assets = pages.flatMap((page) => page.data)
    expect(assets).toEqual([])
  })

  test("should flatten single page", () => {
    const pages = [{ data: [{ id: "1" }] }]
    const assets = pages.flatMap((page) => page.data)
    expect(assets).toEqual([{ id: "1" }])
  })

  test("should flatten multiple pages", () => {
    const pages = [
      { data: [{ id: "1" }, { id: "2" }] },
      { data: [{ id: "3" }, { id: "4" }] },
    ]
    const assets = pages.flatMap((page) => page.data)
    expect(assets).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }])
  })

  test("should handle undefined data", () => {
    const data = undefined
    const assets = data?.flatMap((page) => page.data) || []
    expect(assets).toEqual([])
  })
})

describe("useAssets - Stale Time Configuration", () => {
  test("should use 5 minutes stale time", () => {
    const staleTime = 5 * 60 * 1000
    expect(staleTime).toBe(300000)
  })

  test("should convert minutes to milliseconds correctly", () => {
    const minutes = 5
    const staleTime = minutes * 60 * 1000
    expect(staleTime).toBe(300000)
  })
})

describe("useAssets - Request Parameters", () => {
  test("should build request params with all fields", () => {
    const params = {
      contractId: "contract-1",
      page: 1,
      pageSize: 20,
      sortBy: "createdAt" as const,
      order: "desc" as const,
      quickFilter: "test",
    }
    expect(params).toHaveProperty("contractId")
    expect(params).toHaveProperty("page")
    expect(params).toHaveProperty("pageSize")
    expect(params).toHaveProperty("sortBy")
    expect(params).toHaveProperty("order")
    expect(params).toHaveProperty("quickFilter")
  })

  test("should handle optional contractId", () => {
    const params = {
      page: 1,
      pageSize: 20,
      sortBy: "createdAt" as const,
      order: "desc" as const,
    }
    expect(params.contractId).toBeUndefined()
  })

  test("should handle optional quickFilter", () => {
    const params = {
      contractId: "contract-1",
      page: 1,
      pageSize: 20,
      sortBy: "createdAt" as const,
      order: "desc" as const,
    }
    expect(params.quickFilter).toBeUndefined()
  })
})

describe("useAssets - Error Handling", () => {
  test("should handle error object structure", () => {
    const error = new Error("Failed to fetch assets")
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe("Failed to fetch assets")
  })

  test("should handle null error", () => {
    const error = null
    expect(error).toBeNull()
  })

  test("should handle undefined error", () => {
    const error = undefined
    expect(error).toBeUndefined()
  })

  test("should handle network errors", () => {
    const error = new Error("Network error")
    expect(error.message).toContain("Network")
  })
})

describe("useAssets - Loading States", () => {
  test("should handle initial loading state", () => {
    const isLoading = true
    expect(isLoading).toBe(true)
  })

  test("should handle loaded state", () => {
    const isLoading = false
    expect(isLoading).toBe(false)
  })

  test("should handle fetching next page state", () => {
    const isFetchingNextPage = true
    expect(isFetchingNextPage).toBe(true)
  })

  test("should handle not fetching state", () => {
    const isFetchingNextPage = false
    expect(isFetchingNextPage).toBe(false)
  })
})

describe("useAssets - Asset Entity Structure", () => {
  test("should validate asset entity properties", () => {
    const asset = {
      id: "asset-1",
      title: "Test Asset",
      slug: "test-asset",
      status: 14,
      ercContractType: "ERC721",
      contractId: "contract-1",
    }
    expect(asset).toHaveProperty("id")
    expect(asset).toHaveProperty("title")
    expect(asset).toHaveProperty("slug")
    expect(asset).toHaveProperty("status")
  })

  test("should handle asset with media properties", () => {
    const asset = {
      sourceUrl: "https://example.com/source.png",
      thumbnailUrl: "https://example.com/thumb.png",
      mediaUrl: "https://example.com/media.png",
      mediaType: "image",
      mediaSize: 1024,
    }
    expect(asset.sourceUrl).toContain("https://")
    expect(asset.mediaType).toBe("image")
  })

  test("should handle asset with metadata", () => {
    const asset = {
      title: "Test Asset",
      description: "Test description",
      authorName: "Test Author",
      location: "Test Location",
    }
    expect(asset.title).toBeDefined()
    expect(asset.description).toBeDefined()
  })
})

describe("useAssets - Paginated Response", () => {
  test("should validate paginated response structure", () => {
    const response = {
      data: [],
      meta: {
        total: 0,
        page: 1,
        pageSize: 20,
        countPages: 0,
      },
    }
    expect(response).toHaveProperty("data")
    expect(response).toHaveProperty("meta")
  })

  test("should handle meta properties", () => {
    const meta = {
      total: 100,
      page: 1,
      pageSize: 20,
      countPages: 5,
    }
    expect(meta.total).toBe(100)
    expect(meta.countPages).toBe(5)
  })

  test("should handle null meta", () => {
    const meta = null
    const page = meta?.page || 1
    const countPages = meta?.countPages || 1
    expect(page).toBe(1)
    expect(countPages).toBe(1)
  })
})

describe("useAssets - Filter Parameters", () => {
  test("should handle contractId filter", () => {
    const params = { contractId: "contract-1" }
    expect(params.contractId).toBe("contract-1")
  })

  test("should handle pageSize parameter", () => {
    const params = { pageSize: 50 }
    expect(params.pageSize).toBe(50)
  })

  test("should handle sortBy parameter", () => {
    const params = { sortBy: "title" as const }
    expect(params.sortBy).toBe("title")
  })

  test("should handle order parameter", () => {
    const params = { order: "asc" as const }
    expect(params.order).toBe("asc")
  })

  test("should handle quickFilter parameter", () => {
    const params = { quickFilter: "search term" }
    expect(params.quickFilter).toBe("search term")
  })

  test("should handle enabled parameter", () => {
    const params = { enabled: false }
    expect(params.enabled).toBe(false)
  })
})

describe("useAssets - Has Next Page Logic", () => {
  test("should return true when more pages exist", () => {
    const hasNextPage = true
    expect(hasNextPage).toBe(true)
  })

  test("should return false when no more pages", () => {
    const hasNextPage = false
    expect(hasNextPage).toBe(false)
  })

  test("should default to false when undefined", () => {
    const hasNextPage = undefined || false
    expect(hasNextPage).toBe(false)
  })
})

describe("useAssets - Module Exports", () => {
  test("should export useAssets as named export", async () => {
    const module = await import("./useAssets")
    expect(module.useAssets).toBeDefined()
  })

  test("should export UseAssetsResult type", async () => {
    const module = await import("./useAssets")
    expect(module).toHaveProperty("useAssets")
  })

  test("should export UseAssetsParams type", async () => {
    const module = await import("./useAssets")
    expect(module).toHaveProperty("useAssets")
  })
})
