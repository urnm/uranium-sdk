/**
 * Chunk Upload Module
 *
 * Handles uploading individual chunks to S3 with retry logic and progress tracking.
 * Implements exponential backoff for failed uploads.
 *
 * @module @uranium/sdk/upload/chunk-uploader
 */

import type { AxiosError } from "axios"
import * as axiosModule from "axios"
import { UploadError } from "../types/errors"
import { extractEtagFromHeaders } from "./utils"

const axios = axiosModule.default

/**
 * Maximum number of retry attempts for failed uploads
 */
const MAX_RETRIES = 3

/**
 * Base delay in milliseconds for exponential backoff
 */
const BASE_RETRY_DELAY = 1000

/**
 * Parameters for uploading a single chunk
 */
export interface UploadChunkParams {
  /** S3 presigned URL for the chunk upload */
  url: string
  /** Chunk data as ArrayBuffer */
  data: ArrayBuffer
  /** Optional progress callback (0-1 range) */
  onProgress?: (progress: number) => void
  /** Optional abort signal for cancellation */
  signal?: AbortSignal
}

/**
 * Uploads a single chunk to S3 with retry logic
 *
 * Features:
 * - Automatic retries with exponential backoff (1s, 2s, 4s)
 * - Progress tracking via callback
 * - Abort signal support for cancellation
 * - ETag extraction from response headers
 *
 * @param params - Upload parameters
 * @returns ETag of the uploaded chunk
 * @throws {UploadError} After 3 failed attempts or if aborted
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 *
 * try {
 *   const etag = await uploadChunk({
 *     url: 'https://s3.amazonaws.com/...',
 *     data: chunkBuffer,
 *     onProgress: (progress) => console.log(`${progress * 100}%`),
 *     signal: controller.signal
 *   });
 *   console.log('Uploaded with ETag:', etag);
 * } catch (error) {
 *   if (error instanceof UploadError) {
 *     console.error('Upload failed after retries:', error.retryAttempts);
 *   }
 * }
 * ```
 */
export async function uploadChunk(params: UploadChunkParams): Promise<string> {
  const { url, data, onProgress, signal } = params

  let lastError: Error | undefined

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Check if abort was requested before starting
      if (signal?.aborted) {
        throw new UploadError(
          "Upload aborted by user",
          "UPLOAD_ABORTED",
          undefined,
          undefined,
          { url, attempt },
        )
      }

      // Perform the upload using axios
      const response = await axios.put(url, data, {
        headers: {
          "Content-Type": "application/octet-stream",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = progressEvent.loaded / progressEvent.total
            onProgress(progress)
          }
        },
        signal,
      })

      // Extract ETag from response headers
      const etag = extractEtagFromHeaders(response.headers)

      if (!etag) {
        throw new UploadError(
          "Failed to extract ETag from response",
          "ETAG_MISSING",
          undefined,
          undefined,
          { url, attempt },
        )
      }

      return etag
    } catch (error) {
      lastError = error as Error

      // Re-throw UploadError instances immediately (like abort or missing ETag)
      if (error instanceof UploadError && error.code === "UPLOAD_ABORTED") {
        throw error
      }

      // Check if this is an abort error from axios
      if (
        axios.isCancel(error) ||
        (error as AxiosError).code === "ERR_CANCELED"
      ) {
        throw new UploadError(
          "Upload aborted by user",
          "UPLOAD_ABORTED",
          undefined,
          undefined,
          { url, attempt, originalError: lastError?.message },
        )
      }

      // If this is the last attempt, don't retry
      if (attempt === MAX_RETRIES - 1) {
        break
      }

      // Calculate exponential backoff delay: 1000ms, 2000ms, 4000ms
      const delay = BASE_RETRY_DELAY * 2 ** attempt

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // All retries failed
  throw new UploadError(
    "Failed to upload chunk after maximum retries",
    "UPLOAD_FAILED",
    undefined,
    undefined,
    { url, retryAttempts: MAX_RETRIES, originalError: lastError?.message },
  )
}
