/**
 * Upload Module
 *
 * High-level file upload and NFT minting functionality.
 * Handles the complete flow from file preparation to blockchain minting.
 *
 * @module @uranium/sdk/upload
 */

// Export chunk uploader for advanced usage
export { type UploadChunkParams, uploadChunk } from "./chunk-uploader"

// Export types
export type {
  ChunkUploadResult,
  UploadMetadata,
  UploadOptions,
  UploadProgress,
} from "./types"
// Export main upload manager
export { UploadManager } from "./upload-manager"
// Export utilities
export { detectFileType, extractEtagFromHeaders } from "./utils"
