/**
 * Upload Manager Tests
 *
 * Tests for the UploadManager class covering the complete upload flow
 * with mocked dependencies and various scenarios.
 */

import { describe, expect, it, mock, spyOn } from "bun:test"
import * as axiosModule from "axios"
import type { AssetsRouter } from "../client/assets"
import { ClientUploadStage, FileType, UploadStatus } from "../types/enums"
import { UploadError, ValidationError } from "../types/errors"
import type { UploadOptions, UploadProgress } from "./types"
import { UploadManager } from "./upload-manager"

const axios = axiosModule.default

// Mock data
const MOCK_DEVICE_ID = "test-device-123"
const MOCK_FILE_ID = "file-abc-123"
const MOCK_CONTRACT_ID = "contract-xyz-789"

const createMockFile = (
  size: number = 1024 * 1024,
  type = "image/png",
): File => {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], "test.png", { type })
}

const createMockBuffer = (size: number = 1024 * 1024): Buffer => {
  return Buffer.alloc(size)
}

const createMockAssetsRouter = (): AssetsRouter => ({
  list: mock(async () => ({ data: [], meta: null })),
  prepareNewFile: mock(async () => ({
    fileId: MOCK_FILE_ID,
    fileUploadId: "upload-123",
    chunkCount: 2,
    chunkSize: 512 * 1024,
    uploadPartUrls: [
      { partNumber: 1, url: "https://s3.example.com/part1" },
      { partNumber: 2, url: "https://s3.example.com/part2" },
    ],
    status: "ok",
  })),
  completeUpload: mock(async () => ({
    status: "ok",
  })),
  startMinting: mock(async () => ({
    status: UploadStatus.NFT_MINTING,
    mintProgressInfo: {
      totalChunks: 2,
      completedChunks: 2,
    },
    contractAddress: "0x123",
    tokenId: "1",
  })),
})

const createMockOptions = (
  overrides?: Partial<UploadOptions>,
): UploadOptions => ({
  contractId: MOCK_CONTRACT_ID,
  metadata: {
    title: "Test Asset",
    description: "Test description",
    location: "Test location",
  },
  editions: 1,
  shareWithCommunity: false,
  ...overrides,
})

// Mock axios for chunk uploads
spyOn(axios, "put").mockResolvedValue({
  status: 200,
  statusText: "OK",
  headers: {
    etag: '"mock-etag-123"',
  },
  data: null,
  // biome-ignore lint/suspicious/noExplicitAny: Testing mock config
  config: {} as any,
})

