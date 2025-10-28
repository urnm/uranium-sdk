import { describe, expect, test } from "bun:test"
import {
  ASSET_STATUS_TEXT,
  AssetSVCStatus,
  CollectionStatus,
  CollectionType,
  ERCType,
  FileSource,
  FileType,
  getAssetStatusText,
  isAssetMinted,
  Metadata_AttributeType,
  transformSvcStatusToDbStatus,
  UploadStatus,
  UserRole,
} from "./enums"

describe("Enums", () => {
  describe("AssetSVCStatus", () => {
    test("should have correct numeric values", () => {
      expect(AssetSVCStatus.MEDIA_UPLOAD_INITIALIZING).toBe(0)
      expect(AssetSVCStatus.MEDIA_UPLOADING).toBe(1)
      expect(AssetSVCStatus.MEDIA_VERIFYING).toBe(2)
      expect(AssetSVCStatus.NFT_ALL_BLOCK_CONFIRMED).toBe(14)
    })

    test("should have all 15 stages", () => {
      const stages = Object.keys(AssetSVCStatus).filter(
        (key) => !Number.isNaN(Number(key)),
      )
      expect(stages.length).toBe(15)
    })
  })

  describe("UploadStatus", () => {
    test("should have string values matching enum keys", () => {
      expect(UploadStatus.MEDIA_UPLOAD_INITIALIZING).toBe(
        "MEDIA_UPLOAD_INITIALIZING",
      )
      expect(UploadStatus.NFT_ALL_BLOCK_CONFIRMED).toBe(
        "NFT_ALL_BLOCK_CONFIRMED",
      )
    })
  })

  describe("FileType", () => {
    test("should have correct file types", () => {
      expect(FileType.Image).toBe("image")
      expect(FileType.Video).toBe("video")
      expect(FileType.Gif).toBe("gif")
      expect(FileType.Unknown).toBe("unknown")
    })
  })

  describe("FileSource", () => {
    test("should have correct file sources", () => {
      expect(FileSource.Camera).toBe("camera")
      expect(FileSource.Gallery).toBe("gallery")
      expect(FileSource.Upload).toBe("upload")
    })
  })

  describe("Metadata_AttributeType", () => {
    test("should have correct attribute types", () => {
      expect(Metadata_AttributeType.STRING).toBe(0)
      expect(Metadata_AttributeType.NUMBER).toBe(1)
      expect(Metadata_AttributeType.BOOLEAN).toBe(2)
      expect(Metadata_AttributeType.UNRECOGNIZED).toBe(-1)
    })
  })

  describe("UserRole", () => {
    test("should have correct user roles", () => {
      expect(UserRole.USER).toBe("USER")
      expect(UserRole.ADMIN).toBe("ADMIN")
    })
  })

  describe("CollectionType", () => {
    test("should have correct collection types", () => {
      expect(CollectionType.CREATED).toBe("CREATED")
      expect(CollectionType.EXTERNAL).toBe("EXTERNAL")
      expect(CollectionType.DEFAULT).toBe("DEFAULT")
      expect(CollectionType.SANDBOX).toBe("SANDBOX")
    })
  })

  describe("CollectionStatus", () => {
    test("should have correct collection statuses", () => {
      expect(CollectionStatus.PENDING).toBe("PENDING")
      expect(CollectionStatus.COMPLETE).toBe("COMPLETE")
    })
  })

  describe("ERCType", () => {
    test("should have correct ERC types", () => {
      expect(ERCType.ERC721).toBe("ERC721")
      expect(ERCType.ERC1155).toBe("ERC1155")
    })
  })
})

describe("ASSET_STATUS_TEXT", () => {
  test("should have text for all asset statuses", () => {
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.MEDIA_UPLOAD_INITIALIZING]).toBe(
      "Initializing permanentizer...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.MEDIA_UPLOADING]).toBe(
      "Uploading media...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.MEDIA_VERIFYING]).toBe(
      "Verifying upload...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.MEDIA_CONFIRMING]).toBe(
      "Confirming...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.MEDIA_CONFIRMED]).toBe(
      "Irreversible upload finalized.",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.META_UPLOAD_INITIALIZING]).toBe(
      "Initializing permanentizer...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.META_UPLOADING]).toBe(
      "Uploading metadata...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.META_VERIFYING]).toBe(
      "Verifying upload...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.META_CONFIRMING]).toBe(
      "Confirming...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.META_CONFIRMED]).toBe(
      "Irreversible upload finalized.",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.NFT_INITIALIZING]).toBe(
      "Mapping smart-contract methods...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.NFT_SIGNING]).toBe(
      "Signing Transaction...",
    )
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.NFT_MINTING]).toBe("Minting NFT...")
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.NFT_CONFIRMED]).toBe("NFT minted.")
    expect(ASSET_STATUS_TEXT[AssetSVCStatus.NFT_ALL_BLOCK_CONFIRMED]).toBe(
      "All blocks confirmed.",
    )
  })

  test("should have entries for all 15 statuses", () => {
    const entries = Object.keys(ASSET_STATUS_TEXT)
    expect(entries.length).toBe(15)
  })
})

