/**
 * Upload Manager
 *
 * High-level orchestrator for the complete file upload and NFT minting flow.
 * Handles preparation, chunked upload, completion, and minting with progress tracking.
 *
 * @module @uranium/sdk/upload/upload-manager
 */

import type { AssetsRouter } from "../client/assets"
import { SDK_VERSION } from "../index"
import type { AssetEntity } from "../types/entities"
import {
  ClientUploadStage,
  FileSource,
  FileType,
  Metadata_AttributeType,
} from "../types/enums"
import { UploadError, ValidationError } from "../types/errors"
import {
  assetDescriptionSchema,
  assetLocationSchema,
  assetTitleSchema,
  editionsSchema,
} from "../validation/schemas"
import { validateSchema } from "../validation/utils"
import { uploadChunk } from "./chunk-uploader"
import type { UploadOptions, UploadProgress } from "./types"
import { detectFileType } from "./utils"

/**
 * Default chunk size for uploads (5 MB)
 */
const _DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024

/**
 * Maximum file size (100 MB)
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024

/**
 * Upload Manager
 *
 * Orchestrates the complete upload flow from file preparation to NFT minting.
 * Provides progress callbacks and supports cancellation via AbortSignal.
 */
export class UploadManager {
  constructor(
    private readonly assetsRouter: AssetsRouter,
    private readonly deviceId: string,
  ) {}

