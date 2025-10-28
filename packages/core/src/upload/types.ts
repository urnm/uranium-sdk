/**
 * Upload System Types
 *
 * Comprehensive type definitions for the file upload system.
 * Provides type safety for upload progress tracking, configuration,
 * and chunked upload operations.
 *
 * @module @uranium/sdk/upload/types
 */

import type { ClientUploadStage } from "../types/enums"

/**
 * Upload progress information
 *
 * Tracks the current state of an ongoing upload operation,
 * including chunking progress and client-side stage.
 */
export interface UploadProgress {
  /**
   * Current client-side upload stage
   * Reflects actual local operations, not backend asset status
   */
  stage: ClientUploadStage

  /**
   * Overall upload completion percentage (0-100)
   */
  percent: number

  /**
   * Number of chunks successfully uploaded
   */
  uploadedChunks: number

  /**
   * Total number of chunks to upload
   */
  totalChunks: number

  /**
   * Current chunk being processed (1-based index)
   */
  currentChunk: number

  /**
   * Human-readable status message for current operation
   */
  currentStatus: string

  /**
   * Current chunk upload progress (0-100)
   * Only available during UPLOADING stage
   * Provides fine-grained progress within each chunk
   */
  chunkProgress?: number
}

/**
 * Metadata information for uploaded assets
 *
 * User-defined descriptive information attached to NFTs.
 */
export interface UploadMetadata {
  /**
   * Asset title (3-120 characters, required)
   */
  title: string

  /**
   * Asset description (optional, max 255 characters)
   */
  description?: string

  /**
   * Location where asset was created (optional, max 100 characters)
   */
  location?: string
}

/**
 * Configuration options for upload operations
 *
 * Controls upload behavior, metadata, and progress tracking.
 */
export interface UploadOptions {
  /**
   * ID of the collection to mint the asset in (required)
   */
  contractId: string

  /**
   * Asset metadata (title, description, location)
   */
  metadata: UploadMetadata

  /**
   * Number of editions to mint (for ERC1155 collections only, 1-1000)
   * @default 1
   */
  editions?: number

  /**
   * Make the asset discoverable by the community
   * @default false
   */
  shareWithCommunity?: boolean

  /**
   * Disable automatic thumbnail generation
   * @default false
   */
  disableThumbnail?: boolean

  /**
   * Mark the asset as private (not visible in public listings)
   * @default false
   */
  isPrivate?: boolean

  /**
   * Callback function to track upload progress
   * Called periodically during upload with current progress state
   */
  onProgress?: (progress: UploadProgress) => void

  /**
   * AbortSignal to cancel the upload operation
   * Allows users to abort long-running uploads
   */
  signal?: AbortSignal
}

/**
 * Result of a single chunk upload operation
 *
 * Contains verification data needed to complete multipart upload.
 */
export interface ChunkUploadResult {
  /**
   * Sequential part number for this chunk (1-based)
   */
  partNumber: number

  /**
   * ETag header value from S3 response
   * Used to verify chunk integrity during completion
   */
  eTag: string
}
