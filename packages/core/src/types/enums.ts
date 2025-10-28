/**
 * Asset minting status enum (numeric, 0-14)
 * Represents the 15 stages of NFT creation from upload to blockchain confirmation
 */
export enum AssetSVCStatus {
  /** Stage 0: Starting media upload to permanent storage */
  MEDIA_UPLOAD_INITIALIZING = 0,
  /** Stage 1: Uploading media content */
  MEDIA_UPLOADING = 1,
  /** Stage 2: Verifying media upload integrity */
  MEDIA_VERIFYING = 2,
  /** Stage 3: Confirming media upload */
  MEDIA_CONFIRMING = 3,
  /** Stage 4: Media upload confirmed and finalized */
  MEDIA_CONFIRMED = 4,
  /** Stage 5: Starting metadata upload */
  META_UPLOAD_INITIALIZING = 5,
  /** Stage 6: Uploading NFT metadata */
  META_UPLOADING = 6,
  /** Stage 7: Verifying metadata upload */
  META_VERIFYING = 7,
  /** Stage 8: Confirming metadata upload */
  META_CONFIRMING = 8,
  /** Stage 9: Metadata upload confirmed */
  META_CONFIRMED = 9,
  /** Stage 10: Preparing smart contract interaction */
  NFT_INITIALIZING = 10,
  /** Stage 11: Signing blockchain transaction */
  NFT_SIGNING = 11,
  /** Stage 12: Minting NFT on blockchain */
  NFT_MINTING = 12,
  /** Stage 13: NFT minted, awaiting confirmations */
  NFT_CONFIRMED = 13,
  /** Stage 14: All blockchain confirmations received */
  NFT_ALL_BLOCK_CONFIRMED = 14,
}

/**
 * Upload backend status enum (string-based)
 * Same stages as AssetSVCStatus but using string values
 */
export enum UploadStatus {
  MEDIA_UPLOAD_INITIALIZING = "MEDIA_UPLOAD_INITIALIZING",
  MEDIA_UPLOADING = "MEDIA_UPLOADING",
  MEDIA_VERIFYING = "MEDIA_VERIFYING",
  MEDIA_CONFIRMING = "MEDIA_CONFIRMING",
  MEDIA_CONFIRMED = "MEDIA_CONFIRMED",
  META_UPLOAD_INITIALIZING = "META_UPLOAD_INITIALIZING",
  META_UPLOADING = "META_UPLOADING",
  META_VERIFYING = "META_VERIFYING",
  META_CONFIRMING = "META_CONFIRMING",
  META_CONFIRMED = "META_CONFIRMED",
  NFT_INITIALIZING = "NFT_INITIALIZING",
  NFT_SIGNING = "NFT_SIGNING",
  NFT_MINTING = "NFT_MINTING",
  NFT_CONFIRMED = "NFT_CONFIRMED",
  NFT_ALL_BLOCK_CONFIRMED = "NFT_ALL_BLOCK_CONFIRMED",
}

/**
 * Client-side upload stage enum
 * Represents the actual client-side operations during upload flow
 * These stages reflect local operations and API calls, not backend asset status
 */
export enum ClientUploadStage {
  /** Stage 1 (0-5%): Validating file size, type, and upload options */
  VALIDATING = "VALIDATING",
  /** Stage 2 (5-12%): Calling prepareNewFile API to get presigned S3 URLs */
  PREPARING = "PREPARING",
  /** Stage 3 (12-18%): Converting file to ArrayBuffer and splitting into chunks */
  PROCESSING = "PROCESSING",
  /** Stage 4 (18-75%): Uploading chunks to S3 with retry logic */
  UPLOADING = "UPLOADING",
  /** Stage 5 (75-85%): Calling completeUpload API (S3 finalization + thumbnail generation) */
  FINALIZING = "FINALIZING",
  /** Stage 6 (85-99%): Calling startMinting API to submit NFT to mint queue */
  REQUESTING_MINT = "REQUESTING_MINT",
  /** Stage 7 (100%): Upload complete, NFT submitted to mint queue */
  DONE = "DONE",
}

/**
 * File type enum
 * Categorizes uploaded media by content type
 */
export enum FileType {
  /** Static image file (PNG, JPG, etc.) */
  Image = "image",
  /** Video file (MP4, MOV, etc.) */
  Video = "video",
  /** Animated GIF */
  Gif = "gif",
  /** Unknown or unsupported file type */
  Unknown = "unknown",
}

/**
 * File source enum
 * Indicates where the file originated
 */
export enum FileSource {
  /** Captured from device camera */
  Camera = "camera",
  /** Selected from device gallery */
  Gallery = "gallery",
  /** Uploaded from file system */
  Upload = "upload",
}

/**
 * Metadata attribute type enum
 * Defines the data type of NFT metadata attributes
 */
