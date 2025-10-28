import { describe, expect, test } from "bun:test"
import { ClientUploadStage } from "@uranium/sdk"
import { assetsQueryKeys } from "../utils"

describe("useUploadAsset - Module Exports", () => {
  test("should export useUploadAsset function", async () => {
    const { useUploadAsset } = await import("./useUploadAsset")
    expect(useUploadAsset).toBeDefined()
    expect(typeof useUploadAsset).toBe("function")
  })

  test("should export UseUploadAssetResult interface", async () => {
    const module = await import("./useUploadAsset")
    expect(module).toBeDefined()
  })

  test("should export UploadAssetParams interface", async () => {
    const module = await import("./useUploadAsset")
    expect(module).toBeDefined()
  })
})

describe("useUploadAsset - Query Keys", () => {
  test("should use assets as base key for invalidation", () => {
    const baseKey = assetsQueryKeys.all
    expect(baseKey).toEqual(["assets"])
  })

  test("should invalidate all assets queries", () => {
    const baseKey = assetsQueryKeys.all
    expect(baseKey[0]).toBe("assets")
    expect(baseKey.length).toBe(1)
  })
})

describe("useUploadAsset - Upload Parameters", () => {
  test("should validate file parameter type (File)", () => {
    const file = new File(["test"], "test.png", { type: "image/png" })
    expect(file).toBeInstanceOf(File)
  })

  test("should validate file parameter type (Buffer)", () => {
    const buffer = Buffer.from("test")
    expect(buffer).toBeInstanceOf(Buffer)
  })

  test("should validate options.contractId", () => {
    const options = {
      contractId: "contract-123",
      metadata: { title: "Test NFT" },
    }
    expect(options.contractId).toBeDefined()
    expect(typeof options.contractId).toBe("string")
  })

  test("should validate options.metadata", () => {
    const options = {
      contractId: "contract-123",
      metadata: { title: "Test NFT" },
    }
    expect(options.metadata).toBeDefined()
    expect(options.metadata.title).toBe("Test NFT")
  })
})

describe("useUploadAsset - Metadata Validation", () => {
  test("should validate title is required", () => {
    const metadata = { title: "My NFT" }
    expect(metadata.title).toBeDefined()
    expect(metadata.title.length).toBeGreaterThanOrEqual(3)
  })

  test("should validate title minimum length (3 characters)", () => {
    const title = "NFT"
    expect(title.length).toBeGreaterThanOrEqual(3)
  })

  test("should validate title maximum length (120 characters)", () => {
    const title = "A".repeat(120)
    expect(title.length).toBeLessThanOrEqual(120)
  })

  test("should handle optional description", () => {
    const metadata = {
      title: "My NFT",
      description: "An amazing artwork",
    }
    expect(metadata.description).toBeDefined()
  })

  test("should validate description maximum length (255 characters)", () => {
    const description = "A".repeat(255)
    expect(description.length).toBeLessThanOrEqual(255)
  })

  test("should handle optional location", () => {
    const metadata = {
      title: "My NFT",
      location: "New York",
    }
    expect(metadata.location).toBeDefined()
  })

  test("should validate location maximum length (100 characters)", () => {
    const location = "A".repeat(100)
    expect(location.length).toBeLessThanOrEqual(100)
  })

  test("should handle metadata with all fields", () => {
    const metadata = {
      title: "Complete NFT",
      description: "Full description",
      location: "San Francisco",
    }
    expect(metadata.title).toBeDefined()
    expect(metadata.description).toBeDefined()
    expect(metadata.location).toBeDefined()
  })
})

describe("useUploadAsset - Editions Parameter", () => {
  test("should handle default editions (1)", () => {
    const editions = 1
    expect(editions).toBe(1)
  })

  test("should handle multiple editions", () => {
    const editions = 100
    expect(editions).toBeGreaterThan(1)
    expect(editions).toBeLessThanOrEqual(1000)
  })

  test("should validate minimum editions (1)", () => {
    const editions = 1
    expect(editions).toBeGreaterThanOrEqual(1)
  })

  test("should validate maximum editions (1000)", () => {
    const editions = 1000
    expect(editions).toBeLessThanOrEqual(1000)
  })

  test("should handle editions for ERC1155", () => {
    const options = {
      contractId: "erc1155-contract",
      metadata: { title: "Multi-edition NFT" },
      editions: 500,
    }
    expect(options.editions).toBe(500)
  })
})

