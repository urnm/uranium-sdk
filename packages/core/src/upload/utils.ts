/**
 * Upload System Utilities
 *
 * Helper functions for upload operations including file type detection,
 * ETag extraction, and data transformation.
 *
 * @module @uranium/sdk/upload/utils
 */

import { FileType } from "../types/enums"

/**
 * Extract ETag value from HTTP response headers
 *
 * ETags are used in multipart uploads to verify chunk integrity.
 * S3 may return ETags with or without surrounding quotes.
 *
 * @param headers - HTTP response headers object
 * @returns Normalized ETag string without quotes
 *
 * @example
 * ```ts
 * const headers = { etag: '"abc123"' };
 * const eTag = extractEtagFromHeaders(headers); // "abc123"
 * ```
 */
export const extractEtagFromHeaders = (
  headers: Record<string, any>,
): string => {
  const etag = headers.etag || headers.ETag || ""

  // Remove surrounding quotes if present
  return etag.replace(/^["']|["']$/g, "")
}

/**
 * Detect file type category from MIME type
 *
 * Categorizes files into Image, Video, Gif, or Unknown based on
 * their MIME type. Used for proper rendering and validation.
 *
 * @param mimeType - MIME type string (e.g., "image/png", "video/mp4")
 * @returns FileType enum value
 *
 * @example
 * ```ts
 * detectFileType("image/png");      // FileType.Image
 * detectFileType("video/mp4");      // FileType.Video
 * detectFileType("image/gif");      // FileType.Gif
 * detectFileType("application/pdf"); // FileType.Unknown
 * ```
 */
export const detectFileType = (mimeType: string): FileType => {
  if (!mimeType) {
    return FileType.Unknown
  }

  const normalized = mimeType.toLowerCase()

  // Check for GIF first (specific case of image)
  if (normalized === "image/gif") {
    return FileType.Gif
  }

  // Check for generic image types
  if (normalized.startsWith("image/")) {
    return FileType.Image
  }

  // Check for video types
  if (normalized.startsWith("video/")) {
    return FileType.Video
  }

  // Unknown or unsupported type
  return FileType.Unknown
}
