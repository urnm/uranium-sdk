import type { AxiosInstance } from "axios"
import type { UraniumConfig } from "../types/config"
import { type AccountRouter, accountRouter } from "./account"
import { type AssetsRouter, assetsRouter } from "./assets"
import { createApiClient } from "./base"
import { type ContractsRouter, contractsRouter } from "./contracts"

export type { AxiosInstance } from "axios"
export { accountRouter } from "./account"
export { assetsRouter } from "./assets"
export { createApiClient, createRequest } from "./base"
export { contractsRouter } from "./contracts"
export { DeviceManager } from "./device"
export { withRetry } from "./retry"
export {
  extractSignal,
  generateDeviceId,
  getErrorMessage,
  isAxiosError,
  shouldRetry,
} from "./utils"
export type { AccountRouter, ContractsRouter, AssetsRouter }
export type { RequestOptions } from "./types"

/**
 * API routers collection
 */
export interface ApiRouters {
  account: AccountRouter
  contracts: ContractsRouter
  assets: AssetsRouter
}

/**
 * Create all API routers from a configuration
 * @param config - Uranium SDK configuration
 * @returns Object containing all API routers
 */
export function createApiRouters(config: UraniumConfig): ApiRouters {
  const client = createApiClient(config)
  return createApiRoutersFromClient(client)
}

/**
 * Create all API routers from an existing Axios client
 * @param client - Configured Axios instance
 * @returns Object containing all API routers
 */
export function createApiRoutersFromClient(client: AxiosInstance): ApiRouters {
  return {
    account: accountRouter(client),
    contracts: contractsRouter(client),
    assets: assetsRouter(client),
  }
}