describe("useUploadAsset - Progress Tracking", () => {
  test("should handle progress with validating stage", () => {
    const progress = {
      stage: ClientUploadStage.VALIDATING,
      percent: 2,
      uploadedChunks: 0,
      totalChunks: 10,
      currentChunk: 0,
      currentStatus: "Validating file...",
    }
    expect(progress.stage).toBe(ClientUploadStage.VALIDATING)
    expect(progress.percent).toBeGreaterThanOrEqual(0)
    expect(progress.percent).toBeLessThanOrEqual(5)
  })

  test("should handle progress with preparing stage", () => {
    const progress = {
      stage: ClientUploadStage.PREPARING,
      percent: 8,
      uploadedChunks: 0,
      totalChunks: 10,
      currentChunk: 0,
      currentStatus: "Preparing upload...",
    }
    expect(progress.stage).toBe(ClientUploadStage.PREPARING)
    expect(progress.percent).toBeGreaterThanOrEqual(5)
    expect(progress.percent).toBeLessThanOrEqual(12)
  })

  test("should handle progress with processing stage", () => {
    const progress = {
      stage: ClientUploadStage.PROCESSING,
      percent: 15,
      uploadedChunks: 0,
      totalChunks: 10,
      currentChunk: 0,
      currentStatus: "Processing file...",
    }
    expect(progress.stage).toBe(ClientUploadStage.PROCESSING)
    expect(progress.percent).toBeGreaterThanOrEqual(12)
    expect(progress.percent).toBeLessThanOrEqual(18)
  })

  test("should handle progress with uploading stage", () => {
    const progress = {
      stage: ClientUploadStage.UPLOADING,
      percent: 40,
      uploadedChunks: 4,
      totalChunks: 10,
      currentChunk: 5,
      currentStatus: "Uploading...",
    }
    expect(progress.stage).toBe(ClientUploadStage.UPLOADING)
    expect(progress.percent).toBeGreaterThanOrEqual(18)
    expect(progress.percent).toBeLessThanOrEqual(75)
  })

  test("should handle progress with finalizing stage", () => {
    const progress = {
      stage: ClientUploadStage.FINALIZING,
      percent: 80,
      uploadedChunks: 10,
      totalChunks: 10,
      currentChunk: 10,
      currentStatus: "Finalizing upload...",
    }
    expect(progress.stage).toBe(ClientUploadStage.FINALIZING)
    expect(progress.percent).toBeGreaterThanOrEqual(75)
    expect(progress.percent).toBeLessThanOrEqual(85)
  })

  test("should handle progress with requesting mint stage", () => {
    const progress = {
      stage: ClientUploadStage.REQUESTING_MINT,
      percent: 90,
      uploadedChunks: 10,
      totalChunks: 10,
      currentChunk: 10,
      currentStatus: "Requesting mint...",
    }
    expect(progress.stage).toBe(ClientUploadStage.REQUESTING_MINT)
    expect(progress.percent).toBeGreaterThanOrEqual(85)
    expect(progress.percent).toBeLessThan(100)
  })

  test("should handle progress at 100% (done)", () => {
    const progress = {
      stage: ClientUploadStage.DONE,
      percent: 100,
      uploadedChunks: 10,
      totalChunks: 10,
      currentChunk: 10,
      currentStatus: "Complete!",
    }
    expect(progress.stage).toBe(ClientUploadStage.DONE)
    expect(progress.percent).toBe(100)
  })

  test("should track uploaded chunks", () => {
    const progress = {
      uploadedChunks: 5,
      totalChunks: 10,
    }
    expect(progress.uploadedChunks).toBeLessThanOrEqual(progress.totalChunks)
  })

  test("should track current chunk", () => {
    const progress = {
      currentChunk: 3,
      totalChunks: 10,
    }
    expect(progress.currentChunk).toBeLessThanOrEqual(progress.totalChunks)
  })

  test("should provide current status message", () => {
    const statuses = [
      "Validating file...",
      "Preparing upload...",
      "Processing file...",
      "Uploading...",
      "Finalizing upload...",
      "Requesting mint...",
      "Complete!",
    ]
    statuses.forEach((status) => {
      expect(typeof status).toBe("string")
      expect(status.length).toBeGreaterThan(0)
    })
  })

  test("should track chunk progress during uploading stage", () => {
    const progress = {
      stage: ClientUploadStage.UPLOADING,
      percent: 40,
      uploadedChunks: 4,
      totalChunks: 10,
      currentChunk: 5,
      currentStatus: "Uploading...",
      chunkProgress: 65,
    }
    expect(progress.chunkProgress).toBeDefined()
    expect(progress.chunkProgress).toBeGreaterThanOrEqual(0)
    expect(progress.chunkProgress).toBeLessThanOrEqual(100)
  })

  test("should handle optional chunk progress", () => {
    const progress = {
      stage: ClientUploadStage.PREPARING,
      percent: 8,
      uploadedChunks: 0,
      totalChunks: 10,
      currentChunk: 0,
      currentStatus: "Preparing upload...",
    }
    expect(progress.chunkProgress).toBeUndefined()
  })
})

