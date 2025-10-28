import { describe, expect, test } from "bun:test"
import type { UraniumConfig } from "../types/config"
import {
  createApiClient,
  createApiRouters,
  createApiRoutersFromClient,
} from "./index"

describe("Client Index", () => {
  describe("createApiRouters", () => {
    test("should create all three API routers from config", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
      }

      const routers = createApiRouters(config)

      expect(routers).toBeDefined()
      expect(routers.account).toBeDefined()
      expect(routers.contracts).toBeDefined()
      expect(routers.assets).toBeDefined()

      // Verify each router has expected methods
      expect(typeof routers.account.getMe).toBe("function")
      expect(typeof routers.contracts.list).toBe("function")
      expect(typeof routers.contracts.create).toBe("function")
      expect(typeof routers.assets.list).toBe("function")
      expect(typeof routers.assets.prepareNewFile).toBe("function")
      expect(typeof routers.assets.completeUpload).toBe("function")
      expect(typeof routers.assets.startMinting).toBe("function")
    })

    test("should create routers with custom config", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
        baseUrl: "https://custom-api.example.com",
        timeout: 30000,
        debug: true,
      }

      const routers = createApiRouters(config)

      expect(routers).toBeDefined()
      expect(routers.account).toBeDefined()
      expect(routers.contracts).toBeDefined()
      expect(routers.assets).toBeDefined()
    })

    test("should throw error when API key is missing", () => {
      expect(() => {
        createApiRouters({} as UraniumConfig)
      }).toThrow("API key is required")
    })
  })

  describe("createApiRoutersFromClient", () => {
    test("should create all routers from existing client", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
      }

      const client = createApiClient(config)
      const routers = createApiRoutersFromClient(client)

      expect(routers).toBeDefined()
      expect(routers.account).toBeDefined()
      expect(routers.contracts).toBeDefined()
      expect(routers.assets).toBeDefined()
    })

    test("should create functional routers", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
      }

      const client = createApiClient(config)
      const routers = createApiRoutersFromClient(client)

      // Verify router methods are callable
      expect(typeof routers.account.getMe).toBe("function")
      expect(typeof routers.contracts.list).toBe("function")
      expect(typeof routers.contracts.create).toBe("function")
      expect(typeof routers.assets.list).toBe("function")
      expect(typeof routers.assets.prepareNewFile).toBe("function")
      expect(typeof routers.assets.completeUpload).toBe("function")
      expect(typeof routers.assets.startMinting).toBe("function")
    })

    test("should share the same client instance across routers", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
      }

      const client = createApiClient(config)
      const routers = createApiRoutersFromClient(client)

      // All routers should be using the same base client configuration
      expect(routers).toBeDefined()
      expect(routers.account).toBeDefined()
      expect(routers.contracts).toBeDefined()
      expect(routers.assets).toBeDefined()
    })
  })

  describe("Integration", () => {
    test("should create routers with both methods and they should be equivalent", () => {
      const config: UraniumConfig = {
        apiKey: "test-api-key",
      }

      const routers1 = createApiRouters(config)
      const client = createApiClient(config)
      const routers2 = createApiRoutersFromClient(client)

      // Both methods should create similar router structures
      expect(typeof routers1.account.getMe).toBe("function")
      expect(typeof routers2.account.getMe).toBe("function")

      expect(typeof routers1.contracts.list).toBe("function")
      expect(typeof routers2.contracts.list).toBe("function")

      expect(typeof routers1.assets.list).toBe("function")
      expect(typeof routers2.assets.list).toBe("function")

      expect(typeof routers1.assets.prepareNewFile).toBe("function")
      expect(typeof routers2.assets.prepareNewFile).toBe("function")
    })
  })
})