  /**
   * Upload a file and submit it for NFT minting
   *
   * Complete flow:
   * 1. VALIDATING (0-5%): Validate file size, type, and upload options
   * 2. PREPARING (5-12%): Call prepareNewFile API to get presigned S3 URLs
   * 3. PROCESSING (12-18%): Convert file to ArrayBuffer and split into chunks
   * 4. UPLOADING (18-75%): Upload chunks to S3 with retry logic and per-chunk progress
   * 5. FINALIZING (75-85%): Call completeUpload API (S3 finalization + thumbnails)
   * 6. REQUESTING_MINT (85-99%): Call startMinting API to submit NFT to mint queue
   * 7. DONE (100%): Upload complete, NFT submitted to mint queue
   *
   * @param file - File or Buffer to upload
   * @param options - Upload configuration and metadata
   * @returns Asset entity (Note: NFT will be minted asynchronously on backend)
   * @throws {ValidationError} If validation fails
   * @throws {UploadError} If upload fails
   */
  async upload(
    file: File | Buffer,
    options: UploadOptions,
  ): Promise<AssetEntity> {
    const { signal, onProgress } = options

    try {
      // ========================================================================
      // STAGE 1: VALIDATING (0-5%)
      // ========================================================================

      // Report validation start
      this.reportProgress(onProgress, {
        stage: ClientUploadStage.VALIDATING,
        percent: 0,
        uploadedChunks: 0,
        totalChunks: 0,
        currentChunk: 0,
        currentStatus: "Validating file...",
      })

      // Validate file
      const fileSize = this.getFileSize(file)
      this.validateFileSize(fileSize)

      // Validate options
      this.validateOptions(options)

      // Detect file type
      const mimeType = this.getMimeType(file)
      const fileType = detectFileType(mimeType)

      if (fileType === FileType.Unknown) {
        throw new ValidationError(
          "Unsupported file type. Please upload an image or video file.",
          "INVALID_FILE_TYPE",
        )
      }

      // Report validation complete
      this.reportProgress(onProgress, {
        stage: ClientUploadStage.VALIDATING,
        percent: 5,
        uploadedChunks: 0,
        totalChunks: 0,
        currentChunk: 0,
        currentStatus: "Validation complete",
      })

      // Check for abort
      this.checkAbort(signal)

      // ========================================================================
      // STAGE 2: PREPARING (5-12%)
      // ========================================================================

      this.reportProgress(onProgress, {
        stage: ClientUploadStage.PREPARING,
        percent: 5,
        uploadedChunks: 0,
        totalChunks: 0,
        currentChunk: 0,
        currentStatus: "Preparing upload...",
      })

      // Create metadata JSON
      const metadataJson = JSON.stringify({
        title: options.metadata.title,
        description: options.metadata.description || null,
        location: options.metadata.location || null,
      })

      // Prepare upload - API call to get presigned URLs
      const prepareResponse = await this.assetsRouter.prepareNewFile({
        deviceId: this.deviceId,
        metadata: metadataJson,
        type: fileType,
        source: FileSource.Upload,
        fileSize,
        isPrivate: options.isPrivate,
      })

      const { fileId, uploadPartUrls, chunkCount, chunkSize } = prepareResponse

      // Report preparing complete
      this.reportProgress(onProgress, {
        stage: ClientUploadStage.PREPARING,
        percent: 12,
        uploadedChunks: 0,
        totalChunks: chunkCount,
        currentChunk: 0,
        currentStatus: "Upload prepared",
      })

      // Check for abort
      this.checkAbort(signal)

      // ========================================================================
      // STAGE 3: PROCESSING (12-18%)
      // ========================================================================

      this.reportProgress(onProgress, {
        stage: ClientUploadStage.PROCESSING,
        percent: 12,
        uploadedChunks: 0,
        totalChunks: chunkCount,
        currentChunk: 0,
        currentStatus: "Processing file...",
      })

      // Convert file to ArrayBuffer
      const fileData = await this.fileToArrayBuffer(file)

      // Prepare chunks
      const chunks = uploadPartUrls.map((part) => {
        const start = (part.partNumber - 1) * chunkSize
        const end = Math.min(start + chunkSize, fileSize)
        return {
          url: part.url,
          data: fileData.slice(start, end),
          partNumber: part.partNumber,
        }
      })

      // Report processing complete
      this.reportProgress(onProgress, {
        stage: ClientUploadStage.PROCESSING,
        percent: 18,
        uploadedChunks: 0,
        totalChunks: chunkCount,
        currentChunk: 0,
        currentStatus: "File processed",
      })

      // Check for abort
      this.checkAbort(signal)

      // ========================================================================
      // STAGE 4: UPLOADING (18-75%)
      // ========================================================================

      // Upload chunks with progress tracking
      let uploadedChunks = 0
      const uploadResults: Array<{ partNumber: number; eTag: string }> = []

      for (const chunk of chunks) {
        // Check for abort
        this.checkAbort(signal)

        // Upload chunk with per-chunk progress
        const eTag = await uploadChunk({
          url: chunk.url,
          data: chunk.data,
          signal,
          onProgress: (chunkProgress) => {
            // Calculate overall percent based on completed chunks + current chunk progress
            const basePercent = this.calculateProgress(
              uploadedChunks,
              chunkCount,
              18,
              75,
            )
            const chunkRange = (75 - 18) / chunkCount
            const currentChunkPercent = basePercent + chunkProgress * chunkRange

            this.reportProgress(onProgress, {
              stage: ClientUploadStage.UPLOADING,
              percent: Math.round(currentChunkPercent),
              uploadedChunks,
              totalChunks: chunkCount,
              currentChunk: chunk.partNumber,
              currentStatus: `Uploading chunk ${chunk.partNumber} of ${chunkCount}...`,
              chunkProgress: Math.round(chunkProgress * 100),
            })
          },
        })

        uploadedChunks++
        uploadResults.push({
          partNumber: chunk.partNumber,
          eTag,
        })

        // Report chunk complete
        const percent = this.calculateProgress(
          uploadedChunks,
          chunkCount,
          18,
          75,
        )
        this.reportProgress(onProgress, {
          stage: ClientUploadStage.UPLOADING,
          percent,
          uploadedChunks,
          totalChunks: chunkCount,
          currentChunk: chunk.partNumber,
          currentStatus: `Uploaded chunk ${uploadedChunks} of ${chunkCount}`,
        })
      }

      // Check for abort
      this.checkAbort(signal)

      // ========================================================================
      // STAGE 5: FINALIZING (75-85%)
      // ========================================================================

      this.reportProgress(onProgress, {
        stage: ClientUploadStage.FINALIZING,
        percent: 75,
        uploadedChunks: chunkCount,
        totalChunks: chunkCount,
        currentChunk: chunkCount,
        currentStatus: "Finalizing upload...",
      })

      // Complete upload - API call for S3 finalization and thumbnail generation
      await this.assetsRouter.completeUpload({
        fileId,
        mimeType,
        chunks: uploadResults,
        disableThumbnail: options.disableThumbnail,
      })

      this.reportProgress(onProgress, {
        stage: ClientUploadStage.FINALIZING,
        percent: 85,
        uploadedChunks: chunkCount,
        totalChunks: chunkCount,
        currentChunk: chunkCount,
        currentStatus: "Upload finalized",
      })

      // Check for abort
      this.checkAbort(signal)

      // ========================================================================
      // STAGE 6: REQUESTING_MINT (85-99%)
      // ========================================================================

      this.reportProgress(onProgress, {
        stage: ClientUploadStage.REQUESTING_MINT,
        percent: 85,
        uploadedChunks: chunkCount,
        totalChunks: chunkCount,
        currentChunk: chunkCount,
        currentStatus: "Preparing mint request...",
      })

      // Create metadata attributes
      const attributes = [
        {
          key: "title",
          value: options.metadata.title,
          type: Metadata_AttributeType.STRING,
        },
        {
          key: "appName",
          value: "uranium-sdk",
          type: Metadata_AttributeType.STRING,
        },
        {
          key: "appVersion",
          value: SDK_VERSION,
          type: Metadata_AttributeType.STRING,
        },
      ]

      // Add optional attributes
      if (options.metadata.description) {
        attributes.push({
          key: "description",
          value: options.metadata.description,
          type: Metadata_AttributeType.STRING,
        })
      }

      if (options.metadata.location) {
        attributes.push({
          key: "location",
          value: options.metadata.location,
          type: Metadata_AttributeType.STRING,
        })
      }

      this.reportProgress(onProgress, {
        stage: ClientUploadStage.REQUESTING_MINT,
        percent: 90,
        uploadedChunks: chunkCount,
        totalChunks: chunkCount,
        currentChunk: chunkCount,
        currentStatus: "Submitting to mint queue...",
      })

      // Start minting - API call to submit NFT to mint queue
      const mintingResult = await this.assetsRouter.startMinting({
        fileId,
        editions: options.editions,
        contractId: options.contractId,
        shareWithCommunity: options.shareWithCommunity,
        metadata: { attributes },
      })

      // Check for abort
      this.checkAbort(signal)

      this.reportProgress(onProgress, {
        stage: ClientUploadStage.REQUESTING_MINT,
        percent: 99,
        uploadedChunks: chunkCount,
        totalChunks: chunkCount,
        currentChunk: chunkCount,
        currentStatus: "Mint request submitted",
      })

      // ========================================================================
      // STAGE 7: DONE (100%)
      // ========================================================================

      this.reportProgress(onProgress, {
        stage: ClientUploadStage.DONE,
        percent: 100,
        uploadedChunks: chunkCount,
        totalChunks: chunkCount,
        currentChunk: chunkCount,
        currentStatus: "Complete!",
      })

      // TODO: The API doesn't return AssetEntity directly from startMinting
      // We need to either fetch the asset or update the API to return it
      // For now, we'll return a partial asset with the info we have
      return {
        id: fileId,
        status: mintingResult.status as any,
        contractAddress: mintingResult.contractAddress || undefined,
        tokenId: mintingResult.tokenId || undefined,
        // We don't have all the fields, so we'll cast with minimal data
      } as AssetEntity
    } catch (error) {
      // Handle abort
      if (signal?.aborted || (error as any).name === "AbortError") {
        throw new UploadError("Upload cancelled by user", "UPLOAD_CANCELLED")
      }

      // Re-throw known errors
      if (error instanceof ValidationError || error instanceof UploadError) {
        throw error
      }

      // Wrap unknown errors
      throw new UploadError(
        `Upload failed: ${(error as Error).message}`,
        "UPLOAD_FAILED",
      )
    }
  }