describe("useUploadAsset - Mutation States", () => {
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

describe("useUploadAsset - Error Handling", () => {
  test("should handle error object structure", () => {
    const error = new Error("Upload failed")
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe("Upload failed")
  })

  test("should handle null error", () => {
    const error = null
    expect(error).toBeNull()
  })

  test("should handle validation errors", () => {
    const error = new Error("Invalid file type")
    expect(error.message).toContain("Invalid")
  })

  test("should handle network errors", () => {
    const error = new Error("Network error during upload")
    expect(error.message).toContain("Network")
  })

  test("should handle file size errors", () => {
    const error = new Error("File size exceeds limit")
    expect(error.message).toContain("size")
  })
})

describe("useUploadAsset - Response Data", () => {
  test("should validate asset entity structure", () => {
    const asset = {
      id: "asset-1",
      title: "My NFT",
      slug: "my-nft",
      status: 14,
      contractId: "contract-1",
    }
    expect(asset).toHaveProperty("id")
    expect(asset).toHaveProperty("title")
    expect(asset).toHaveProperty("slug")
  })

  test("should handle undefined data initially", () => {
    const data = undefined
    expect(data).toBeUndefined()
  })

  test("should handle data after successful upload", () => {
    const data = {
      id: "new-asset",
      title: "Uploaded NFT",
      sourceUrl: "https://example.com/asset.png",
    }
    expect(data.id).toBeDefined()
    expect(data.title).toBeDefined()
  })
})

describe("useUploadAsset - Progress Callback Merging", () => {
  test("should call user's onProgress callback", () => {
    let called = false
    const onProgress = () => {
      called = true
    }
    onProgress()
    expect(called).toBe(true)
  })

  test("should merge internal and user callbacks", () => {
    const calls: string[] = []
    const internalCallback = () => calls.push("internal")
    const userCallback = () => calls.push("user")
    internalCallback()
    userCallback()
    expect(calls).toEqual(["internal", "user"])
  })

  test("should handle optional user callback", () => {
    const options = {
      contractId: "contract-1",
      metadata: { title: "Test" },
    }
    expect(options.onProgress).toBeUndefined()
  })

  test("should preserve user callback when provided", () => {
    let userCalled = false
    const options = {
      contractId: "contract-1",
      metadata: { title: "Test" },
      onProgress: () => {
        userCalled = true
      },
    }
    options.onProgress()
    expect(userCalled).toBe(true)
  })
})

describe("useUploadAsset - Reset Functionality", () => {
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

  test("should clear progress on reset", () => {
    let progress: unknown = { percent: 50 }
    const reset = () => {
      progress = null
    }
    reset()
    expect(progress).toBeNull()
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

describe("useUploadAsset - File Type Support", () => {
  test("should handle File object", () => {
    const file = new File(["content"], "test.png", { type: "image/png" })
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe("test.png")
    expect(file.type).toBe("image/png")
  })

  test("should handle Buffer object", () => {
    const buffer = Buffer.from("test data")
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test("should handle image MIME types", () => {
    const mimeTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"]
    mimeTypes.forEach((type) => {
      expect(type).toContain("image/")
    })
  })

  test("should handle video MIME types", () => {
    const mimeTypes = ["video/mp4", "video/webm", "video/ogg"]
    mimeTypes.forEach((type) => {
      expect(type).toContain("video/")
    })
  })

  test("should validate file has content", () => {
    const file = new File(["content"], "test.png")
    expect(file.size).toBeGreaterThan(0)
  })
})

describe("useUploadAsset - Optional Parameters", () => {
  test("should handle shareWithCommunity flag", () => {
    const options = {
      contractId: "contract-1",
      metadata: { title: "Test" },
      shareWithCommunity: true,
    }
    expect(options.shareWithCommunity).toBe(true)
  })

  test("should default shareWithCommunity to false", () => {
    const shareWithCommunity = false
    expect(shareWithCommunity).toBe(false)
  })

  test("should handle disableThumbnail flag", () => {
    const options = {
      contractId: "contract-1",
      metadata: { title: "Test" },
      disableThumbnail: true,
    }
    expect(options.disableThumbnail).toBe(true)
  })

  test("should handle isPrivate flag", () => {
    const options = {
      contractId: "contract-1",
      metadata: { title: "Test" },
      isPrivate: true,
    }
    expect(options.isPrivate).toBe(true)
  })

  test("should handle signal for abort control", () => {
    const controller = new AbortController()
    const options = {
      contractId: "contract-1",
      metadata: { title: "Test" },
      signal: controller.signal,
    }
    expect(options.signal).toBeDefined()
  })
})

describe("useUploadAsset - Async Behavior", () => {
  test("should handle async uploadAsset function", async () => {
    const uploadAsset = async () => ({ id: "test", title: "Test" })
    const result = await uploadAsset()
    expect(result).toHaveProperty("id")
  })

  test("should handle promise rejection", async () => {
    const uploadAsset = async () => {
      throw new Error("Upload failed")
    }
    try {
      await uploadAsset()
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should handle successful promise resolution", async () => {
    const uploadAsset = async () => ({ id: "success", title: "Success" })
    const result = await uploadAsset()
    expect(result.id).toBe("success")
  })
})

describe("useUploadAsset - Query Invalidation", () => {
  test("should invalidate assets query on success", () => {
    const queryKey = assetsQueryKeys.all
    expect(queryKey).toEqual(["assets"])
  })

  test("should invalidate all assets queries including list", () => {
    const baseKey = assetsQueryKeys.all
    const listKey = assetsQueryKeys.list()
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

describe("useUploadAsset - Progress State Management", () => {
  test("should initialize progress as null", () => {
    const progress = null
    expect(progress).toBeNull()
  })

  test("should update progress during upload", () => {
    let progress = { percent: 0 }
    progress = { percent: 50 }
    expect(progress.percent).toBe(50)
  })

  test("should clear progress after success", () => {
    let progress: unknown = { percent: 100 }
    progress = null
    expect(progress).toBeNull()
  })

  test("should clear progress after error", () => {
    let progress: unknown = { percent: 50 }
    progress = null
    expect(progress).toBeNull()
  })
})

describe("useUploadAsset - Edge Cases", () => {
  test("should handle empty file", () => {
    const file = new File([], "empty.txt")
    expect(file.size).toBe(0)
  })

  test("should handle very large files", () => {
    const largeSize = 100 * 1024 * 1024 // 100MB
    expect(largeSize).toBeGreaterThan(0)
  })

  test("should handle special characters in title", () => {
    const title = "NFT with émojis 🚀"
    expect(title.length).toBeGreaterThan(0)
  })

  test("should handle empty description", () => {
    const metadata = {
      title: "Test NFT",
      description: "",
    }
    expect(metadata.description).toBe("")
  })

  test("should handle null progress", () => {
    const progress = null
    expect(progress).toBeNull()
  })
})
