import { describe, expect, test } from "bun:test"
import {
  createApiClient,
  createApiRouters,
  SDK_VERSION,
  UraniumSDK,
} from "./index"
import { UploadManager } from "./upload/upload-manager"

describe("SDK Exports", () => {
  test("SDK version is defined", () => {
    expect(SDK_VERSION).toBe("0.1.0")
  })

  test("createApiClient is exported", () => {
    expect(typeof createApiClient).toBe("function")
  })

  test("createApiRouters is exported", () => {
    expect(typeof createApiRouters).toBe("function")
  })
})

describe("UraniumSDK Class", () => {
  test("should create SDK instance with valid config", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk).toBeDefined()
    expect(sdk.version).toBe("0.1.0")
    expect(sdk.account).toBeDefined()
    expect(sdk.contracts).toBeDefined()
    expect(sdk.assets).toBeDefined()
  })

  test("should throw error without API key", () => {
    expect(() => new UraniumSDK({} as UraniumConfig)).toThrow(
      "API key is required",
    )
  })

  test("should throw error with empty API key", () => {
    expect(() => new UraniumSDK({ apiKey: "" })).toThrow("API key is required")
  })

  test("should expose all routers", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.account.getMe).toBe("function")
    expect(typeof sdk.contracts.list).toBe("function")
    expect(typeof sdk.contracts.create).toBe("function")
    expect(typeof sdk.assets.list).toBe("function")
    expect(typeof sdk.assets.prepareNewFile).toBe("function")
    expect(typeof sdk.assets.completeUpload).toBe("function")
    expect(typeof sdk.assets.startMinting).toBe("function")
  })

  test("should expose upload manager", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.upload).toBeDefined()
    expect(sdk.upload instanceof UploadManager).toBe(true)
  })

  test("upload manager should have upload method", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.upload.upload).toBe("function")
  })

  test("should accept optional configuration", () => {
    const sdk = new UraniumSDK({
      apiKey: "test-key",
      baseUrl: "https://custom.api.com",
      timeout: 30000,
      debug: true,
    })
    expect(sdk).toBeDefined()
    expect(sdk.version).toBe("0.1.0")
  })

  test("should be an instance of UraniumSDK", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk instanceof UraniumSDK).toBe(true)
  })
})
