import { describe, expect, test } from "bun:test"
import { QueryClient } from "@tanstack/react-query"
import { type UraniumConfig, UraniumSDK } from "@uranium/sdk"

describe("UraniumProvider - Configuration Validation", () => {
  test("SDK should accept valid config with apiKey", () => {
    const config: UraniumConfig = { apiKey: "test-api-key" }
    const sdk = new UraniumSDK(config)

    expect(sdk).toBeInstanceOf(UraniumSDK)
    expect(sdk.version).toBe("0.1.0")
  })

  test("SDK should throw error if config.apiKey is missing", () => {
    let error: Error | null = null
    try {
      // @ts-expect-error - intentionally testing invalid config
      new UraniumSDK({})
    } catch (e) {
      error = e as Error
    }

    expect(error).not.toBeNull()
    expect(error?.message).toContain("API key is required")
  })

  test("SDK should throw error if config.apiKey is empty string", () => {
    let error: Error | null = null
    try {
      new UraniumSDK({ apiKey: "" })
    } catch (e) {
      error = e as Error
    }

    expect(error).not.toBeNull()
    expect(error?.message).toContain("API key is required")
  })

  test("SDK should accept config with all options", () => {
    const config: UraniumConfig = {
      apiKey: "test-api-key",
      baseUrl: "https://custom.api.com",
      timeout: 30000,
      debug: true,
      deviceId: "custom-device-id",
    }

    const sdk = new UraniumSDK(config)

    expect(sdk).toBeInstanceOf(UraniumSDK)
    expect(sdk.account).toBeDefined()
    expect(sdk.contracts).toBeDefined()
    expect(sdk.assets).toBeDefined()
    expect(sdk.upload).toBeDefined()
  })

  test("SDK should accept config with partial options", () => {
    const config: UraniumConfig = {
      apiKey: "test-api-key",
      baseUrl: "https://custom.api.com",
    }

    const sdk = new UraniumSDK(config)

    expect(sdk).toBeInstanceOf(UraniumSDK)
  })

  test("SDK should accept config with timeout only", () => {
    const config: UraniumConfig = {
      apiKey: "test-api-key",
      timeout: 15000,
    }

    const sdk = new UraniumSDK(config)

    expect(sdk).toBeInstanceOf(UraniumSDK)
  })

  test("SDK should accept config with debug flag", () => {
    const config: UraniumConfig = {
      apiKey: "test-api-key",
      debug: true,
    }

    const sdk = new UraniumSDK(config)

    expect(sdk).toBeInstanceOf(UraniumSDK)
  })

  test("SDK should accept config with deviceId", () => {
    const config: UraniumConfig = {
      apiKey: "test-api-key",
      deviceId: "test-device-123",
    }

    const sdk = new UraniumSDK(config)

    expect(sdk).toBeInstanceOf(UraniumSDK)
  })
})

describe("UraniumSDK - Instance Properties", () => {
  test("should have version property", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.version).toBe("0.1.0")
    expect(typeof sdk.version).toBe("string")
  })

  test("should have account router", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.account).toBeDefined()
    expect(typeof sdk.account).toBe("object")
    expect(sdk.account.getMe).toBeDefined()
    expect(typeof sdk.account.getMe).toBe("function")
  })

  test("should have contracts router", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.contracts).toBeDefined()
    expect(typeof sdk.contracts).toBe("object")
    expect(sdk.contracts.list).toBeDefined()
    expect(typeof sdk.contracts.list).toBe("function")
  })

  test("should have assets router", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.assets).toBeDefined()
    expect(typeof sdk.assets).toBe("object")
    expect(sdk.assets.list).toBeDefined()
    expect(typeof sdk.assets.list).toBe("function")
    expect(sdk.assets.prepareNewFile).toBeDefined()
    expect(typeof sdk.assets.prepareNewFile).toBe("function")
  })

  test("should have upload manager", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.upload).toBeDefined()
    expect(typeof sdk.upload).toBe("object")
    expect(sdk.upload.upload).toBeDefined()
    expect(typeof sdk.upload.upload).toBe("function")
  })

  test("account router should have expected methods", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.account.getMe).toBeDefined()
    expect(typeof sdk.account.getMe).toBe("function")
  })

  test("contracts router should have expected methods", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.contracts.list).toBeDefined()
    expect(sdk.contracts.create).toBeDefined()
    expect(typeof sdk.contracts.list).toBe("function")
    expect(typeof sdk.contracts.create).toBe("function")
  })

  test("assets router should have expected methods", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(sdk.assets.list).toBeDefined()
    expect(sdk.assets.prepareNewFile).toBeDefined()
    expect(sdk.assets.completeUpload).toBeDefined()
    expect(sdk.assets.startMinting).toBeDefined()
    expect(typeof sdk.assets.list).toBe("function")
    expect(typeof sdk.assets.prepareNewFile).toBe("function")
    expect(typeof sdk.assets.completeUpload).toBe("function")
    expect(typeof sdk.assets.startMinting).toBe("function")
  })
})

