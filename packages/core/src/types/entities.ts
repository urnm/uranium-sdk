import type { AssetSVCStatus } from "./enums"

/**
 * Protobuf timestamp format used across Uranium API
 * Represents a point in time independent of any time zone or calendar
 */
export interface Timestamp {
  /** Seconds since Unix epoch (January 1, 1970 00:00:00 UTC) */
  seconds: number
  /** Non-negative fractions of a second at nanosecond resolution */
  nanos: number
}

/**
 * NFT Collection/Contract entity
 * Represents a smart contract that can mint NFTs
 */
export interface ContractEntity {
  /** Unique identifier for the contract */
  id: string
  /** ID of the user who created this contract */
  userId?: string | null
  /** Blockchain address of the deployed contract */
  address?: string | null
  /** Human-readable name of the collection */
  name: string
  /** Short symbol/ticker for the collection */
  symbol: string
  /** Collection type (CREATED, EXTERNAL, DEFAULT, SANDBOX) */
  type: string
  /** Current status of the collection (PENDING, COMPLETE) */
  status: string
  /** ERC standard type (ERC721 or ERC1155) */
  ercType: string
  /** Timestamp when the contract was created */
  createdAt: Timestamp | null
  /** Last token ID minted in this contract */
  lastTokenId: number
  /** Number of assets in this collection */
  count?: number | null
}

/**
 * NFT Asset entity
 * Represents a minted or in-progress NFT with full metadata
 */
export interface AssetEntity {
  /** Unique identifier for the asset */
  id: string
  /** Timestamp when the asset was created */
  createdAt?: Timestamp | null
  /** Timestamp when the asset was last updated */
  updatedAt?: Timestamp | null
  /** Timestamp when the asset was minted on-chain */
  mintedAt?: Timestamp | null
  /** Current number of editions available */
  currentEditions: number
  /** Number of editions locked in transfer */
  lockedEditions: number
  /** Whether the asset is finalized */
  isFinal: boolean
  /** Whether this is a Uranium-native asset */
  isUranium: boolean
  /** Whether the asset is currently being transferred */
  inTransfer: boolean
  /** Whether the asset content is encrypted */
  isEncrypted: boolean
  /** MIME type of encrypted content */
  encryptMimeType?: string | null
  /** Original MIME type of the source file */
  sourceMimeType: string
  /** Name of the collection this asset belongs to */
  collectionName: string
  /** Current minting/upload status (0-14) */
  status: AssetSVCStatus
  /** Numeric index of the current status */
  statusIndex: number
  /** Total number of editions for this asset */
  editions: number
  /** ERC type of the contract (ERC721 or ERC1155) */
  ercContractType: string
  /** Asset title */
  title: string
  /** URL-friendly slug for the asset */
  slug: string
  /** Name of the app used to create this asset */
  appName: string
  /** Version of the app used to create this asset */
  appVersion: string
  /** Name of the original author/creator */
  authorName: string
  /** Optional description of the asset */
  description?: string | null
  /** Source type (camera, gallery, upload) */
  source: string
  /** URL to the original source file */
  sourceUrl: string
  /** URL to the thumbnail image */
  thumbnailUrl?: string | null
  /** URL to the larger thumbnail image */
  thumbnailBigUrl?: string | null
  /** URL to the media file */
  mediaUrl?: string | null
  /** Type of media (image, video, gif) */
  mediaType: string
  /** Human-readable location where asset was created */
  location?: string | null
  /** Geographic coordinates (lat,lng) */
  locationCoords?: string | null
  /** Size of the media file in bytes */
  mediaSize: number
  /** Duration of video/audio in seconds */
  mediaDuration?: number | null
  /** Blockchain address of the contract */
  contractAddress?: string | null
  /** Token ID on the blockchain */
  tokenId?: string | null
  /** OpenSea marketplace URL for this asset */
  openSeaUrl?: string | null
  /** Blockchain address of the creator */
  creatorAddress: string
  /** Display name of the creator */
  creatorName: string
  /** Blockchain address of current owner */
  currentOwnerAddress: string
  /** Display name of current owner */
  currentOwnerName?: string | null
  /** Whether this asset has secret/private content */
  isHasSecret: boolean
  /** ID of the collection/contract */
  contractId: string
  /** ID of the uploaded file */
  fileId: string
  /** ID of the user who created this asset */
  userId?: string | null
  /** ID of the current owner */
  ownerId?: string | null
  /** ID of the pending new owner (during transfer) */
  newOwnerId?: string | null
  /** ID of the batch upload this asset belongs to */
  batchUploadId?: string | null
  /** Link to view encrypted content */
  encryptedViewLink?: string | null
  /** Hash of the slug for URL generation */
  slugHash: string
  /** Current transfer status */
  transferStatus?: string | null
  /** ID of active transfer */
  currentTransferId?: string | null
  /** Whether the asset is listed for sale */
  isListed: boolean
}

/**
 * User account entity
 * Represents an authenticated user in the Uranium system
 */
export interface UserEntity {
  /** Unique identifier for the user */
  userId: string
  /** Whether push notifications are enabled */
  enablePushNotifications: boolean
  /** User role (USER or ADMIN) */
  role: "USER" | "ADMIN"
  /** User's display nickname */
  nickname: string
  /** User's phone number */
  phoneNumber: string
  /** User's public key for blockchain operations */
  publicKey: string
  /** Verification ID for authentication */
  verificationId: string
}

/**
 * Mint progress information
 * Tracks the progress of chunked uploads during minting
 */
export interface MintProgressInfoEntity {
  /** Total number of chunks to upload */
  totalChunks?: number
  /** Number of chunks successfully uploaded */
  completedChunks?: number
}
