import { z } from "zod"

/**
 * Regex patterns for validation (from MCP constants)
 */
export const smartContractNameRegex =
  // eslint-disable-next-line no-useless-escape
  /^(?=[a-zA-Z0-9._\-[\]]{3,30}$)(?!.*[_.\-[\]]{2})[^_.\-[\]].*[^_.\-[\]]$/gm
export const smartContractSymbolRegex =
  /^(?=[a-zA-Z0-9_]{3,30}$)(?!.*[_]{2})[^_].*[^_]$/gm

/**
 * Schema for NFT collection/contract name
 * 3-30 characters, letters, numbers, and special chars: . _ - [ ]
 * No consecutive special chars, cannot start or end with special chars
 */
export const contractNameSchema = z
  .string()
  .min(3, "Contract name must be at least 3 characters")
  .max(30, "Contract name must not exceed 30 characters")
  .regex(
    smartContractNameRegex,
    "Contract name must be 3-30 characters, can contain letters, numbers, and [_.-[]] symbols, but cannot have consecutive special characters or start/end with them",
  )

/**
 * Schema for NFT collection/contract symbol
 * 3-30 characters, letters, numbers, and underscores
 * No consecutive underscores, cannot start or end with underscore
 */
export const contractSymbolSchema = z
  .string()
  .min(3, "Contract symbol must be at least 3 characters")
  .max(30, "Contract symbol must not exceed 30 characters")
  .regex(
    smartContractSymbolRegex,
    "Contract symbol must be 3-30 characters, can contain letters, numbers, and underscores, but cannot have consecutive underscores or start/end with them",
  )

/**
 * Schema for asset title
 * 3-120 characters
 */
export const assetTitleSchema = z
  .string()
  .min(3, "Asset title must be at least 3 characters")
  .max(120, "Asset title must not exceed 120 characters")

/**
 * Schema for asset description (optional)
 * Maximum 255 characters
 */
export const assetDescriptionSchema = z
  .string()
  .max(255, "Asset description must not exceed 255 characters")
  .optional()
  .nullable()

/**
 * Schema for asset location (optional)
 * Maximum 100 characters
 */
export const assetLocationSchema = z
  .string()
  .max(100, "Asset location must not exceed 100 characters")
  .optional()
  .nullable()

/**
 * Schema for number of editions (ERC1155)
 * Integer between 1 and 1000
 */
export const editionsSchema = z
  .number()
  .int("Editions must be an integer")
  .min(1, "Editions must be at least 1")
  .max(1000, "Editions must not exceed 1000")

/**
 * Schema for ERC type
 */
export const ercTypeSchema = z.enum(["ERC721", "ERC1155"], {
  message: "Contract type must be either ERC721 or ERC1155",
})

/**
 * Composite schema for creating a contract
 */
export const createContractSchema = z.object({
  name: contractNameSchema,
  symbol: contractSymbolSchema,
  type: ercTypeSchema,
})

/**
 * Schema for metadata attributes
 */
export const metadataAttributeSchema = z.object({
  key: z.string().min(1, "Attribute key is required"),
  value: z.string(),
  type: z.number(), // Metadata_AttributeType enum
})

/**
 * Schema for NFT metadata
 */
export const metadataSchema = z.object({
  attributes: z.array(metadataAttributeSchema),
})

/**
 * Composite schema for uploading asset metadata
 */
export const uploadMetadataSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  contractId: z
    .string()
    .min(1, "Contract ID is required")
    .optional()
    .nullable(),
  editions: editionsSchema.optional().nullable(),
  shareWithCommunity: z.boolean().optional().nullable(),
  isEncrypted: z.boolean().optional().nullable(),
  encryptMimeType: z.string().optional().nullable(),
  metadata: metadataSchema,
  batchOrder: z.number().int().optional().nullable(),
  batchId: z.string().optional().nullable(),
})

/**
 * Schema for device ID
 * Must be a non-empty string
 */
export const deviceIdSchema = z.string().min(1, "Device ID is required")

