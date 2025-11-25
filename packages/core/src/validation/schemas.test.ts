import { describe, expect, test } from "bun:test"
import { ZodError } from "zod"
import {
  assetDescriptionSchema,
  assetLocationSchema,
  assetTitleSchema,
  chunkSchema,
  completeUploadSchema,
  contractIdSchema,
  contractNameSchema,
  contractSymbolSchema,
  createContractSchema,
  deviceIdSchema,
  editionsSchema,
  ercTypeSchema,
  eTagSchema,
  extractFrameSyncSchema,
  fileIdSchema,
  fileSizeSchema,
  fileSourceSchema,
  fileTypeSchema,
  mimeTypeSchema,
  prepareNewFileSchema,
  startMintingSchema,
  timeInSecondsSchema,
  uploadMetadataSchema,
} from "./schemas"

describe("Validation Schemas", () => {
  describe("contractNameSchema", () => {
    test("should accept valid contract names", () => {
      expect(() => contractNameSchema.parse("MyContract")).not.toThrow()
      expect(() => contractNameSchema.parse("My-Contract")).not.toThrow()
      expect(() => contractNameSchema.parse("My_Contract")).not.toThrow()
      expect(() => contractNameSchema.parse("My.Contract")).not.toThrow()
      expect(() => contractNameSchema.parse("ABC")).not.toThrow() // minimum 3 chars
    })

    test("should reject invalid contract names", () => {
      // Too short
      expect(() => contractNameSchema.parse("AB")).toThrow(ZodError)

      // Too long (31 characters)
      expect(() => contractNameSchema.parse("A".repeat(31))).toThrow(ZodError)

      // Starts with special char
      expect(() => contractNameSchema.parse("_MyContract")).toThrow(ZodError)
      expect(() => contractNameSchema.parse("-MyContract")).toThrow(ZodError)

      // Ends with special char
      expect(() => contractNameSchema.parse("MyContract_")).toThrow(ZodError)
      expect(() => contractNameSchema.parse("MyContract-")).toThrow(ZodError)

      // Consecutive special chars
      expect(() => contractNameSchema.parse("My__Contract")).toThrow(ZodError)
      expect(() => contractNameSchema.parse("My--Contract")).toThrow(ZodError)
    })
  })

  describe("contractSymbolSchema", () => {
    test("should accept valid contract symbols", () => {
      expect(() => contractSymbolSchema.parse("MYC")).not.toThrow()
      expect(() => contractSymbolSchema.parse("MY_CONTRACT")).not.toThrow()
      expect(() => contractSymbolSchema.parse("ABC123")).not.toThrow()
      expect(() => contractSymbolSchema.parse("ABC")).not.toThrow() // minimum 3 chars
    })

    test("should reject invalid contract symbols", () => {
      // Too short
      expect(() => contractSymbolSchema.parse("AB")).toThrow(ZodError)

      // Too long (31 characters)
      expect(() => contractSymbolSchema.parse("A".repeat(31))).toThrow(ZodError)

      // Starts with underscore
      expect(() => contractSymbolSchema.parse("_MYC")).toThrow(ZodError)

      // Ends with underscore
      expect(() => contractSymbolSchema.parse("MYC_")).toThrow(ZodError)

      // Consecutive underscores
      expect(() => contractSymbolSchema.parse("MY__CONTRACT")).toThrow(ZodError)

      // Invalid characters
      expect(() => contractSymbolSchema.parse("MY-CONTRACT")).toThrow(ZodError)
      expect(() => contractSymbolSchema.parse("MY.CONTRACT")).toThrow(ZodError)
    })
  })

  describe("assetTitleSchema", () => {
    test("should accept valid asset titles", () => {
      expect(() => assetTitleSchema.parse("ABC")).not.toThrow() // minimum 3 chars
      expect(() => assetTitleSchema.parse("My Amazing NFT")).not.toThrow()
      expect(() => assetTitleSchema.parse("A".repeat(120))).not.toThrow() // maximum 120 chars
    })

    test("should reject invalid asset titles", () => {
      // Too short
      expect(() => assetTitleSchema.parse("AB")).toThrow(ZodError)

      // Too long (121 characters)
      expect(() => assetTitleSchema.parse("A".repeat(121))).toThrow(ZodError)
    })
  })

  describe("assetDescriptionSchema", () => {
    test("should accept valid descriptions", () => {
      expect(() => assetDescriptionSchema.parse("A great NFT")).not.toThrow()
      expect(() => assetDescriptionSchema.parse("A".repeat(255))).not.toThrow() // maximum 255 chars
      expect(() => assetDescriptionSchema.parse(null)).not.toThrow() // nullable
      expect(() => assetDescriptionSchema.parse(undefined)).not.toThrow() // optional
    })

    test("should reject descriptions that are too long", () => {
      expect(() => assetDescriptionSchema.parse("A".repeat(256))).toThrow(
        ZodError,
      )
    })
  })

  describe("assetLocationSchema", () => {
    test("should accept valid locations", () => {
      expect(() => assetLocationSchema.parse("New York")).not.toThrow()
      expect(() => assetLocationSchema.parse("A".repeat(100))).not.toThrow() // maximum 100 chars
      expect(() => assetLocationSchema.parse(null)).not.toThrow() // nullable
      expect(() => assetLocationSchema.parse(undefined)).not.toThrow() // optional
    })

    test("should reject locations that are too long", () => {
      expect(() => assetLocationSchema.parse("A".repeat(101))).toThrow(ZodError)
    })
  })

  describe("editionsSchema", () => {
    test("should accept valid edition counts", () => {
      expect(() => editionsSchema.parse(1)).not.toThrow() // minimum
      expect(() => editionsSchema.parse(500)).not.toThrow()
      expect(() => editionsSchema.parse(1000)).not.toThrow() // maximum
    })

    test("should reject invalid edition counts", () => {
      // Too small
      expect(() => editionsSchema.parse(0)).toThrow(ZodError)
      expect(() => editionsSchema.parse(-1)).toThrow(ZodError)

      // Too large
      expect(() => editionsSchema.parse(1001)).toThrow(ZodError)

      // Not an integer
      expect(() => editionsSchema.parse(1.5)).toThrow(ZodError)
    })
  })

  describe("ercTypeSchema", () => {
    test("should accept valid ERC types", () => {
      expect(() => ercTypeSchema.parse("ERC721")).not.toThrow()
      expect(() => ercTypeSchema.parse("ERC1155")).not.toThrow()
    })

    test("should reject invalid ERC types", () => {
      expect(() => ercTypeSchema.parse("ERC20")).toThrow(ZodError)
      expect(() => ercTypeSchema.parse("erc721")).toThrow(ZodError)
      expect(() => ercTypeSchema.parse("")).toThrow(ZodError)
    })
  })

  describe("createContractSchema", () => {
    test("should accept valid contract creation data", () => {
      const validData = {
        name: "MyContract",
        symbol: "MYC",
        type: "ERC721" as const,
      }
      expect(() => createContractSchema.parse(validData)).not.toThrow()
    })

    test("should reject invalid contract creation data", () => {
      const invalidName = {
        name: "AB", // too short
        symbol: "MYC",
        type: "ERC721" as const,
      }
      expect(() => createContractSchema.parse(invalidName)).toThrow(ZodError)

      const invalidSymbol = {
        name: "MyContract",
        symbol: "AB", // too short
        type: "ERC721" as const,
      }
      expect(() => createContractSchema.parse(invalidSymbol)).toThrow(ZodError)

      const invalidType = {
        name: "MyContract",
        symbol: "MYC",
        type: "ERC20",
      }
      expect(() => createContractSchema.parse(invalidType)).toThrow(ZodError)
    })
  })

  describe("uploadMetadataSchema", () => {
    test("should accept valid upload metadata", () => {
      const validData = {
        fileId: "file123",
        contractId: "contract123",
        editions: 10,
        shareWithCommunity: true,
        metadata: {
          attributes: [
            {
              key: "color",
              value: "blue",
              type: 0, // STRING
            },
          ],
        },
      }
      expect(() => uploadMetadataSchema.parse(validData)).not.toThrow()
    })

    test("should accept minimal valid data", () => {
      const minimalData = {
        fileId: "file123",
        metadata: {
          attributes: [],
        },
      }
      expect(() => uploadMetadataSchema.parse(minimalData)).not.toThrow()
    })

    test("should reject invalid upload metadata", () => {
      const noFileId = {
        metadata: {
          attributes: [],
        },
      }
      expect(() => uploadMetadataSchema.parse(noFileId)).toThrow(ZodError)

      const noMetadata = {
        fileId: "file123",
      }
      expect(() => uploadMetadataSchema.parse(noMetadata)).toThrow(ZodError)

      const invalidEditions = {
        fileId: "file123",
        editions: 1001, // too many
        metadata: {
          attributes: [],
        },
      }
      expect(() => uploadMetadataSchema.parse(invalidEditions)).toThrow(
        ZodError,
      )
    })
  })

  describe("deviceIdSchema", () => {
    test("should accept valid device IDs", () => {
      expect(() => deviceIdSchema.parse("device123")).not.toThrow()
      expect(() => deviceIdSchema.parse("abc-xyz-123")).not.toThrow()
      expect(() => deviceIdSchema.parse("1")).not.toThrow() // minimum 1 char
    })

    test("should reject invalid device IDs", () => {
      // Empty string
      expect(() => deviceIdSchema.parse("")).toThrow(ZodError)
    })
  })

  describe("fileIdSchema", () => {
    test("should accept valid file IDs", () => {
      expect(() => fileIdSchema.parse("file123")).not.toThrow()
      expect(() => fileIdSchema.parse("abc-xyz-789")).not.toThrow()
      expect(() => fileIdSchema.parse("1")).not.toThrow() // minimum 1 char
    })

    test("should reject invalid file IDs", () => {
      // Empty string
      expect(() => fileIdSchema.parse("")).toThrow(ZodError)
    })
  })

  describe("contractIdSchema", () => {
    test("should accept valid contract IDs", () => {
      expect(() => contractIdSchema.parse("contract123")).not.toThrow()
      expect(() => contractIdSchema.parse("abc-xyz-456")).not.toThrow()
      expect(() => contractIdSchema.parse(null)).not.toThrow() // nullable
      expect(() => contractIdSchema.parse(undefined)).not.toThrow() // optional
    })

    test("should reject empty contract IDs", () => {
      // Empty string when provided
      expect(() => contractIdSchema.parse("")).toThrow(ZodError)
    })
  })

  describe("fileSizeSchema", () => {
    test("should accept valid file sizes", () => {
      expect(() => fileSizeSchema.parse(1)).not.toThrow() // minimum positive
      expect(() => fileSizeSchema.parse(1024)).not.toThrow() // 1 KB
      expect(() => fileSizeSchema.parse(1024 * 1024)).not.toThrow() // 1 MB
      expect(() => fileSizeSchema.parse(50 * 1024 * 1024)).not.toThrow() // 50 MB
      expect(() => fileSizeSchema.parse(100 * 1024 * 1024)).not.toThrow() // 100 MB (maximum)
    })

    test("should reject invalid file sizes", () => {
      // Zero
      expect(() => fileSizeSchema.parse(0)).toThrow(ZodError)

      // Negative
      expect(() => fileSizeSchema.parse(-1)).toThrow(ZodError)

      // Too large (over 100 MB)
      expect(() => fileSizeSchema.parse(100 * 1024 * 1024 + 1)).toThrow(
        ZodError,
      )
      expect(() => fileSizeSchema.parse(200 * 1024 * 1024)).toThrow(ZodError)
    })
  })

  describe("mimeTypeSchema", () => {
    test("should accept valid MIME types", () => {
      expect(() => mimeTypeSchema.parse("image/png")).not.toThrow()
      expect(() => mimeTypeSchema.parse("image/jpeg")).not.toThrow()
      expect(() => mimeTypeSchema.parse("video/mp4")).not.toThrow()
      expect(() => mimeTypeSchema.parse("application/json")).not.toThrow()
      expect(() => mimeTypeSchema.parse("text/plain")).not.toThrow()
      expect(() => mimeTypeSchema.parse("image/svg+xml")).not.toThrow() // with plus sign
      expect(() =>
        mimeTypeSchema.parse("application/vnd.api+json"),
      ).not.toThrow() // with dot and plus
    })

    test("should reject invalid MIME types", () => {
      // Empty string
      expect(() => mimeTypeSchema.parse("")).toThrow(ZodError)

      // Missing slash
      expect(() => mimeTypeSchema.parse("imagepng")).toThrow(ZodError)

      // Missing subtype
      expect(() => mimeTypeSchema.parse("image/")).toThrow(ZodError)

      // Missing type
      expect(() => mimeTypeSchema.parse("/png")).toThrow(ZodError)

      // Invalid characters
      expect(() => mimeTypeSchema.parse("image/png!")).toThrow(ZodError)
      expect(() => mimeTypeSchema.parse("image png")).toThrow(ZodError)
    })
  })

  describe("eTagSchema", () => {
    test("should accept valid ETags", () => {
      expect(() => eTagSchema.parse("abc123")).not.toThrow()
      expect(() => eTagSchema.parse('"abc123"')).not.toThrow() // with quotes
      expect(() => eTagSchema.parse('W/"abc123"')).not.toThrow() // weak ETag
      expect(() => eTagSchema.parse("1")).not.toThrow() // minimum 1 char
    })

    test("should reject invalid ETags", () => {
      // Empty string
      expect(() => eTagSchema.parse("")).toThrow(ZodError)
    })
  })

  describe("chunkSchema", () => {
    test("should accept valid chunks", () => {
      const validChunk = {
        partNumber: 1,
        eTag: "abc123",
      }
      expect(() => chunkSchema.parse(validChunk)).not.toThrow()

      const anotherValidChunk = {
        partNumber: 999,
        eTag: '"xyz789"',
      }
      expect(() => chunkSchema.parse(anotherValidChunk)).not.toThrow()
    })

    test("should reject invalid chunks", () => {
      // Missing partNumber
      const missingPartNumber = {
        eTag: "abc123",
      }
      expect(() => chunkSchema.parse(missingPartNumber)).toThrow(ZodError)

      // Missing eTag
      const missingETag = {
        partNumber: 1,
      }
      expect(() => chunkSchema.parse(missingETag)).toThrow(ZodError)

      // Invalid partNumber (zero)
      const zeroPartNumber = {
        partNumber: 0,
        eTag: "abc123",
      }
      expect(() => chunkSchema.parse(zeroPartNumber)).toThrow(ZodError)

      // Invalid partNumber (negative)
      const negativePartNumber = {
        partNumber: -1,
        eTag: "abc123",
      }
      expect(() => chunkSchema.parse(negativePartNumber)).toThrow(ZodError)

      // Invalid partNumber (not integer)
      const floatPartNumber = {
        partNumber: 1.5,
        eTag: "abc123",
      }
      expect(() => chunkSchema.parse(floatPartNumber)).toThrow(ZodError)

      // Invalid eTag (empty)
      const emptyETag = {
        partNumber: 1,
        eTag: "",
      }
      expect(() => chunkSchema.parse(emptyETag)).toThrow(ZodError)
    })
  })

  describe("fileTypeSchema", () => {
    test("should accept valid file types", () => {
      expect(() => fileTypeSchema.parse("image")).not.toThrow()
      expect(() => fileTypeSchema.parse("video")).not.toThrow()
      expect(() => fileTypeSchema.parse("gif")).not.toThrow()
    })

    test("should reject invalid file types", () => {
      expect(() => fileTypeSchema.parse("audio")).toThrow(ZodError)
      expect(() => fileTypeSchema.parse("document")).toThrow(ZodError)
      expect(() => fileTypeSchema.parse("")).toThrow(ZodError)
      expect(() => fileTypeSchema.parse(0)).toThrow(ZodError) // numeric values not accepted
    })
  })

  describe("fileSourceSchema", () => {
    test("should accept valid file sources", () => {
      expect(() => fileSourceSchema.parse("camera")).not.toThrow()
      expect(() => fileSourceSchema.parse("gallery")).not.toThrow()
      expect(() => fileSourceSchema.parse("upload")).not.toThrow()
    })

    test("should reject invalid file sources", () => {
      expect(() => fileSourceSchema.parse("download")).toThrow(ZodError)
      expect(() => fileSourceSchema.parse("url")).toThrow(ZodError)
      expect(() => fileSourceSchema.parse("")).toThrow(ZodError)
      expect(() => fileSourceSchema.parse(0)).toThrow(ZodError) // numeric values not accepted
    })
  })

  describe("prepareNewFileSchema", () => {
    test("should accept valid prepare new file data", () => {
      const validData = {
        deviceId: "device123",
        metadata: "metadata-string",
        type: "image",
        source: "upload",
        fileSize: 1024 * 1024, // 1 MB
      }
      expect(() => prepareNewFileSchema.parse(validData)).not.toThrow()

      const validDataWithOptional = {
        deviceId: "device123",
        metadata: "metadata-string",
        type: "video",
        source: "camera",
        fileSize: 50 * 1024 * 1024, // 50 MB
        isPrivate: true,
      }
      expect(() =>
        prepareNewFileSchema.parse(validDataWithOptional),
      ).not.toThrow()

      const validDataWithNullable = {
        deviceId: "device123",
        metadata: "metadata-string",
        type: "gif",
        source: "gallery",
        fileSize: 100 * 1024 * 1024, // 100 MB (maximum)
        isPrivate: null,
      }
      expect(() =>
        prepareNewFileSchema.parse(validDataWithNullable),
      ).not.toThrow()
    })

    test("should reject invalid prepare new file data", () => {
      // Missing deviceId
      const missingDeviceId = {
        metadata: "metadata-string",
        type: "image",
        source: "upload",
        fileSize: 1024,
      }
      expect(() => prepareNewFileSchema.parse(missingDeviceId)).toThrow(
        ZodError,
      )

      // Empty deviceId
      const emptyDeviceId = {
        deviceId: "",
        metadata: "metadata-string",
        type: "image",
        source: "upload",
        fileSize: 1024,
      }
      expect(() => prepareNewFileSchema.parse(emptyDeviceId)).toThrow(ZodError)

      // Missing metadata
      const missingMetadata = {
        deviceId: "device123",
        type: "image",
        source: "upload",
        fileSize: 1024,
      }
      expect(() => prepareNewFileSchema.parse(missingMetadata)).toThrow(
        ZodError,
      )

      // Empty metadata
      const emptyMetadata = {
        deviceId: "device123",
        metadata: "",
        type: "image",
        source: "upload",
        fileSize: 1024,
      }
      expect(() => prepareNewFileSchema.parse(emptyMetadata)).toThrow(ZodError)

      // Invalid type
      const invalidType = {
        deviceId: "device123",
        metadata: "metadata-string",
        type: "audio", // invalid type
        source: "upload",
        fileSize: 1024,
      }
      expect(() => prepareNewFileSchema.parse(invalidType)).toThrow(ZodError)

      // Invalid source
      const invalidSource = {
        deviceId: "device123",
        metadata: "metadata-string",
        type: "image",
        source: "download", // invalid source
        fileSize: 1024,
      }
      expect(() => prepareNewFileSchema.parse(invalidSource)).toThrow(ZodError)

      // Invalid fileSize (too large)
      const tooLargeFileSize = {
        deviceId: "device123",
        metadata: "metadata-string",
        type: "image",
        source: "upload",
        fileSize: 200 * 1024 * 1024, // 200 MB
      }
      expect(() => prepareNewFileSchema.parse(tooLargeFileSize)).toThrow(
        ZodError,
      )

      // Invalid fileSize (zero)
      const zeroFileSize = {
        deviceId: "device123",
        metadata: "metadata-string",
        type: "image",
        source: "upload",
        fileSize: 0,
      }
      expect(() => prepareNewFileSchema.parse(zeroFileSize)).toThrow(ZodError)
    })
  })

  describe("completeUploadSchema", () => {
    test("should accept valid complete upload data", () => {
      const validData = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [
          { partNumber: 1, eTag: "abc123" },
          { partNumber: 2, eTag: "def456" },
        ],
      }
      expect(() => completeUploadSchema.parse(validData)).not.toThrow()

      const validDataWithOptional = {
        fileId: "file123",
        mimeType: "video/mp4",
        chunks: [{ partNumber: 1, eTag: "abc123" }],
        disableThumbnail: true,
      }
      expect(() =>
        completeUploadSchema.parse(validDataWithOptional),
      ).not.toThrow()

      const validDataWithNullable = {
        fileId: "file123",
        mimeType: "application/pdf",
        chunks: [{ partNumber: 1, eTag: "abc123" }],
        disableThumbnail: null,
      }
      expect(() =>
        completeUploadSchema.parse(validDataWithNullable),
      ).not.toThrow()
    })

    test("should reject invalid complete upload data", () => {
      // Missing fileId
      const missingFileId = {
        mimeType: "image/png",
        chunks: [{ partNumber: 1, eTag: "abc123" }],
      }
      expect(() => completeUploadSchema.parse(missingFileId)).toThrow(ZodError)

      // Empty fileId
      const emptyFileId = {
        fileId: "",
        mimeType: "image/png",
        chunks: [{ partNumber: 1, eTag: "abc123" }],
      }
      expect(() => completeUploadSchema.parse(emptyFileId)).toThrow(ZodError)

      // Missing mimeType
      const missingMimeType = {
        fileId: "file123",
        chunks: [{ partNumber: 1, eTag: "abc123" }],
      }
      expect(() => completeUploadSchema.parse(missingMimeType)).toThrow(
        ZodError,
      )

      // Invalid mimeType
      const invalidMimeType = {
        fileId: "file123",
        mimeType: "invalid",
        chunks: [{ partNumber: 1, eTag: "abc123" }],
      }
      expect(() => completeUploadSchema.parse(invalidMimeType)).toThrow(
        ZodError,
      )

      // Missing chunks
      const missingChunks = {
        fileId: "file123",
        mimeType: "image/png",
      }
      expect(() => completeUploadSchema.parse(missingChunks)).toThrow(ZodError)

      // Empty chunks array
      const emptyChunks = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [],
      }
      expect(() => completeUploadSchema.parse(emptyChunks)).toThrow(ZodError)

      // Invalid chunk in array
      const invalidChunk = {
        fileId: "file123",
        mimeType: "image/png",
        chunks: [
          { partNumber: 0, eTag: "abc123" }, // invalid partNumber
        ],
      }
      expect(() => completeUploadSchema.parse(invalidChunk)).toThrow(ZodError)
    })
  })

  describe("startMintingSchema", () => {
    test("should accept valid start minting data", () => {
      const validData = {
        fileId: "file123",
        metadata: {
          attributes: [
            {
              key: "color",
              value: "blue",
              type: 0, // STRING
            },
          ],
        },
      }
      expect(() => startMintingSchema.parse(validData)).not.toThrow()

      const validDataWithOptional = {
        fileId: "file123",
        editions: 10,
        batchOrder: 1,
        contractId: "contract123",
        batchId: "batch123",
        shareWithCommunity: true,
        isEncrypted: false,
        encryptMimeType: "application/octet-stream",
        metadata: {
          attributes: [
            {
              key: "rarity",
              value: "legendary",
              type: 0,
            },
          ],
        },
      }
      expect(() =>
        startMintingSchema.parse(validDataWithOptional),
      ).not.toThrow()

      const validDataWithNullable = {
        fileId: "file123",
        editions: null,
        batchOrder: null,
        contractId: null,
        batchId: null,
        shareWithCommunity: null,
        isEncrypted: null,
        encryptMimeType: null,
        metadata: {
          attributes: [],
        },
      }
      expect(() =>
        startMintingSchema.parse(validDataWithNullable),
      ).not.toThrow()
    })

    test("should reject invalid start minting data", () => {
      // Missing fileId
      const missingFileId = {
        metadata: {
          attributes: [],
        },
      }
      expect(() => startMintingSchema.parse(missingFileId)).toThrow(ZodError)

      // Empty fileId
      const emptyFileId = {
        fileId: "",
        metadata: {
          attributes: [],
        },
      }
      expect(() => startMintingSchema.parse(emptyFileId)).toThrow(ZodError)

      // Missing metadata
      const missingMetadata = {
        fileId: "file123",
      }
      expect(() => startMintingSchema.parse(missingMetadata)).toThrow(ZodError)

      // Invalid editions (too many)
      const invalidEditions = {
        fileId: "file123",
        editions: 1001,
        metadata: {
          attributes: [],
        },
      }
      expect(() => startMintingSchema.parse(invalidEditions)).toThrow(ZodError)

      // Invalid batchOrder (not integer)
      const invalidBatchOrder = {
        fileId: "file123",
        batchOrder: 1.5,
        metadata: {
          attributes: [],
        },
      }
      expect(() => startMintingSchema.parse(invalidBatchOrder)).toThrow(
        ZodError,
      )

      // Empty contractId when provided
      const emptyContractId = {
        fileId: "file123",
        contractId: "",
        metadata: {
          attributes: [],
        },
      }
      expect(() => startMintingSchema.parse(emptyContractId)).toThrow(ZodError)

      // Invalid metadata (missing attributes)
      const invalidMetadata = {
        fileId: "file123",
        metadata: {},
      }
      expect(() => startMintingSchema.parse(invalidMetadata)).toThrow(ZodError)
    })
  })

  describe("timeInSecondsSchema", () => {
    test("should accept valid time values", () => {
      expect(() => timeInSecondsSchema.parse(0)).not.toThrow() // zero is valid
      expect(() => timeInSecondsSchema.parse(1)).not.toThrow()
      expect(() => timeInSecondsSchema.parse(1.5)).not.toThrow() // decimals are valid
      expect(() => timeInSecondsSchema.parse(60)).not.toThrow()
      expect(() => timeInSecondsSchema.parse(3600)).not.toThrow() // 1 hour
      expect(() => timeInSecondsSchema.parse(0.001)).not.toThrow() // millisecond precision
    })

    test("should reject invalid time values", () => {
      // Negative values
      expect(() => timeInSecondsSchema.parse(-1)).toThrow(ZodError)
      expect(() => timeInSecondsSchema.parse(-0.5)).toThrow(ZodError)
    })
  })

  describe("extractFrameSyncSchema", () => {
    test("should accept valid frame extraction data", () => {
      const validData = {
        fileId: "file123",
        timeInSeconds: 1.5,
      }
      expect(() => extractFrameSyncSchema.parse(validData)).not.toThrow()

      const validDataAtZero = {
        fileId: "video-abc-xyz",
        timeInSeconds: 0,
      }
      expect(() => extractFrameSyncSchema.parse(validDataAtZero)).not.toThrow()

      const validDataLongTime = {
        fileId: "file123",
        timeInSeconds: 3600, // 1 hour
      }
      expect(() =>
        extractFrameSyncSchema.parse(validDataLongTime),
      ).not.toThrow()
    })

    test("should reject invalid frame extraction data", () => {
      // Missing fileId
      const missingFileId = {
        timeInSeconds: 1.5,
      }
      expect(() => extractFrameSyncSchema.parse(missingFileId)).toThrow(
        ZodError,
      )

      // Empty fileId
      const emptyFileId = {
        fileId: "",
        timeInSeconds: 1.5,
      }
      expect(() => extractFrameSyncSchema.parse(emptyFileId)).toThrow(ZodError)

      // Missing timeInSeconds
      const missingTime = {
        fileId: "file123",
      }
      expect(() => extractFrameSyncSchema.parse(missingTime)).toThrow(ZodError)

      // Negative timeInSeconds
      const negativeTime = {
        fileId: "file123",
        timeInSeconds: -1,
      }
      expect(() => extractFrameSyncSchema.parse(negativeTime)).toThrow(ZodError)

      // timeInSeconds is not a number
      const stringTime = {
        fileId: "file123",
        timeInSeconds: "1.5",
      }
      expect(() => extractFrameSyncSchema.parse(stringTime)).toThrow(ZodError)
    })
  })
})
