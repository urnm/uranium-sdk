/**
 * Upload System Utilities Tests
 *
 * Test suite for upload utility functions including ETag extraction
 * and file type detection.
 */

import { describe, expect, test } from "bun:test"
import { FileType } from "../types/enums"
import { detectFileType, extractEtagFromHeaders } from "./utils"

describe("extractEtagFromHeaders", () => {
  test("should extract ETag with double quotes", () => {
    const headers = { etag: '"abc123def456"' }
    expect(extractEtagFromHeaders(headers)).toBe("abc123def456")
  })

  test("should extract ETag with single quotes", () => {
    const headers = { etag: "'xyz789uvw012'" }
    expect(extractEtagFromHeaders(headers)).toBe("xyz789uvw012")
  })

  test("should extract ETag without quotes", () => {
    const headers = { etag: "plain-etag-value" }
    expect(extractEtagFromHeaders(headers)).toBe("plain-etag-value")
  })

  test("should handle uppercase ETag header", () => {
    const headers = { ETag: '"uppercase-header"' }
    expect(extractEtagFromHeaders(headers)).toBe("uppercase-header")
  })

  test("should handle mixed case headers", () => {
    const headers = { ETag: '"MixedCase123"', etag: undefined }
    expect(extractEtagFromHeaders(headers)).toBe("MixedCase123")
  })

  test("should return empty string if ETag is missing", () => {
    const headers = {}
    expect(extractEtagFromHeaders(headers)).toBe("")
  })

  test("should return empty string if ETag is null", () => {
    const headers = { etag: null }
    expect(extractEtagFromHeaders(headers)).toBe("")
  })

  test("should return empty string if ETag is undefined", () => {
    const headers = { etag: undefined }
    expect(extractEtagFromHeaders(headers)).toBe("")
  })

  test("should handle ETag with only opening quote", () => {
    const headers = { etag: '"partial' }
    expect(extractEtagFromHeaders(headers)).toBe("partial")
  })

  test("should handle ETag with only closing quote", () => {
    const headers = { etag: 'partial"' }
    expect(extractEtagFromHeaders(headers)).toBe("partial")
  })
})

describe("detectFileType", () => {
  describe("Image detection", () => {
    test("should detect PNG as Image", () => {
      expect(detectFileType("image/png")).toBe(FileType.Image)
    })

    test("should detect JPEG as Image", () => {
      expect(detectFileType("image/jpeg")).toBe(FileType.Image)
    })

    test("should detect JPG as Image", () => {
      expect(detectFileType("image/jpg")).toBe(FileType.Image)
    })

    test("should detect WEBP as Image", () => {
      expect(detectFileType("image/webp")).toBe(FileType.Image)
    })

    test("should detect SVG as Image", () => {
      expect(detectFileType("image/svg+xml")).toBe(FileType.Image)
    })

    test("should be case insensitive for images", () => {
      expect(detectFileType("IMAGE/PNG")).toBe(FileType.Image)
      expect(detectFileType("Image/Jpeg")).toBe(FileType.Image)
    })
  })

  describe("Video detection", () => {
    test("should detect MP4 as Video", () => {
      expect(detectFileType("video/mp4")).toBe(FileType.Video)
    })

    test("should detect MOV as Video", () => {
      expect(detectFileType("video/quicktime")).toBe(FileType.Video)
    })

    test("should detect WEBM as Video", () => {
      expect(detectFileType("video/webm")).toBe(FileType.Video)
    })

    test("should detect AVI as Video", () => {
      expect(detectFileType("video/x-msvideo")).toBe(FileType.Video)
    })

    test("should be case insensitive for videos", () => {
      expect(detectFileType("VIDEO/MP4")).toBe(FileType.Video)
      expect(detectFileType("Video/Webm")).toBe(FileType.Video)
    })
  })

  describe("GIF detection", () => {
    test("should detect GIF as Gif (not Image)", () => {
      expect(detectFileType("image/gif")).toBe(FileType.Gif)
    })

    test("should be case insensitive for GIF", () => {
      expect(detectFileType("IMAGE/GIF")).toBe(FileType.Gif)
      expect(detectFileType("Image/Gif")).toBe(FileType.Gif)
    })
  })

  describe("Unknown file types", () => {
    test("should return Unknown for PDF", () => {
      expect(detectFileType("application/pdf")).toBe(FileType.Unknown)
    })

    test("should return Unknown for JSON", () => {
      expect(detectFileType("application/json")).toBe(FileType.Unknown)
    })

    test("should return Unknown for plain text", () => {
      expect(detectFileType("text/plain")).toBe(FileType.Unknown)
    })

    test("should return Unknown for audio files", () => {
      expect(detectFileType("audio/mpeg")).toBe(FileType.Unknown)
    })

    test("should return Unknown for empty string", () => {
      expect(detectFileType("")).toBe(FileType.Unknown)
    })

    test("should return Unknown for invalid MIME type", () => {
      expect(detectFileType("not-a-mime-type")).toBe(FileType.Unknown)
    })

    test("should return Unknown for undefined", () => {
      expect(detectFileType(undefined as any)).toBe(FileType.Unknown)
    })

    test("should return Unknown for null", () => {
      expect(detectFileType(null as any)).toBe(FileType.Unknown)
    })
  })
})