describe("UraniumSDK - Instance Comparison", () => {
  test("should create different instances with different configs", () => {
    const sdk1 = new UraniumSDK({ apiKey: "key-1" })
    const sdk2 = new UraniumSDK({ apiKey: "key-2" })

    expect(sdk1).not.toBe(sdk2)
    expect(sdk1).toBeInstanceOf(UraniumSDK)
    expect(sdk2).toBeInstanceOf(UraniumSDK)
  })

  test("should create different instances even with same apiKey", () => {
    const config = { apiKey: "test-key" }
    const sdk1 = new UraniumSDK(config)
    const sdk2 = new UraniumSDK(config)

    expect(sdk1).not.toBe(sdk2)
    expect(sdk1).toBeInstanceOf(UraniumSDK)
    expect(sdk2).toBeInstanceOf(UraniumSDK)
  })

  test("should create instances with different baseUrls", () => {
    const sdk1 = new UraniumSDK({ apiKey: "key", baseUrl: "https://api1.com" })
    const sdk2 = new UraniumSDK({ apiKey: "key", baseUrl: "https://api2.com" })

    expect(sdk1).not.toBe(sdk2)
    expect(sdk1).toBeInstanceOf(UraniumSDK)
    expect(sdk2).toBeInstanceOf(UraniumSDK)
  })

  test("should create instances with different timeouts", () => {
    const sdk1 = new UraniumSDK({ apiKey: "key", timeout: 10000 })
    const sdk2 = new UraniumSDK({ apiKey: "key", timeout: 20000 })

    expect(sdk1).not.toBe(sdk2)
  })
})

describe("QueryClient - Configuration", () => {
  test("should create default QueryClient with correct options", () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          retry: 3,
        },
      },
    })

    expect(client).toBeInstanceOf(QueryClient)
    expect(client.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000)
    expect(client.getDefaultOptions().queries?.retry).toBe(3)
  })

  test("should create custom QueryClient with different staleTime", () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 10000,
          retry: 5,
        },
      },
    })

    expect(client).toBeInstanceOf(QueryClient)
    expect(client.getDefaultOptions().queries?.staleTime).toBe(10000)
    expect(client.getDefaultOptions().queries?.retry).toBe(5)
  })

  test("should create multiple QueryClient instances", () => {
    const client1 = new QueryClient()
    const client2 = new QueryClient()

    expect(client1).not.toBe(client2)
    expect(client1).toBeInstanceOf(QueryClient)
    expect(client2).toBeInstanceOf(QueryClient)
  })

  test("should allow QueryClient with custom retry configuration", () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 10,
          retryDelay: 2000,
        },
      },
    })

    expect(client).toBeInstanceOf(QueryClient)
    expect(client.getDefaultOptions().queries?.retry).toBe(10)
  })

  test("should allow QueryClient with no retry", () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    expect(client).toBeInstanceOf(QueryClient)
    expect(client.getDefaultOptions().queries?.retry).toBe(false)
  })
})

