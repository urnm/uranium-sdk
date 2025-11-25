/**
 * Uranium SDK Type System
 *
 * Comprehensive TypeScript types for the Uranium NFT platform.
 * This module provides full type safety for all API interactions,
 * entity models, and utility functions.
 *
 * @module @uranium/sdk/types
 */

// ============================================================================
// Re-export shared types from @uranium/types
// ============================================================================

export {
  AuthenticationError as AuthenticationErrorBase,
  isRetryableError as isRetryableErrorBase,
  isUraniumError as isUraniumErrorBase,
  NetworkError as NetworkErrorBase,
  NotFoundError as NotFoundErrorBase,
  UploadError as UploadErrorBase,
  UraniumError as UraniumErrorBase,
  ValidationError as ValidationErrorBase,
} from "@uranium/types"

// ============================================================================
// Configuration Types
// ============================================================================

export type {
  ResolvedUraniumConfig,
  RetryConfig,
  UraniumConfig,
} from "./config"

export {
  DEFAULT_CONFIG,
  DEFAULT_RETRY_CONFIG,
} from "./config"

// ============================================================================
// Entity Types
// ============================================================================

export type {
  AssetEntity,
  ContractEntity,
  MintProgressInfoEntity,
  Timestamp,
  UserEntity,
} from "./entities"

// ============================================================================
// Enums and Constants
// ============================================================================

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
} from "./enums"

// ============================================================================
// API Request/Response Types
// ============================================================================

export type {
  BaseApiResponse,
  CompleteUploadChunkRequest,
  CompleteUploadRequestDto,
  CompleteUploadResponseDto,
  // Contracts API
  CreateUserContractRequestDto,
  CreateUserContractResponseDto,
  // Frame Extraction API
  ExtractFrameSyncRequestDto,
  ExtractFrameSyncResponseDto,
  FindUserAssetsMetadata,
  // Assets API
  FindUserAssetsRequestDto,
  FindUserAssetsResponseData,
  FindUserAssetsResponseDto,
  // Account API
  GetCurrentUserRequestDto,
  GetCurrentUserResponse_OK,
  GetCurrentUserResponseDto,
  // Minting API
  Metadata_AttributeDto,
  MetadataDto,
  // Upload API
  PrepareNewFileRequestDto,
  PrepareNewFileResponseDto,
  StartMintingRequestDto,
  StartMintingResponseDataDto,
  StartMintingResponseDto,
  UploadPartUrl,
  UserContractsResponseDto,
} from "./api-types"

// ============================================================================
// Metadata Types
// ============================================================================

export type {
  CreateAssetMetadata,
  CustomMetadataAttribute,
  MetadataAttribute,
  MetadataAttributeArray,
  PartialMetadata,
  PredefinedAttribute,
} from "./metadata"

export {
  convertMetadataToDto,
  createMinimalMetadata,
  isPredefinedAttribute,
  mergeMetadata,
  validateMetadata,
} from "./metadata"

// ============================================================================
// Error Types
// ============================================================================

export {
  AuthenticationError,
  BlockchainError,
  createErrorFromResponse,
  ERROR_CODE_TO_STATUS,
  ErrorCode,
  isRetryableError,
  isUraniumError,
  LimitExceededError,
  MintingError,
  NetworkError,
  NotFoundError,
  UploadError,
  UraniumError,
  ValidationError,
} from "./errors"

// ============================================================================
// Pagination Types
// ============================================================================

export type {
  CursorPaginatedResponse,
  CursorPaginationMeta,
  CursorPaginationParams,
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
} from "./pagination"

export {
  calculatePaginationMeta,
  createEmptyPaginatedResponse,
  DEFAULT_PAGINATION,
  getNextPage,
  getPageRange,
  getPreviousPage,
  hasNextPage,
  hasPreviousPage,
  MAX_PAGE_SIZE,
  normalizePaginationParams,
  validatePaginationParams,
} from "./pagination"

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Makes all properties of T deeply optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Makes specific keys K of type T required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Makes specific keys K of type T optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>

/**
 * Extracts all keys from T that have values of type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T]

/**
 * Makes all properties of T deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Extracts the item type from an array type
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never

/**
 * Represents a value that may be a Promise
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Represents a value that may be null or undefined
 */
export type Nullable<T> = T | null | undefined

/**
 * Exclude null and undefined from T
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Function type for API calls
 */
export type ApiFunction<TParams = unknown, TResult = unknown> = (
  params?: TParams,
) => Promise<TResult>

/**
 * Configuration options with defaults
 */
export type WithDefaults<T, D extends Partial<T>> = T & D