export enum Metadata_AttributeType {
  /** String/text value */
  STRING = 0,
  /** Numeric value */
  NUMBER = 1,
  /** Boolean value */
  BOOLEAN = 2,
  /** Unrecognized type (for error handling) */
  UNRECOGNIZED = -1,
}

/**
 * User role enum
 * Defines permission levels for users
 */
export enum UserRole {
  /** Standard user with basic permissions */
  USER = "USER",
  /** Administrator with elevated permissions */
  ADMIN = "ADMIN",
}

/**
 * Collection type enum
 * Categorizes collections by their origin
 */
export enum CollectionType {
  /** User-created collection */
  CREATED = "CREATED",
  /** External/imported collection */
  EXTERNAL = "EXTERNAL",
  /** Default system collection */
  DEFAULT = "DEFAULT",
  /** Sandbox/test collection */
  SANDBOX = "SANDBOX",
}

/**
 * Collection status enum
 * Tracks the deployment state of collections
 */
export enum CollectionStatus {
  /** Collection is being deployed */
  PENDING = "PENDING",
  /** Collection is fully deployed and ready */
  COMPLETE = "COMPLETE",
}

/**
 * ERC token standard enum
 * Supported Ethereum token standards
 */
export enum ERCType {
  /** ERC-721: Non-fungible tokens (single edition per token) */
  ERC721 = "ERC721",
  /** ERC-1155: Multi-token standard (supports multiple editions) */
  ERC1155 = "ERC1155",
}

/**
 * Status display text mapping
 * Maps AssetSVCStatus enum values to user-friendly messages
 */
export const ASSET_STATUS_TEXT: Record<AssetSVCStatus, string> = {
  [AssetSVCStatus.MEDIA_UPLOAD_INITIALIZING]: "Initializing permanentizer...",
  [AssetSVCStatus.MEDIA_UPLOADING]: "Uploading media...",
  [AssetSVCStatus.MEDIA_VERIFYING]: "Verifying upload...",
  [AssetSVCStatus.MEDIA_CONFIRMING]: "Confirming...",
  [AssetSVCStatus.MEDIA_CONFIRMED]: "Irreversible upload finalized.",
  [AssetSVCStatus.META_UPLOAD_INITIALIZING]: "Initializing permanentizer...",
  [AssetSVCStatus.META_UPLOADING]: "Uploading metadata...",
  [AssetSVCStatus.META_VERIFYING]: "Verifying upload...",
  [AssetSVCStatus.META_CONFIRMING]: "Confirming...",
  [AssetSVCStatus.META_CONFIRMED]: "Irreversible upload finalized.",
  [AssetSVCStatus.NFT_INITIALIZING]: "Mapping smart-contract methods...",
  [AssetSVCStatus.NFT_SIGNING]: "Signing Transaction...",
  [AssetSVCStatus.NFT_MINTING]: "Minting NFT...",
  [AssetSVCStatus.NFT_CONFIRMED]: "NFT minted.",
  [AssetSVCStatus.NFT_ALL_BLOCK_CONFIRMED]: "All blocks confirmed.",
}

/**
 * Client upload stage display text mapping
 * Maps ClientUploadStage enum values to user-friendly messages
 */
export const CLIENT_UPLOAD_STAGE_TEXT: Record<ClientUploadStage, string> = {
  [ClientUploadStage.VALIDATING]: "Validating file...",
  [ClientUploadStage.PREPARING]: "Preparing upload...",
  [ClientUploadStage.PROCESSING]: "Processing file...",
  [ClientUploadStage.UPLOADING]: "Uploading...",
  [ClientUploadStage.FINALIZING]: "Finalizing upload...",
  [ClientUploadStage.REQUESTING_MINT]: "Requesting mint...",
  [ClientUploadStage.DONE]: "Complete!",
}

/**
 * Helper function to convert AssetSVCStatus to UploadStatus
 */
export function transformSvcStatusToDbStatus(
  status: AssetSVCStatus,
): UploadStatus {
  const statusKey = AssetSVCStatus[status]
  if (!statusKey || statusKey === "UNRECOGNIZED") {
    throw new Error("UNRECOGNIZED_ASSET_STATUS")
  }
  return UploadStatus[statusKey as keyof typeof UploadStatus]
}

/**
 * Helper function to get display text for asset status
 */
export function getAssetStatusText(status: AssetSVCStatus): string {
  return ASSET_STATUS_TEXT[status] || "Unknown status"
}

/**
 * Helper function to get display text for client upload stage
 */
export function getClientUploadStageText(stage: ClientUploadStage): string {
  return CLIENT_UPLOAD_STAGE_TEXT[stage] || "Unknown stage"
}

/**
 * Helper function to check if asset is fully minted
 */
export function isAssetMinted(status: AssetSVCStatus): boolean {
  return (
    status === AssetSVCStatus.NFT_CONFIRMED ||
    status === AssetSVCStatus.NFT_ALL_BLOCK_CONFIRMED
  )
}