describe("transformSvcStatusToDbStatus", () => {
  test("should transform MEDIA_UPLOAD_INITIALIZING correctly", () => {
    const result = transformSvcStatusToDbStatus(
      AssetSVCStatus.MEDIA_UPLOAD_INITIALIZING,
    )
    expect(result).toBe(UploadStatus.MEDIA_UPLOAD_INITIALIZING)
  })

  test("should transform MEDIA_UPLOADING correctly", () => {
    const result = transformSvcStatusToDbStatus(AssetSVCStatus.MEDIA_UPLOADING)
    expect(result).toBe(UploadStatus.MEDIA_UPLOADING)
  })

  test("should transform NFT_MINTING correctly", () => {
    const result = transformSvcStatusToDbStatus(AssetSVCStatus.NFT_MINTING)
    expect(result).toBe(UploadStatus.NFT_MINTING)
  })

  test("should transform NFT_ALL_BLOCK_CONFIRMED correctly", () => {
    const result = transformSvcStatusToDbStatus(
      AssetSVCStatus.NFT_ALL_BLOCK_CONFIRMED,
    )
    expect(result).toBe(UploadStatus.NFT_ALL_BLOCK_CONFIRMED)
  })

  test("should throw error for invalid status", () => {
    expect(() => {
      // @ts-expect-error - testing invalid value
      transformSvcStatusToDbStatus(999)
    }).toThrow("UNRECOGNIZED_ASSET_STATUS")
  })

  test("should handle all valid status codes", () => {
    for (let i = 0; i <= 14; i++) {
      expect(() => {
        transformSvcStatusToDbStatus(i as AssetSVCStatus)
      }).not.toThrow()
    }
  })
})

describe("getAssetStatusText", () => {
  test("should return correct text for MEDIA_UPLOAD_INITIALIZING", () => {
    const text = getAssetStatusText(AssetSVCStatus.MEDIA_UPLOAD_INITIALIZING)
    expect(text).toBe("Initializing permanentizer...")
  })

  test("should return correct text for MEDIA_UPLOADING", () => {
    const text = getAssetStatusText(AssetSVCStatus.MEDIA_UPLOADING)
    expect(text).toBe("Uploading media...")
  })

  test("should return correct text for NFT_MINTING", () => {
    const text = getAssetStatusText(AssetSVCStatus.NFT_MINTING)
    expect(text).toBe("Minting NFT...")
  })

  test("should return correct text for NFT_ALL_BLOCK_CONFIRMED", () => {
    const text = getAssetStatusText(AssetSVCStatus.NFT_ALL_BLOCK_CONFIRMED)
    expect(text).toBe("All blocks confirmed.")
  })

  test("should return 'Unknown status' for invalid status", () => {
    // @ts-expect-error - testing invalid value
    const text = getAssetStatusText(999)
    expect(text).toBe("Unknown status")
  })

  test("should handle all valid status codes", () => {
    for (let i = 0; i <= 14; i++) {
      const text = getAssetStatusText(i as AssetSVCStatus)
      expect(text).toBeDefined()
      expect(text).not.toBe("Unknown status")
    }
  })
})

describe("isAssetMinted", () => {
  test("should return true for NFT_CONFIRMED", () => {
    expect(isAssetMinted(AssetSVCStatus.NFT_CONFIRMED)).toBe(true)
  })

  test("should return true for NFT_ALL_BLOCK_CONFIRMED", () => {
    expect(isAssetMinted(AssetSVCStatus.NFT_ALL_BLOCK_CONFIRMED)).toBe(true)
  })

  test("should return false for MEDIA_UPLOAD_INITIALIZING", () => {
    expect(isAssetMinted(AssetSVCStatus.MEDIA_UPLOAD_INITIALIZING)).toBe(false)
  })

  test("should return false for MEDIA_UPLOADING", () => {
    expect(isAssetMinted(AssetSVCStatus.MEDIA_UPLOADING)).toBe(false)
  })

  test("should return false for NFT_MINTING", () => {
    expect(isAssetMinted(AssetSVCStatus.NFT_MINTING)).toBe(false)
  })

  test("should return false for all pre-minting statuses", () => {
    const preMintingStatuses = [
      AssetSVCStatus.MEDIA_UPLOAD_INITIALIZING,
      AssetSVCStatus.MEDIA_UPLOADING,
      AssetSVCStatus.MEDIA_VERIFYING,
      AssetSVCStatus.MEDIA_CONFIRMING,
      AssetSVCStatus.MEDIA_CONFIRMED,
      AssetSVCStatus.META_UPLOAD_INITIALIZING,
      AssetSVCStatus.META_UPLOADING,
      AssetSVCStatus.META_VERIFYING,
      AssetSVCStatus.META_CONFIRMING,
      AssetSVCStatus.META_CONFIRMED,
      AssetSVCStatus.NFT_INITIALIZING,
      AssetSVCStatus.NFT_SIGNING,
      AssetSVCStatus.NFT_MINTING,
    ]

    for (const status of preMintingStatuses) {
      expect(isAssetMinted(status)).toBe(false)
    }
  })
})
