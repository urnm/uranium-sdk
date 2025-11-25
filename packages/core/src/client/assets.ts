import { NetworkError } from "@uranium/types"
import type { AxiosInstance } from "axios"
import type {
  AssetEntity,
  CompleteUploadRequestDto,
  CompleteUploadResponseDto,
  ExtractFrameSyncRequestDto,
  ExtractFrameSyncResponseDto,
  FindUserAssetsRequestDto,
  FindUserAssetsResponseDto,
  PrepareNewFileRequestDto,
  PrepareNewFileResponseDto,
  StartMintingRequestDto,
  StartMintingResponseDataDto,
  StartMintingResponseDto,
} from "../types/api-types"
import {
  completeUploadSchema,
  extractFrameSyncSchema,
  prepareNewFileSchema,
  startMintingSchema,
} from "../validation/schemas"
import { validateSchema } from "../validation/utils"
import type { RequestOptions } from "./types"

/**
 * Paginated response structure for asset listings
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    countPages: number
  } | null
}

/**
 * Assets API router
 * Handles NFT asset operations including listing, uploading, and minting
 */
export const assetsRouter = (client: AxiosInstance) => ({
  /**
   * List assets with optional filtering and pagination
   * @param params - Filter parameters (contractId, pagination, sorting, search)
   * @param options - Optional request options (retry config override)
   * @returns Paginated list of assets with metadata
   * @throws {NetworkError} If network request fails
   */
  list: async (
    params: FindUserAssetsRequestDto = {},
    _options?: RequestOptions,
  ): Promise<PaginatedResponse<AssetEntity>> => {
    // Build query parameters
    const searchParams = new URLSearchParams()

    // Add optional filters
    if (params.contractId) searchParams.append("contractId", params.contractId)
    if (params.quickFilter)
      searchParams.append("quickFilter", params.quickFilter)

    // Add pagination with defaults
    searchParams.append("sortBy", params.sortBy ?? "createdAt")
    searchParams.append("order", params.order ?? "asc")
    searchParams.append("page", String(params.page ?? 1))
    searchParams.append("pageSize", String(params.pageSize ?? 10))

    const response = await client.get<FindUserAssetsResponseDto>(
      `/assets/?${searchParams.toString()}`,
    )

    if (!response.data.ok) {
      throw new NetworkError(
        "Failed to retrieve assets",
        "API_ERROR",
        false,
        undefined,
        { status: response.status, data: response.data },
      )
    }

    return {
      data: response.data.ok.data,
      meta: response.data.ok.meta,
    }
  },

  /**
   * Prepare a new file upload and get presigned URLs
   * @param params - File preparation parameters (deviceId, metadata, type, size)
   * @returns Upload URLs and file identifiers
   * @throws {ValidationError} If file parameters are invalid
   * @throws {NetworkError} If network request fails
   */
  prepareNewFile: async (
    params: PrepareNewFileRequestDto,
  ): Promise<PrepareNewFileResponseDto> => {
    // Validate input before sending request
    const validated = validateSchema(
      prepareNewFileSchema,
      params,
      "Invalid file preparation parameters",
    )

    const response = await client.post<PrepareNewFileResponseDto>(
      "/assets/prepare-new-file",
      validated,
    )

    if (!response.data.fileId) {
      throw new NetworkError(
        "Failed to prepare file upload",
        "API_ERROR",
        false,
        undefined,
        { status: response.status, data: response.data },
      )
    }

    return response.data
  },

  /**
   * Complete a multipart file upload
   * @param params - Completion parameters (fileId, mimeType, chunks with ETags)
   * @returns Upload completion confirmation
   * @throws {ValidationError} If completion parameters are invalid
   * @throws {NetworkError} If network request fails
   */
  completeUpload: async (
    params: CompleteUploadRequestDto,
  ): Promise<CompleteUploadResponseDto> => {
    // Validate input before sending request
    const validated = validateSchema(
      completeUploadSchema,
      params,
      "Invalid upload completion parameters",
    )

    const response = await client.post<CompleteUploadResponseDto>(
      "/assets/complete-upload",
      validated,
    )

    if (!response.data || response.data.status !== "ok") {
      throw new NetworkError(
        "Failed to complete upload",
        "API_ERROR",
        false,
        undefined,
        { status: response.status, data: response.data },
      )
    }

    return response.data
  },

  /**
   * Start the NFT minting process for an uploaded file
   * @param params - Minting parameters (fileId, editions, contractId, metadata)
   * @returns Minting status and progress information
   * @throws {ValidationError} If minting parameters are invalid
   * @throws {NetworkError} If network request fails
   */
  startMinting: async (
    params: StartMintingRequestDto,
  ): Promise<StartMintingResponseDataDto> => {
    // Validate input before sending request
    const validated = validateSchema(
      startMintingSchema,
      params,
      "Invalid minting parameters",
    )

    const response = await client.post<StartMintingResponseDto>(
      "/assets/start-minting",
      validated,
    )

    if (!response.data.data) {
      throw new NetworkError(
        "Failed to start minting process",
        "API_ERROR",
        false,
        undefined,
        { status: response.status, data: response.data },
      )
    }

    return response.data.data
  },

  /**
   * Extract a frame from a video at a specific time position (synchronous)
   * @param params - Extraction parameters (fileId, timeInSeconds)
   * @returns Extracted frame as base64 data with dimensions
   * @throws {ValidationError} If extraction parameters are invalid
   * @throws {NetworkError} If network request fails or extraction fails
   *
   * @example
   * ```typescript
   * const frame = await sdk.assets.extractFrameSync({
   *   fileId: "video-file-id",
   *   timeInSeconds: 1.5,
   * });
   *
   * // Use the base64 data directly
   * const imageDataUrl = `data:${frame.mimeType};base64,${frame.base64Data}`;
   * ```
   */
  extractFrameSync: async (
    params: ExtractFrameSyncRequestDto,
  ): Promise<ExtractFrameSyncResponseDto> => {
    // Validate input before sending request
    const validated = validateSchema(
      extractFrameSyncSchema,
      params,
      "Invalid frame extraction parameters",
    )

    const response = await client.post<ExtractFrameSyncResponseDto>(
      "/assets/extract-frame-sync",
      validated,
    )

    if (response.data.status === "error" || !response.data.base64Data) {
      throw new NetworkError(
        response.data.errorCode ?? "Failed to extract frame",
        response.data.errorCode ?? "EXTRACTION_FAILED",
        false,
        undefined,
        { status: response.status, data: response.data },
      )
    }

    return response.data
  },
})

/**
 * Type for assets router
 */
export type AssetsRouter = ReturnType<typeof assetsRouter>