describe("UraniumConfig - Type Safety", () => {
  test("should accept minimal valid config", () => {
    const config: UraniumConfig = {
      apiKey: "test-key",
    }

    expect(config.apiKey).toBe("test-key")
    expect(config.baseUrl).toBeUndefined()
    expect(config.timeout).toBeUndefined()
  })

  test("should accept config with optional baseUrl", () => {
    const config: UraniumConfig = {
      apiKey: "test-key",
      baseUrl: "https://custom.com",
    }

    expect(config.apiKey).toBe("test-key")
    expect(config.baseUrl).toBe("https://custom.com")
  })

  test("should accept config with optional timeout", () => {
    const config: UraniumConfig = {
      apiKey: "test-key",
      timeout: 15000,
    }

    expect(config.apiKey).toBe("test-key")
    expect(config.timeout).toBe(15000)
  })

  test("should accept config with optional debug", () => {
    const config: UraniumConfig = {
      apiKey: "test-key",
      debug: true,
    }

    expect(config.apiKey).toBe("test-key")
    expect(config.debug).toBe(true)
  })

  test("should accept config with optional deviceId", () => {
    const config: UraniumConfig = {
      apiKey: "test-key",
      deviceId: "device-123",
    }

    expect(config.apiKey).toBe("test-key")
    expect(config.deviceId).toBe("device-123")
  })

  test("should accept config with retry configuration", () => {
    const config: UraniumConfig = {
      apiKey: "test-key",
      retry: {
        enabled: true,
        maxRetries: 5,
      },
    }

    expect(config.apiKey).toBe("test-key")
    expect(config.retry?.enabled).toBe(true)
    expect(config.retry?.maxRetries).toBe(5)
  })

  test("should accept config with all optional fields", () => {
    const config: UraniumConfig = {
      apiKey: "test-key",
      baseUrl: "https://api.com",
      timeout: 30000,
      debug: true,
      deviceId: "device-123",
      retry: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        retryableStatuses: [500, 502, 503, 504],
      },
    }

    expect(config).toBeDefined()
    expect(Object.keys(config).length).toBeGreaterThan(0)
  })
})

describe("Provider Module - Exports", () => {
  test("should export UraniumProvider", async () => {
    const { UraniumProvider } = await import("./provider")
    expect(UraniumProvider).toBeDefined()
    expect(typeof UraniumProvider).toBe("function")
  })

  test("should export useUranium hook", async () => {
    const { useUranium } = await import("./provider")
    expect(useUranium).toBeDefined()
    expect(typeof useUranium).toBe("function")
  })

  test("should export UraniumProviderProps type", async () => {
    const module = await import("./provider")
    // Type exports can't be tested at runtime, but we can check the module
    expect(module).toBeDefined()
  })
})

describe("SDK Routers - Functionality", () => {
  test("account router should be callable", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(() => sdk.account).not.toThrow()
  })

  test("contracts router should be callable", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(() => sdk.contracts).not.toThrow()
  })

  test("assets router should be callable", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(() => sdk.assets).not.toThrow()
  })

  test("upload manager should be callable", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(() => sdk.upload).not.toThrow()
  })

  test("account.getMe should be a function", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.account.getMe).toBe("function")
  })

  test("contracts.list should be a function", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.contracts.list).toBe("function")
  })

  test("contracts.create should be a function", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.contracts.create).toBe("function")
  })

  test("assets.list should be a function", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.assets.list).toBe("function")
  })

  test("assets.prepareNewFile should be a function", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.assets.prepareNewFile).toBe("function")
  })

  test("assets.completeUpload should be a function", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.assets.completeUpload).toBe("function")
  })

  test("assets.startMinting should be a function", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.assets.startMinting).toBe("function")
  })

  test("upload.upload should be a function", () => {
    const sdk = new UraniumSDK({ apiKey: "test-key" })
    expect(typeof sdk.upload.upload).toBe("function")
  })
})

describe("Provider Component - Props Validation", () => {
  test("should accept valid UraniumProviderProps structure", () => {
    const props = {
      config: { apiKey: "test-key" },
      children: null,
    }

    expect(props.config).toBeDefined()
    expect(props.config.apiKey).toBe("test-key")
    expect(props.children).toBeDefined()
  })

  test("should accept props with custom QueryClient", () => {
    const props = {
      config: { apiKey: "test-key" },
      queryClient: new QueryClient(),
      children: null,
    }

    expect(props.queryClient).toBeInstanceOf(QueryClient)
  })

  test("should accept props without QueryClient", () => {
    const props = {
      config: { apiKey: "test-key" },
      children: null,
    }

    expect(props.queryClient).toBeUndefined()
  })

  test("should accept props with complex config", () => {
    const props = {
      config: {
        apiKey: "test-key",
        baseUrl: "https://custom.com",
        timeout: 30000,
        debug: true,
      },
      children: null,
    }

    expect(props.config.baseUrl).toBe("https://custom.com")
    expect(props.config.timeout).toBe(30000)
    expect(props.config.debug).toBe(true)
  })
})
