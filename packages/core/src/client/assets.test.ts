import { describe, expect, test } from "bun:test"
import { NetworkError, ValidationError } from "@uranium/types"
import {
  createMockAxiosClient,
  createMockResponse,
  mockData,
} from "../test-utils/mocks"
import type {
  AssetEntity,
  CompleteUploadResponseDto,
  FindUserAssetsResponseDto,
  PrepareNewFileResponseDto,
  StartMintingResponseDto,
} from "../types/api-types"
import { assetsRouter } from "./assets"

describe("Assets Router", () => {
  describe("list", () => {
    test("should successfully list assets with default parameters", async () => {
      const mockAssets: AssetEntity[] = [mockData.asset()]

      const mockResponse: FindUserAssetsResponseDto = {
        status: "ok",
        ok: {
          data: mockAssets,
          meta: mockData.pagination(),
        },
      }

      const mockClient = createMockAxiosClient({
        get: () => Promise.resolve({ data: mockResponse }),
      })

      const router = assetsRouter(mockClient)
      const result = await router.list()

      // Verify default query params were used
      expect(mockClient.get).toHaveBeenCalledTimes(1)
      // biome-ignore lint/suspicious/noExplicitAny: Testing mock object
      const callArg = (mockClient.get as any).mock.calls[0][0]
      expect(callArg).toContain("sortBy=createdAt")
      expect(callArg).toContain("order=asc")
      expect(callArg).toContain("page=1")
      expect(callArg).toContain("pageSize=10")

      // Verify the result
      expect(result.data).toEqual(mockAssets)
      expect(result.meta?.total).toBe(1)
    })

    test("should handle custom filter parameters", async () => {
      const mockResponse: FindUserAssetsResponseDto = {
        status: "ok",
        ok: {
          data: [],
          meta: mockData.pagination({
            total: 0,
            page: 2,
            pageSize: 20,
            countPages: 0,
          }),
        },
      }

      const mockClient = createMockAxiosClient({
        get: () => Promise.resolve({ data: mockResponse }),
      })

      const router = assetsRouter(mockClient)
      await router.list({
        contractId: "contract123",
        quickFilter: "search",
        page: 2,
        pageSize: 20,
        sortBy: "title",
        order: "desc",
      })

      // Verify query params were built correctly
      // biome-ignore lint/suspicious/noExplicitAny: Testing mock object
      const callArg = (mockClient.get as any).mock.calls[0][0]
      expect(callArg).toContain("contractId=contract123")
      expect(callArg).toContain("quickFilter=search")
      expect(callArg).toContain("page=2")
      expect(callArg).toContain("pageSize=20")
      expect(callArg).toContain("sortBy=title")
      expect(callArg).toContain("order=desc")
    })

    test("should throw NetworkError when response has no data", async () => {
      const mockResponse: FindUserAssetsResponseDto = createMockResponse(
        "error",
        undefined,
        "INVALID_REQUEST",
      )

      const mockClient = createMockAxiosClient({
        get: () => Promise.resolve({ data: mockResponse, status: 400 }),
      })

      const router = assetsRouter(mockClient)

      await expect(router.list()).rejects.toThrow(NetworkError)
      await expect(router.list()).rejects.toThrow("Failed to retrieve assets")
    })
  })

  describe("prepareNewFile", () => {
    test("should successfully prepare file upload", async () => {
      const mockResponse: PrepareNewFileResponseDto = {
        status: "ok",
        fileId: "file123",
        fileUploadId: "upload123",
        chunkCount: 3,
        chunkSize: 5242880,
        uploadPartUrls: [
          { partNumber: 1, url: "https://s3.example.com/part1" },
          { partNumber: 2, url: "https://s3.example.com/part2" },
          { partNumber: 3, url: "https://s3.example.com/part3" },
        ],
      }

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse }),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "device123",
        metadata: JSON.stringify({ title: "My NFT" }),
        // biome-ignore lint/suspicious/noExplicitAny: Testing mock data
        type: "image" as any,
        // biome-ignore lint/suspicious/noExplicitAny: Testing mock data
        source: "upload" as any,
        fileSize: 15728640,
      }

      const result = await router.prepareNewFile(params)

      expect(mockClient.post).toHaveBeenCalledWith(
        "/assets/prepare-new-file",
        params,
      )
      expect(result.fileId).toBe("file123")
      expect(result.uploadPartUrls).toHaveLength(3)
    })

    test("should throw NetworkError when response has no fileId", async () => {
      const mockResponse: PrepareNewFileResponseDto = {
        status: "error",
        // biome-ignore lint/suspicious/noExplicitAny: Testing error response
        fileId: "" as any,
        fileUploadId: "",
        chunkCount: 0,
        chunkSize: 0,
        uploadPartUrls: [],
      }

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse, status: 400 }),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "device123",
        metadata: JSON.stringify({ title: "My NFT" }),
        // biome-ignore lint/suspicious/noExplicitAny: Testing mock data
        type: "image" as any,
        // biome-ignore lint/suspicious/noExplicitAny: Testing mock data
        source: "upload" as any,
        fileSize: 15728640,
      }

      await expect(router.prepareNewFile(params)).rejects.toThrow(NetworkError)
      await expect(router.prepareNewFile(params)).rejects.toThrow(
        "Failed to prepare file upload",
      )
    })

    // Validation tests
    test("should throw ValidationError when deviceId is empty", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "",
        metadata: JSON.stringify({ title: "My NFT" }),
        type: 0,
        source: 0,
        fileSize: 15728640,
      }

      await expect(router.prepareNewFile(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when metadata is empty", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "device123",
        metadata: "",
        type: 0,
        source: 0,
        fileSize: 15728640,
      }

      await expect(router.prepareNewFile(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when fileSize is zero", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "device123",
        metadata: JSON.stringify({ title: "My NFT" }),
        type: 0,
        source: 0,
        fileSize: 0,
      }

      await expect(router.prepareNewFile(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when fileSize is negative", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "device123",
        metadata: JSON.stringify({ title: "My NFT" }),
        type: 0,
        source: 0,
        fileSize: -1000,
      }

      await expect(router.prepareNewFile(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when fileSize exceeds 100MB", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "device123",
        metadata: JSON.stringify({ title: "My NFT" }),
        type: 0,
        source: 0,
        fileSize: 101 * 1024 * 1024, // 101 MB
      }

      await expect(router.prepareNewFile(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when type is invalid", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "device123",
        metadata: JSON.stringify({ title: "My NFT" }),
        type: 99, // Invalid type (valid: 0-2)
        source: 0,
        fileSize: 15728640,
      }

      await expect(router.prepareNewFile(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when source is invalid", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        deviceId: "device123",
        metadata: JSON.stringify({ title: "My NFT" }),
        type: 0,
        source: 99, // Invalid source (valid: 0-1)
        fileSize: 15728640,
      }

      await expect(router.prepareNewFile(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })
  })

  describe("completeUpload", () => {
    test("should successfully complete upload", async () => {
      const mockResponse: CompleteUploadResponseDto = {
        status: "ok",
      }

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse }),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [
          { partNumber: 1, eTag: "etag1" },
          { partNumber: 2, eTag: "etag2" },
        ],
      }

      const result = await router.completeUpload(params)

      expect(mockClient.post).toHaveBeenCalledWith(
        "/assets/complete-upload",
        params,
      )
      expect(result.status).toBe("ok")
    })

    test("should throw NetworkError when status is not ok", async () => {
      const mockResponse = {
        status: "error",
      }

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse, status: 400 }),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [{ partNumber: 1, eTag: "abc123" }],
      }

      await expect(router.completeUpload(params)).rejects.toThrow(NetworkError)
      await expect(router.completeUpload(params)).rejects.toThrow(
        "Failed to complete upload",
      )
    })

    // Validation tests
    test("should throw ValidationError when fileId is empty", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "",
        mimeType: "image/png",
        chunks: [{ partNumber: 1, eTag: "etag1" }],
      }

      await expect(router.completeUpload(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when mimeType is empty", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        mimeType: "",
        chunks: [{ partNumber: 1, eTag: "etag1" }],
      }

      await expect(router.completeUpload(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when mimeType has invalid format", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        mimeType: "invalid-mime-type",
        chunks: [{ partNumber: 1, eTag: "etag1" }],
      }

      await expect(router.completeUpload(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when chunks array is empty", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [],
      }

      await expect(router.completeUpload(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when chunk has empty eTag", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [{ partNumber: 1, eTag: "" }],
      }

      await expect(router.completeUpload(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when chunk has invalid partNumber", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [{ partNumber: 0, eTag: "etag1" }],
      }

      await expect(router.completeUpload(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when chunk has negative partNumber", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [{ partNumber: -1, eTag: "etag1" }],
      }

      await expect(router.completeUpload(params)).rejects.toThrow(
        ValidationError,
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })
  })

  describe("startMinting", () => {
    test("should successfully start minting", async () => {
      const mockMintingData = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing mock status
        status: "MEDIA_UPLOADING" as any,
        mintProgressInfo: {
          totalChunks: 3,
          completedChunks: 0,
        },
      }

      const mockResponse: StartMintingResponseDto = {
        status: "ok",
        data: mockMintingData,
      }

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse }),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        contractId: "contract123",
        editions: 10,
        shareWithCommunity: true,
        metadata: {
          attributes: [
            {
              key: "color",
              value: "blue",
              type: 0,
            },
          ],
        },
      }

      const result = await router.startMinting(params)

      expect(mockClient.post).toHaveBeenCalledWith(
        "/assets/start-minting",
        params,
      )
      expect(result.status).toBe("MEDIA_UPLOADING")
      expect(result.mintProgressInfo.totalChunks).toBe(3)
    })

    test("should throw NetworkError when minting data is missing", async () => {
      const mockResponse: StartMintingResponseDto = {
        status: "error",
        errorCode: "INVALID_FILE",
      }

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse, status: 400 }),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        metadata: {
          attributes: [],
        },
      }

      await expect(router.startMinting(params)).rejects.toThrow(NetworkError)
      await expect(router.startMinting(params)).rejects.toThrow(
        "Failed to start minting process",
      )
    })

    // Validation tests
    test("should throw ValidationError when fileId is empty", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "",
        metadata: {
          attributes: [],
        },
      }

      await expect(router.startMinting(params)).rejects.toThrow(ValidationError)
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when editions is zero", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        editions: 0,
        metadata: {
          attributes: [],
        },
      }

      await expect(router.startMinting(params)).rejects.toThrow(ValidationError)
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when editions is negative", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        editions: -5,
        metadata: {
          attributes: [],
        },
      }

      await expect(router.startMinting(params)).rejects.toThrow(ValidationError)
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when editions exceeds 1000", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        editions: 1001,
        metadata: {
          attributes: [],
        },
      }

      await expect(router.startMinting(params)).rejects.toThrow(ValidationError)
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should throw ValidationError when metadata attribute has empty key", async () => {
      const mockClient = createMockAxiosClient({
        post: () => Promise.reject(new Error("Should not be called")),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        metadata: {
          attributes: [
            {
              key: "",
              value: "blue",
              type: 0,
            },
          ],
        },
      }

      await expect(router.startMinting(params)).rejects.toThrow(ValidationError)
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    test("should accept valid editions within range (1-1000)", async () => {
      const mockMintingData = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing mock status
        status: "MEDIA_UPLOADING" as any,
        mintProgressInfo: {
          totalChunks: 3,
          completedChunks: 0,
        },
      }

      const mockResponse: StartMintingResponseDto = {
        status: "ok",
        data: mockMintingData,
      }

      const mockClient = createMockAxiosClient({
        post: () => Promise.resolve({ data: mockResponse }),
      })

      const router = assetsRouter(mockClient)

      const params = {
        fileId: "file123",
        editions: 500, // Valid: within 1-1000
        metadata: {
          attributes: [],
        },
      }

      const result = await router.startMinting(params)

      expect(mockClient.post).toHaveBeenCalled()
      expect(result.status).toBe("MEDIA_UPLOADING")
    })
  })
})
