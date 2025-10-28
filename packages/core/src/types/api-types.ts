import type {
  AssetEntity,
  ContractEntity,
  MintProgressInfoEntity,
  Timestamp,
  UserEntity,
} from "./entities"
import type {
  ERCType,
  FileSource,
  FileType,
  Metadata_AttributeType,
  UploadStatus,
} from "./enums"

// Re-export entities and enums for convenience
export type {
  ContractEntity,
  AssetEntity,
  UserEntity,
  Timestamp,
  MintProgressInfoEntity,
}
export type {
  FileType,
  FileSource,
  Metadata_AttributeType,
  UploadStatus,
  ERCType,
}

/**
 * Base API response structure
 * All API responses follow this pattern
 */
export interface BaseApiResponse {
  /** Response status (typically "ok" or "error") */
  status: string
  /** Error code if status is "error" */
  errorCode?: string | null
}

// ============================================================================
// Account API Types
// ============================================================================

/**
 * Request to get current authenticated user
 */
export interface GetCurrentUserRequestDto {
  /** Device identifier for the request */
  deviceId: string
}

/**
 * Successful user data response
 */
export interface GetCurrentUserResponse_OK {
  /** Unique user identifier */
  userId: string
  /** Whether push notifications are enabled */
  enablePushNotifications: boolean
  /** User role (USER or ADMIN) */
  role: "USER" | "ADMIN"
  /** User's display name */
  nickname: string
  /** User's phone number */
  phoneNumber: string
  /** User's public key for blockchain operations */
  publicKey: string
  /** Verification ID for authentication */
  verificationId: string
}

/**
 * Response for getting current user
 */
export interface GetCurrentUserResponseDto extends BaseApiResponse {
  /** User data if request was successful */
  ok?: GetCurrentUserResponse_OK | null
}

// ============================================================================
// Contracts API Types
// ============================================================================

/**
 * Request to create a new NFT collection/contract
 */
export interface CreateUserContractRequestDto {
  /** Name of the collection (3-30 characters) */
  name: string
  /** Symbol/ticker for the collection (3-30 characters) */
  symbol: string
  /** ERC standard to use */
  type: ERCType | "ERC721" | "ERC1155"
}

/**
 * Response for creating a contract
 */
export interface CreateUserContractResponseDto extends BaseApiResponse {
  /** Created contract data if successful */
  data?: ContractEntity | null
}

/**
 * Response for listing user's contracts
 */
export interface UserContractsResponseDto extends BaseApiResponse {
  /** Array of user's contracts/collections */
  data: ContractEntity[]
}

// ============================================================================
// Assets API Types
// ============================================================================

/**
 * Request to find/filter user's assets
 */
export interface FindUserAssetsRequestDto {
  /** Filter by specific collection ID */
  contractId?: string
  /** Number of items per page (default 20, max 100) */
  pageSize?: number
  /** Page number (1-based) */
  page?: number
  /** Field to sort by (e.g., "createdAt", "title") */
  sortBy?: string
  /** Sort order */
  order?: "desc" | "asc"
  /** Text search filter for asset title */
  quickFilter?: string
}

/**
 * Pagination metadata for asset listings
 */
export interface FindUserAssetsMetadata {
  /** Total number of assets matching the filter */
  total: number
  /** Current page number */
  page: number
  /** Number of items per page */
  pageSize: number
  /** Total number of pages */
  countPages: number
}

/**
 * Successful asset listing data
 */
export interface FindUserAssetsResponseData {
  /** Array of assets */
  data: AssetEntity[]
  /** Pagination metadata */
  meta: FindUserAssetsMetadata | null
}

/**
 * Response for finding user's assets
 */
export interface FindUserAssetsResponseDto extends BaseApiResponse {
  /** Asset listing data if successful */
  ok?: FindUserAssetsResponseData | null
}

// ============================================================================
// File Upload API Types
// ============================================================================

/**
 * Request to prepare a new file upload
 * Initiates multipart upload and returns presigned URLs
 */
export interface PrepareNewFileRequestDto {
  /** Device identifier */
  deviceId: string
  /** JSON-stringified metadata for the file */
  metadata: string
  /** Type of file being uploaded */
  type: FileType
  /** Source of the file */
  source: FileSource
  /** Size of the file in bytes */
  fileSize: number
  /** Whether the file content should be private/encrypted */
  isPrivate?: boolean | null | undefined
}

/**
 * Presigned URL for uploading a single part
 */
export interface UploadPartUrl {
  /** Part number (1-based) */
  partNumber: number
  /** Presigned S3 URL for uploading this part */
  url: string
}

/**
 * Response for preparing a file upload
 */
export interface PrepareNewFileResponseDto extends BaseApiResponse {
  /** Unique file identifier */
  fileId: string
  /** Upload session identifier */
  fileUploadId: string
  /** Number of chunks/parts for multipart upload */
  chunkCount: number
  /** Size of each chunk in bytes */
  chunkSize: number
  /** Array of presigned URLs for each part */
  uploadPartUrls: UploadPartUrl[]
}

/**
 * Information about a completed upload chunk
 */
export interface CompleteUploadChunkRequest {
  /** Part number that was uploaded */
  partNumber: number
  /** ETag returned by S3 after upload */
  eTag: string
}

/**
 * Request to complete a multipart upload
 */
export interface CompleteUploadRequestDto {
  /** File identifier from PrepareNewFileResponseDto */
  fileId: string
  /** MIME type of the uploaded file */
  mimeType: string
  /** Array of uploaded chunks with their ETags */
  chunks: CompleteUploadChunkRequest[]
  /** Whether to skip thumbnail generation */
  disableThumbnail?: boolean | null | undefined
}

/**
 * Response for completing an upload
 */
export interface CompleteUploadResponseDto extends BaseApiResponse {}

// ============================================================================
// Minting API Types
// ============================================================================

/**
 * NFT metadata attribute
 */
export interface Metadata_AttributeDto {
  /** Attribute key/name */
  key: string
  /** Attribute value (stringified for all types) */
  value: string
  /** Data type of the attribute */
  type: Metadata_AttributeType
}

/**
 * NFT metadata structure
 */
export interface MetadataDto {
  /** Array of custom attributes */
  attributes: Metadata_AttributeDto[]
}

/**
 * Request to start minting an NFT
 */
export interface StartMintingRequestDto {
  /** File ID from upload process */
  fileId: string
  /** Number of editions to mint (for ERC1155) */
  editions?: number | undefined | null
  /** Order in batch minting */
  batchOrder?: number | undefined | null
  /** Collection/contract ID to mint into */
  contractId?: string | undefined | null
  /** Batch upload ID if part of bulk mint */
  batchId?: string | undefined | null
  /** Whether to make the asset discoverable by community */
  shareWithCommunity?: boolean | undefined | null
  /** Whether to encrypt the content */
  isEncrypted?: boolean | undefined | null
  /** MIME type for encrypted content */
  encryptMimeType?: string | undefined | null
  /** NFT metadata with custom attributes */
  metadata: MetadataDto
}

/**
 * Minting response data
 */
export interface StartMintingResponseDataDto {
  /** Current status of the minting process */
  status: UploadStatus
  /** Progress information for chunked uploads */
  mintProgressInfo: MintProgressInfoEntity
  /** Contract address (available after minting) */
  contractAddress?: string | null
  /** Token ID (available after minting) */
  tokenId?: string | null
}

/**
 * Response for starting the minting process
 */
export interface StartMintingResponseDto extends BaseApiResponse {
  /** Minting data if successful */
  data?: StartMintingResponseDataDto | null
}