  /**
   * Validate upload options
   */
  private validateOptions(options: UploadOptions): void {
    // Validate title
    validateSchema(
      assetTitleSchema,
      options.metadata.title,
      "Invalid asset title",
    )

    // Validate description if provided
    if (
      options.metadata.description !== undefined &&
      options.metadata.description !== null
    ) {
      validateSchema(
        assetDescriptionSchema,
        options.metadata.description,
        "Invalid asset description",
      )
    }

    // Validate location if provided
    if (
      options.metadata.location !== undefined &&
      options.metadata.location !== null
    ) {
      validateSchema(
        assetLocationSchema,
        options.metadata.location,
        "Invalid asset location",
      )
    }

    // Validate editions if provided
    if (options.editions !== undefined && options.editions !== null) {
      validateSchema(editionsSchema, options.editions, "Invalid editions count")
    }

    // Validate contractId
    if (!options.contractId || typeof options.contractId !== "string") {
      throw new ValidationError("Contract ID is required", "VALIDATION_ERROR")
    }
  }

  /**
   * Get file size
   */
  private getFileSize(file: File | Buffer): number {
    if (typeof File !== "undefined" && file instanceof File) {
      return file.size
    }
    if (Buffer.isBuffer(file)) {
      return file.length
    }
    throw new ValidationError("Invalid file type", "INVALID_FILE_TYPE")
  }

  /**
   * Validate file size
   */
  private validateFileSize(size: number): void {
    if (size <= 0) {
      throw new ValidationError(
        "File size must be greater than 0",
        "INVALID_FILE_SIZE",
      )
    }
    if (size > MAX_FILE_SIZE) {
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)
      throw new ValidationError(
        `File size exceeds maximum allowed size of ${maxSizeMB} MB`,
        "FILE_TOO_LARGE",
      )
    }
  }

  /**
   * Get MIME type from file
   */
  private getMimeType(file: File | Buffer): string {
    if (typeof File !== "undefined" && file instanceof File) {
      return file.type || "application/octet-stream"
    }
    return "application/octet-stream"
  }

  /**
   * Convert file to ArrayBuffer
   */
  private async fileToArrayBuffer(file: File | Buffer): Promise<ArrayBuffer> {
    if (typeof File !== "undefined" && file instanceof File) {
      return await file.arrayBuffer()
    }
    if (Buffer.isBuffer(file)) {
      return file.buffer.slice(
        file.byteOffset,
        file.byteOffset + file.byteLength,
      ) as ArrayBuffer
    }
    throw new ValidationError("Invalid file type", "INVALID_FILE_TYPE")
  }

  /**
   * Calculate progress percentage within a range
   */
  private calculateProgress(
    current: number,
    total: number,
    min: number,
    max: number,
  ): number {
    if (total === 0) return min
    const range = max - min
    const progress = (current / total) * range + min
    return Math.round(Math.min(max, Math.max(min, progress)))
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    callback: ((progress: UploadProgress) => void) | undefined,
    progress: UploadProgress,
  ): void {
    if (callback) {
      callback(progress)
    }
  }

  /**
   * Check if upload was aborted
   */
  private checkAbort(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new UploadError("Upload cancelled by user", "UPLOAD_CANCELLED")
    }
  }
}
