/**
 * Tests for chunk uploader module
 */

import { beforeEach, describe, expect, mock, test } from "bun:test"
import axios from "axios"
import { UploadError } from "../types/errors"
import { type UploadChunkParams, uploadChunk } from "./chunk-uploader"

describe("uploadChunk", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mock.restore()
  })

  test("successful upload returns ETag", async () => {
    const mockPut = mock(() =>
      Promise.resolve({
        headers: { etag: '"abc123"' },
      }),
    )

    // @ts-expect-error - mocking axios
    axios.put = mockPut

    const params: UploadChunkParams = {
      url: "https://s3.amazonaws.com/test-bucket/test-key",
      data: new ArrayBuffer(1024),
    }

    const etag = await uploadChunk(params)

    expect(etag).toBe("abc123")
    expect(mockPut).toHaveBeenCalledTimes(1)
  })

  test("retry on error - should attempt 3 times", async () => {
    const mockPut = mock(() => Promise.reject(new Error("Network error")))

    axios.put = mockPut

    const params: UploadChunkParams = {
      url: "https://s3.amazonaws.com/test-bucket/test-key",
      data: new ArrayBuffer(1024),
    }

    await expect(uploadChunk(params)).rejects.toThrow(UploadError)
    expect(mockPut).toHaveBeenCalledTimes(3)
  })

  test("onProgress callbacks are called", async () => {
    const progressValues: number[] = []

    const mockPut = mock((_url: string, _data: any, config: any) => {
      // Simulate progress updates
      if (config.onUploadProgress) {
        config.onUploadProgress({ loaded: 512, total: 1024 })
        config.onUploadProgress({ loaded: 1024, total: 1024 })
      }
      return Promise.resolve({
        headers: { etag: '"progress-test"' },
      })
    })

    // @ts-expect-error - mocking axios
    axios.put = mockPut

    const params: UploadChunkParams = {
      url: "https://s3.amazonaws.com/test-bucket/test-key",
      data: new ArrayBuffer(1024),
      onProgress: (progress) => progressValues.push(progress),
    }

    await uploadChunk(params)

    expect(progressValues.length).toBeGreaterThan(0)
    expect(progressValues[0]).toBe(0.5)
    expect(progressValues[1]).toBe(1)
  })

  test("AbortSignal works - throws immediately", async () => {
    // Mock axios.put to ensure it's not the issue
    const mockPut = mock(() =>
      Promise.resolve({
        headers: { etag: '"should-not-reach"' },
      }),
    )
    // @ts-expect-error - mocking axios
    axios.put = mockPut

    const controller = new AbortController()
    controller.abort()

    const params: UploadChunkParams = {
      url: "https://s3.amazonaws.com/test-bucket/test-key",
      data: new ArrayBuffer(1024),
      signal: controller.signal,
    }

    try {
      await uploadChunk(params)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(UploadError)
      expect((error as Error).message).toContain("aborted")
    }
  })

  test("AbortSignal during upload", async () => {
    const controller = new AbortController()

    const mockPut = mock(() => {
      controller.abort()
      const error: any = new Error("Request aborted")
      error.code = "ERR_CANCELED"
      return Promise.reject(error)
    })

    axios.put = mockPut
    // @ts-expect-error - mocking axios
    axios.isCancel = mock((error: any) => error?.code === "ERR_CANCELED")

    const params: UploadChunkParams = {
      url: "https://s3.amazonaws.com/test-bucket/test-key",
      data: new ArrayBuffer(1024),
      signal: controller.signal,
    }

    await expect(uploadChunk(params)).rejects.toThrow(UploadError)
  })

  test("returns correct ETag without quotes", async () => {
    const testCases = [
      { input: '"etag-with-quotes"', expected: "etag-with-quotes" },
      { input: "etag-without-quotes", expected: "etag-without-quotes" },
      { input: '"complex-etag-123-abc"', expected: "complex-etag-123-abc" },
    ]

    for (const testCase of testCases) {
      const mockPut = mock(() =>
        Promise.resolve({
          headers: { etag: testCase.input },
        }),
      )

      // @ts-expect-error - mocking axios
      axios.put = mockPut

      const params: UploadChunkParams = {
        url: "https://s3.amazonaws.com/test-bucket/test-key",
        data: new ArrayBuffer(1024),
      }

      const etag = await uploadChunk(params)
      expect(etag).toBe(testCase.expected)
    }
  })

  test("exponential backoff behavior", async () => {
    const timestamps: number[] = []

    const mockPut = mock(() => {
      timestamps.push(Date.now())
      return Promise.reject(new Error("Temporary failure"))
    })

    axios.put = mockPut

    const params: UploadChunkParams = {
      url: "https://s3.amazonaws.com/test-bucket/test-key",
      data: new ArrayBuffer(1024),
    }

    await expect(uploadChunk(params)).rejects.toThrow(UploadError)

    // Should have 3 attempts
    expect(timestamps.length).toBe(3)

    // Verify exponential backoff behavior without exact timing assertions
    // This avoids flakiness on slow systems while still testing the retry logic
    if (timestamps.length === 3) {
      const delay1 = timestamps[1] - timestamps[0]
      const delay2 = timestamps[2] - timestamps[1]

      // Verify delays occurred (not instant retries)
      expect(delay1).toBeGreaterThanOrEqual(800)

      // Verify second delay is longer than first (exponential backoff)
      expect(delay2).toBeGreaterThan(delay1)

      // Verify delays are reasonable (not excessively long, which would indicate a bug)
      expect(delay1).toBeLessThan(5000)
      expect(delay2).toBeLessThan(10000)
    }
  })

  test("missing ETag in response throws error", async () => {
    let callCount = 0
    const mockPut = mock(() => {
      callCount++
      return Promise.resolve({
        headers: {}, // No ETag header
      })
    })

    // @ts-expect-error - mocking axios
    axios.put = mockPut

    const params: UploadChunkParams = {
      url: "https://s3.amazonaws.com/test-bucket/test-key",
      data: new ArrayBuffer(1024),
    }

    try {
      await uploadChunk(params)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(UploadError)
      // Missing ETag causes retries, so final error is "Failed to upload chunk after maximum retries"
      expect((error as Error).message).toContain("maximum retries")
      expect(callCount).toBe(3) // Should retry 3 times
    }
  })

  test("successful upload after retry", async () => {
    let attemptCount = 0

    const mockPut = mock(() => {
      attemptCount++
      if (attemptCount < 2) {
        return Promise.reject(new Error("Temporary failure"))
      }
      return Promise.resolve({
        headers: { etag: '"success-after-retry"' },
      })
    })

    // @ts-expect-error - mocking axios
    axios.put = mockPut

    const params: UploadChunkParams = {
      url: "https://s3.amazonaws.com/test-bucket/test-key",
      data: new ArrayBuffer(1024),
    }

    const etag = await uploadChunk(params)

    expect(etag).toBe("success-after-retry")
    expect(attemptCount).toBe(2)
  })
})