/**
 * Schema for file ID
 * Must be a non-empty string
 */
export const fileIdSchema = z.string().min(1, "File ID is required")

/**
 * Schema for contract ID (optional/nullable)
 * Must be a non-empty string when provided
 */
export const contractIdSchema = z
  .string()
  .min(1, "Contract ID must not be empty")
  .optional()
  .nullable()

/**
 * Maximum file size: 100 MB
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024

/**
 * Schema for file size
 * Must be a positive number, maximum 100 MB
 */
export const fileSizeSchema = z
  .number()
  .positive("File size must be greater than 0")
  .max(
    MAX_FILE_SIZE,
    `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
  )

/**
 * Schema for MIME type
 * Must be a non-empty string with format "type/subtype"
 */
export const mimeTypeSchema = z
  .string()
  .min(1, "MIME type is required")
  .regex(/^[\w-]+\/[\w-+.]+$/, "Invalid MIME type format")

/**
 * Schema for ETag
 * Must be a non-empty string
 */
export const eTagSchema = z.string().min(1, "ETag is required")

/**
 * Schema for upload chunk
 * Contains part number and ETag from S3
 */
export const chunkSchema = z.object({
  partNumber: z.number().int().positive("Part number must be positive"),
  eTag: eTagSchema,
})

/**
 * Schema for FileType enum
 * Accepted values: "image", "video", "gif"
 */
export const fileTypeSchema = z.enum(["image", "video", "gif"], {
  message: "File type must be one of: image, video, gif",
})

/**
 * Schema for FileSource enum
 * Accepted values: "camera", "gallery", "upload"
 */
export const fileSourceSchema = z.enum(["camera", "gallery", "upload"], {
  message: "File source must be one of: camera, gallery, upload",
})

/**
 * Composite schema for preparing a new file upload
 */
export const prepareNewFileSchema = z.object({
  deviceId: deviceIdSchema,
  metadata: z.string().min(1, "Metadata is required"),
  type: fileTypeSchema,
  source: fileSourceSchema,
  fileSize: fileSizeSchema,
  isPrivate: z.boolean().optional().nullable(),
})

/**
 * Composite schema for completing an upload
 */
export const completeUploadSchema = z.object({
  fileId: fileIdSchema,
  mimeType: mimeTypeSchema,
  chunks: z.array(chunkSchema).min(1, "At least one chunk is required"),
  disableThumbnail: z.boolean().optional().nullable(),
})

/**
 * Composite schema for starting the minting process
 */
export const startMintingSchema = z.object({
  fileId: fileIdSchema,
  editions: editionsSchema.optional().nullable(),
  batchOrder: z.number().int().optional().nullable(),
  contractId: contractIdSchema,
  batchId: z.string().optional().nullable(),
  shareWithCommunity: z.boolean().optional().nullable(),
  isEncrypted: z.boolean().optional().nullable(),
  encryptMimeType: z.string().optional().nullable(),
  metadata: metadataSchema,
})

/**
 * Schema for time in seconds for frame extraction
 * Must be a non-negative number
 */
export const timeInSecondsSchema = z
  .number()
  .nonnegative("Time must be 0 or greater")

/**
 * Composite schema for extracting a frame from a video
 */
export const extractFrameSyncSchema = z.object({
  fileId: fileIdSchema,
  timeInSeconds: timeInSecondsSchema,
})

/**
 * Type exports for convenience
 */
export type CreateContractInput = z.infer<typeof createContractSchema>
export type UploadMetadataInput = z.infer<typeof uploadMetadataSchema>
export type MetadataInput = z.infer<typeof metadataSchema>
export type MetadataAttributeInput = z.infer<typeof metadataAttributeSchema>
export type PrepareNewFileInput = z.infer<typeof prepareNewFileSchema>
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>
export type StartMintingInput = z.infer<typeof startMintingSchema>
export type ExtractFrameSyncInput = z.infer<typeof extractFrameSyncSchema>