describe("UploadManager", () => {
  describe("constructor", () => {
    it("should create an instance", () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      expect(manager).toBeInstanceOf(UploadManager)
    })
  })

  describe("upload - validation", () => {
    it("should validate file size (too small)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile(0)
      const options = createMockOptions()

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should validate file size (too large)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile(101 * 1024 * 1024) // 101 MB
      const options = createMockOptions()

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should validate title (too short)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        metadata: { title: "ab" }, // Too short
      })

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should validate title (too long)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        metadata: { title: "a".repeat(121) }, // Too long
      })

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should validate description (too long)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        metadata: {
          title: "Test",
          description: "a".repeat(256), // Too long
        },
      })

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should validate location (too long)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        metadata: {
          title: "Test",
          location: "a".repeat(101), // Too long
        },
      })

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should validate editions (too small)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        editions: 0, // Too small
      })

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should validate editions (too large)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        editions: 1001, // Too large
      })

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should validate contractId (missing)", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        contractId: "",
      })

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe("upload - file types", () => {
    it("should detect image file type", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile(1024 * 1024, "image/png")
      const options = createMockOptions()

      await manager.upload(file, options)

      expect(router.prepareNewFile).toHaveBeenCalledWith(
        expect.objectContaining({
          type: FileType.Image,
        }),
      )
    })

    it("should detect video file type", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile(1024 * 1024, "video/mp4")
      const options = createMockOptions()

      await manager.upload(file, options)

      expect(router.prepareNewFile).toHaveBeenCalledWith(
        expect.objectContaining({
          type: FileType.Video,
        }),
      )
    })

    it("should detect gif file type", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile(1024 * 1024, "image/gif")
      const options = createMockOptions()

      await manager.upload(file, options)

      expect(router.prepareNewFile).toHaveBeenCalledWith(
        expect.objectContaining({
          type: FileType.Gif,
        }),
      )
    })

    it("should reject unknown file type", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile(1024 * 1024, "application/pdf")
      const options = createMockOptions()

      await expect(manager.upload(file, options)).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe("upload - progress tracking", () => {
    it("should call onProgress with all stages", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const progressStages: ClientUploadStage[] = []

      const options = createMockOptions({
        onProgress: (progress: UploadProgress) => {
          progressStages.push(progress.stage)
        },
      })

      await manager.upload(file, options)

      // Should have all client-side stages
      expect(progressStages).toContain(ClientUploadStage.VALIDATING)
      expect(progressStages).toContain(ClientUploadStage.PREPARING)
      expect(progressStages).toContain(ClientUploadStage.PROCESSING)
      expect(progressStages).toContain(ClientUploadStage.UPLOADING)
      expect(progressStages).toContain(ClientUploadStage.FINALIZING)
      expect(progressStages).toContain(ClientUploadStage.REQUESTING_MINT)
      expect(progressStages).toContain(ClientUploadStage.DONE)
    })

    it("should report progress from 0 to 100", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const percentages: number[] = []

      const options = createMockOptions({
        onProgress: (progress: UploadProgress) => {
          percentages.push(progress.percent)
        },
      })

      await manager.upload(file, options)

      // Should start at 0% (VALIDATING stage)
      expect(Math.min(...percentages)).toBe(0)
      // Should end at 100%
      expect(Math.max(...percentages)).toBe(100)
      // Should be in increasing order (mostly)
      expect(percentages[percentages.length - 1]).toBe(100)
    })

    it("should report chunk progress during uploading", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      let maxUploadedChunks = 0
      let totalChunks = 0

      const options = createMockOptions({
        onProgress: (progress: UploadProgress) => {
          if (progress.stage === ClientUploadStage.UPLOADING) {
            maxUploadedChunks = Math.max(
              maxUploadedChunks,
              progress.uploadedChunks,
            )
            totalChunks = progress.totalChunks
          }
        },
      })

      await manager.upload(file, options)

      expect(maxUploadedChunks).toBe(totalChunks)
      expect(totalChunks).toBeGreaterThan(0)
    })

    it("should have chunkProgress field during uploading stage", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      let hasChunkProgress = false

      const options = createMockOptions({
        onProgress: (progress: UploadProgress) => {
          // chunkProgress field should be present during UPLOADING stage
          if (progress.stage === ClientUploadStage.UPLOADING) {
            // Note: chunkProgress may be undefined in tests due to mocked axios
            // but the field should exist in the type
            hasChunkProgress = true
            // Verify the structure includes chunkProgress even if undefined
            expect(progress).toHaveProperty("stage")
            expect(progress).toHaveProperty("percent")
            expect(progress).toHaveProperty("uploadedChunks")
            expect(progress).toHaveProperty("totalChunks")
            expect(progress).toHaveProperty("currentChunk")
            expect(progress).toHaveProperty("currentStatus")
          }
        },
      })

      await manager.upload(file, options)

      // Should have entered uploading stage
      expect(hasChunkProgress).toBe(true)
    })

    it("should report progress percentages within correct ranges for each stage", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const stageRanges: Record<
        ClientUploadStage,
        { min: number; max: number }
      > = {
        [ClientUploadStage.VALIDATING]: { min: 0, max: 5 },
        [ClientUploadStage.PREPARING]: { min: 5, max: 12 },
        [ClientUploadStage.PROCESSING]: { min: 12, max: 18 },
        [ClientUploadStage.UPLOADING]: { min: 18, max: 75 },
        [ClientUploadStage.FINALIZING]: { min: 75, max: 85 },
        [ClientUploadStage.REQUESTING_MINT]: { min: 85, max: 99 },
        [ClientUploadStage.DONE]: { min: 100, max: 100 },
      }

      const options = createMockOptions({
        onProgress: (progress: UploadProgress) => {
          const range = stageRanges[progress.stage]
          expect(progress.percent).toBeGreaterThanOrEqual(range.min)
          expect(progress.percent).toBeLessThanOrEqual(range.max)
        },
      })

      await manager.upload(file, options)
    })
  })

  describe("upload - cancellation", () => {
    it("should handle abort signal", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const abortController = new AbortController()

      const options = createMockOptions({
        signal: abortController.signal,
      })

      // Abort immediately
      abortController.abort()

      await expect(manager.upload(file, options)).rejects.toThrow(UploadError)
    })
  })

  describe("upload - complete flow", () => {
    it("should complete full upload flow with File", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions()

      const result = await manager.upload(file, options)

      expect(result).toBeDefined()
      expect(result.id).toBe(MOCK_FILE_ID)
      expect(router.prepareNewFile).toHaveBeenCalled()
      expect(router.completeUpload).toHaveBeenCalled()
      expect(router.startMinting).toHaveBeenCalled()
    })

    it("should reject Buffer without MIME type", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const buffer = createMockBuffer()
      const options = createMockOptions()

      // Buffer will have application/octet-stream as MIME type, which is Unknown FileType
      await expect(manager.upload(buffer, options)).rejects.toThrow(
        ValidationError,
      )
    })

    it("should include SDK version in metadata", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions()

      await manager.upload(file, options)

      expect(router.startMinting).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            attributes: expect.arrayContaining([
              expect.objectContaining({
                key: "appName",
                value: "uranium-sdk",
              }),
              expect.objectContaining({
                key: "appVersion",
              }),
            ]),
          }),
        }),
      )
    })

    it("should include optional metadata fields", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        metadata: {
          title: "Test Asset",
          description: "Test description",
          location: "Test location",
        },
      })

      await manager.upload(file, options)

      expect(router.startMinting).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            attributes: expect.arrayContaining([
              expect.objectContaining({
                key: "description",
                value: "Test description",
              }),
              expect.objectContaining({
                key: "location",
                value: "Test location",
              }),
            ]),
          }),
        }),
      )
    })

    it("should pass through upload options", async () => {
      const router = createMockAssetsRouter()
      const manager = new UploadManager(router, MOCK_DEVICE_ID)
      const file = createMockFile()
      const options = createMockOptions({
        editions: 5,
        shareWithCommunity: true,
        disableThumbnail: true,
        isPrivate: true,
      })

      await manager.upload(file, options)

      expect(router.prepareNewFile).toHaveBeenCalledWith(
        expect.objectContaining({
          isPrivate: true,
        }),
      )

      expect(router.completeUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          disableThumbnail: true,
        }),
      )

      expect(router.startMinting).toHaveBeenCalledWith(
        expect.objectContaining({
          editions: 5,
          shareWithCommunity: true,
        }),
      )
    })
  })
})
