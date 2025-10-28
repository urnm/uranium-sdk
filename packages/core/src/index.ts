/**
 * @uranium/sdk - Core SDK for Uranium platform
 *
 * This is the main entry point for the Uranium SDK.
 * It provides core functionality for interacting with the Uranium platform.
 */

import { type AccountRouter, accountRouter } from "./client/account"
import { type AssetsRouter, assetsRouter } from "./client/assets"
import { createApiClient } from "./client/base"
import { type ContractsRouter, contractsRouter } from "./client/contracts"
import { generateDeviceId } from "./client/utils"
import type { UraniumConfig } from "./types/config"
import { UploadManager } from "./upload/upload-manager"

export const SDK_VERSION = "0.1.0"

// Export router types
export type {
  AccountRouter,
  ApiRouters,
  AssetsRouter,
  ContractsRouter,
  RequestOptions,
} from "./client"
// Export individual routers and utilities for advanced usage
export {
  accountRouter,
  assetsRouter,
  contractsRouter,
  createApiClient,
  createApiRouters,
  createApiRoutersFromClient,
  createRequest,
  DeviceManager,
  extractSignal,
  generateDeviceId,
  getErrorMessage,
  isAxiosError,
  shouldRetry,
  withRetry,
} from "./client"
// Export all types
export type * from "./types"
// Export enums and constants as values (not just types)
export {
  ASSET_STATUS_TEXT,
  AssetSVCStatus,
  CLIENT_UPLOAD_STAGE_TEXT,
  ClientUploadStage,
  CollectionStatus,
  CollectionType,
  ERCType,
  FileSource,
  FileType,
  getAssetStatusText,
  getClientUploadStageText,
  isAssetMinted,
  Metadata_AttributeType,
  transformSvcStatusToDbStatus,
  UploadStatus,
  UserRole,
} from "./types"
// Export upload module
export * from "./upload"
// Export validation schemas
export * from "./validation/schemas"

/**
 * Main Uranium SDK class
 *
 * @example
 * ```typescript
 * const sdk = new UraniumSDK({ apiKey: "your-api-key" });
 *
 * // Access routers
 * const user = await sdk.account.getMe("device-id");
 * const collections = await sdk.contracts.list();
 * const assets = await sdk.assets.list({});
 *
 * // Upload and mint NFTs
 * const asset = await sdk.upload.upload(file, {
 *   contractId: "contract-id",
 *   metadata: {
 *     title: "My NFT",
 *   },
 * });
 * ```
 */
export class UraniumSDK {
  /** SDK version */
  public readonly version = SDK_VERSION

  /** Account API router */
  public readonly account: AccountRouter

  /** Contracts API router */
  public readonly contracts: ContractsRouter

  /** Assets API router */
  public readonly assets: AssetsRouter

  /** Upload manager for file uploads and NFT minting */
  public readonly upload: UploadManager

  constructor(config: UraniumConfig) {
    if (!config.apiKey) {
      throw new Error(
        "API key is required. Get your API key from: https://portal.uranium.pro/dashboard/profile/api-keys",
      )
    }

    const client = createApiClient(config)

    // Initialize routers
    this.account = accountRouter(client)
    this.contracts = contractsRouter(client)
    this.assets = assetsRouter(client)

    // Initialize upload manager
    this.upload = new UploadManager(this.assets, generateDeviceId())
  }
}

// Default export
export default UraniumSDK
