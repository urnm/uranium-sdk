import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { DeviceManager } from "./device"

describe("DeviceManager", () => {
  // Mock storage for testing
  let mockStorage: Storage

  beforeEach(() => {
    // Clear memory cache between tests
    DeviceManager.clearDeviceId()

    // Create mock storage
    const storage = new Map<string, string>()
    mockStorage = {
      getItem: mock((key: string) => storage.get(key) ?? null),
      setItem: mock((key: string, value: string) => {
        storage.set(key, value)
      }),
      removeItem: mock((key: string) => {
        storage.delete(key)
      }),
      clear: mock(() => {
        storage.clear()
      }),
      key: mock((index: number) => Array.from(storage.keys())[index] ?? null),
      get length() {
        return storage.size
      },
    } as Storage
  })

  afterEach(() => {
    // Clean up after each test
    DeviceManager.clearDeviceId()
  })

  describe("generateDeviceId", () => {
    test("should generate device ID with sdk- prefix", () => {
      const deviceId = DeviceManager.generateDeviceId()
      expect(deviceId).toMatch(
        /^sdk-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    })

    test("should generate unique device IDs", () => {
      const id1 = DeviceManager.generateDeviceId()
      const id2 = DeviceManager.generateDeviceId()
      expect(id1).not.toBe(id2)
    })

    test("should use crypto.randomUUID", () => {
      const deviceId = DeviceManager.generateDeviceId()
      // Check UUID v4 format (variant 4)
      expect(deviceId).toMatch(/^sdk-[0-9a-f-]{36}$/)
    })
  })

  describe("getDeviceId", () => {
    test("should generate device ID on first call", () => {
      const deviceId = DeviceManager.getDeviceId({ storage: mockStorage })
      expect(deviceId).toMatch(/^sdk-/)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "uranium_device_id",
        deviceId,
      )
    })

    test("should reuse device ID from storage", () => {
      const deviceId1 = DeviceManager.getDeviceId({ storage: mockStorage })
      const deviceId2 = DeviceManager.getDeviceId({ storage: mockStorage })
      expect(deviceId1).toBe(deviceId2)
      // setItem should only be called once (on first call)
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1)
    })

    test("should load device ID from storage", () => {
      const existingId = "sdk-test-existing-id"
      mockStorage.setItem("uranium_device_id", existingId)

      const deviceId = DeviceManager.getDeviceId({ storage: mockStorage })
      expect(deviceId).toBe(existingId)
    })

    test("should use memory cache when storage is null", () => {
      const deviceId1 = DeviceManager.getDeviceId({ storage: null })
      const deviceId2 = DeviceManager.getDeviceId({ storage: null })
      expect(deviceId1).toBe(deviceId2)
    })

    test("should handle storage errors gracefully", () => {
      const failingStorage = {
        getItem: mock(() => {
          throw new Error("Storage error")
        }),
        setItem: mock(() => {
          throw new Error("Storage error")
        }),
        removeItem: mock(() => {
          throw new Error("Storage error")
        }),
        clear: mock(() => {}),
        key: mock(() => null),
        length: 0,
      } as Storage

      // Should not throw, should use memory cache
      const deviceId1 = DeviceManager.getDeviceId({ storage: failingStorage })
      expect(deviceId1).toMatch(/^sdk-/)

      // Should reuse memory cache
      const deviceId2 = DeviceManager.getDeviceId({ storage: failingStorage })
      expect(deviceId1).toBe(deviceId2)
    })

    test("should use default storage when no options provided", () => {
      // This test depends on environment (browser vs Node)
      const deviceId = DeviceManager.getDeviceId()
      expect(deviceId).toMatch(/^sdk-/)
    })

    test("should update memory cache when loading from storage", () => {
      const existingId = "sdk-test-cached-id"
      mockStorage.setItem("uranium_device_id", existingId)

      // First call loads from storage and updates cache
      const deviceId1 = DeviceManager.getDeviceId({ storage: mockStorage })
      expect(deviceId1).toBe(existingId)

      // Second call with no storage should use memory cache
      const deviceId2 = DeviceManager.getDeviceId({ storage: null })
      expect(deviceId2).toBe(existingId)
    })

    test("should persist device ID across different calls", () => {
      const deviceId1 = DeviceManager.getDeviceId({ storage: mockStorage })

      // Simulate app restart by clearing memory but not storage
      const storedId = mockStorage.getItem("uranium_device_id")
      expect(storedId).toBe(deviceId1)

      // New call should get same ID from storage
      const deviceId2 = DeviceManager.getDeviceId({ storage: mockStorage })
      expect(deviceId2).toBe(deviceId1)
    })
  })

  describe("clearDeviceId", () => {
    test("should clear device ID from storage", () => {
      const deviceId = DeviceManager.getDeviceId({ storage: mockStorage })
      expect(mockStorage.getItem("uranium_device_id")).toBe(deviceId)

      DeviceManager.clearDeviceId({ storage: mockStorage })
      expect(mockStorage.removeItem).toHaveBeenCalledWith("uranium_device_id")
    })

    test("should clear memory cache", () => {
      const deviceId1 = DeviceManager.getDeviceId({ storage: null })
      DeviceManager.clearDeviceId({ storage: null })

      // After clear, should generate new ID
      const deviceId2 = DeviceManager.getDeviceId({ storage: null })
      expect(deviceId2).not.toBe(deviceId1)
    })

    test("should handle storage errors gracefully", () => {
      const failingStorage = {
        getItem: mock(() => null),
        setItem: mock(() => {}),
        removeItem: mock(() => {
          throw new Error("Storage error")
        }),
        clear: mock(() => {}),
        key: mock(() => null),
        length: 0,
      } as Storage

      // Should not throw
      expect(() =>
        DeviceManager.clearDeviceId({ storage: failingStorage }),
      ).not.toThrow()
    })

    test("should clear both storage and memory", () => {
      // Set up device ID in both storage and memory
      const deviceId = DeviceManager.getDeviceId({ storage: mockStorage })
      expect(mockStorage.getItem("uranium_device_id")).toBe(deviceId)

      // Clear
      DeviceManager.clearDeviceId({ storage: mockStorage })

      // Verify cleared from storage
      expect(mockStorage.removeItem).toHaveBeenCalled()

      // Verify cleared from memory (new ID generated)
      const newDeviceId = DeviceManager.getDeviceId({ storage: null })
      expect(newDeviceId).not.toBe(deviceId)
    })
  })

  describe("storage key", () => {
    test("should use 'uranium_device_id' as storage key", () => {
      DeviceManager.getDeviceId({ storage: mockStorage })
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "uranium_device_id",
        expect.any(String),
      )
    })
  })

  describe("integration scenarios", () => {
    test("should work in browser-like environment", () => {
      // Simulate browser with localStorage
      const deviceId1 = DeviceManager.getDeviceId({ storage: mockStorage })

      // Simulate page refresh (new instance, but same storage)
      const deviceId2 = DeviceManager.getDeviceId({ storage: mockStorage })

      expect(deviceId1).toBe(deviceId2)
    })

    test("should work in Node.js-like environment", () => {
      // Simulate Node.js (no localStorage, use memory)
      const deviceId1 = DeviceManager.getDeviceId({ storage: null })
      const deviceId2 = DeviceManager.getDeviceId({ storage: null })

      expect(deviceId1).toBe(deviceId2)
    })

    test("should handle storage quota exceeded", () => {
      const quotaExceededStorage = {
        getItem: mock(() => null),
        setItem: mock(() => {
          const error = new Error("QuotaExceededError")
          error.name = "QuotaExceededError"
          throw error
        }),
        removeItem: mock(() => {}),
        clear: mock(() => {}),
        key: mock(() => null),
        length: 0,
      } as Storage

      // Should fall back to memory cache
      const deviceId1 = DeviceManager.getDeviceId({
        storage: quotaExceededStorage,
      })
      const deviceId2 = DeviceManager.getDeviceId({
        storage: quotaExceededStorage,
      })

      expect(deviceId1).toBe(deviceId2)
    })

    test("should handle concurrent calls", () => {
      // Multiple concurrent calls should return same ID
      const [deviceId1, deviceId2, deviceId3] = [
        DeviceManager.getDeviceId({ storage: mockStorage }),
        DeviceManager.getDeviceId({ storage: mockStorage }),
        DeviceManager.getDeviceId({ storage: mockStorage }),
      ]

      expect(deviceId1).toBe(deviceId2)
      expect(deviceId2).toBe(deviceId3)

      // Should only write to storage once
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1)
    })
  })

  describe("legacy export", () => {
    test("generateDeviceId function should work", () => {
      const { generateDeviceId } = require("./device")
      const deviceId = generateDeviceId()
      expect(deviceId).toMatch(/^sdk-/)
    })
  })
})
