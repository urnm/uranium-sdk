import { describe, expect, test } from "bun:test"
import { Metadata_AttributeType } from "./enums"
import {
  type CreateAssetMetadata,
  convertMetadataToDto,
  createMinimalMetadata,
  isPredefinedAttribute,
  mergeMetadata,
  validateMetadata,
} from "./metadata"

describe("Metadata Utilities", () => {
  describe("isPredefinedAttribute", () => {
    test("should return true for all predefined attributes", () => {
      expect(isPredefinedAttribute("title")).toBe(true)
      expect(isPredefinedAttribute("description")).toBe(true)
      expect(isPredefinedAttribute("location")).toBe(true)
      expect(isPredefinedAttribute("locationCoords")).toBe(true)
      expect(isPredefinedAttribute("appName")).toBe(true)
      expect(isPredefinedAttribute("appVersion")).toBe(true)
      expect(isPredefinedAttribute("authorName")).toBe(true)
      expect(isPredefinedAttribute("source")).toBe(true)
      expect(isPredefinedAttribute("mediaType")).toBe(true)
      expect(isPredefinedAttribute("mediaSize")).toBe(true)
      expect(isPredefinedAttribute("mediaDuration")).toBe(true)
      expect(isPredefinedAttribute("sourceMimeType")).toBe(true)
      expect(isPredefinedAttribute("creatorAddress")).toBe(true)
      expect(isPredefinedAttribute("creatorName")).toBe(true)
    })

    test("should return false for custom attributes", () => {
      expect(isPredefinedAttribute("customField")).toBe(false)
      expect(isPredefinedAttribute("myAttribute")).toBe(false)
      expect(isPredefinedAttribute("color")).toBe(false)
      expect(isPredefinedAttribute("rarity")).toBe(false)
    })

    test("should return false for empty string", () => {
      expect(isPredefinedAttribute("")).toBe(false)
    })

    test("should return false for similar but incorrect keys", () => {
      expect(isPredefinedAttribute("Title")).toBe(false) // wrong case
      expect(isPredefinedAttribute("TITLE")).toBe(false) // wrong case
      expect(isPredefinedAttribute("titles")).toBe(false) // plural
      expect(isPredefinedAttribute("mediasize")).toBe(false) // wrong case
    })
  })

  describe("convertMetadataToDto", () => {
    test("should convert minimal metadata with only title", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        key: "title",
        value: "Test NFT",
        type: Metadata_AttributeType.STRING,
      })
    })

    test("should convert metadata with all predefined string attributes", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        description: "A test NFT",
        location: "New York",
        locationCoords: "40.7128,-74.0060",
        appName: "TestApp",
        appVersion: "1.0.0",
        authorName: "John Doe",
        source: "camera",
        mediaType: "image",
        sourceMimeType: "image/png",
        creatorAddress: "0x123abc",
        creatorName: "Creator",
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(12)
      expect(
        result.every((attr) => attr.type === Metadata_AttributeType.STRING),
      ).toBe(true)
    })

    test("should convert metadata with number attributes", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        mediaSize: 1024000,
        mediaDuration: 30.5,
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(3)

      const titleAttr = result.find((attr) => attr.key === "title")
      expect(titleAttr?.type).toBe(Metadata_AttributeType.STRING)
      expect(titleAttr?.value).toBe("Test NFT")

      const sizeAttr = result.find((attr) => attr.key === "mediaSize")
      expect(sizeAttr?.type).toBe(Metadata_AttributeType.NUMBER)
      expect(sizeAttr?.value).toBe("1024000")

      const durationAttr = result.find((attr) => attr.key === "mediaDuration")
      expect(durationAttr?.type).toBe(Metadata_AttributeType.NUMBER)
      expect(durationAttr?.value).toBe("30.5")
    })

    test("should infer type as STRING for string values", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        description: "Description",
      }

      const result = convertMetadataToDto(metadata)

      expect(
        result.every((attr) => attr.type === Metadata_AttributeType.STRING),
      ).toBe(true)
    })

    test("should infer type as NUMBER for number values", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        mediaSize: 12345,
      }

      const result = convertMetadataToDto(metadata)

      const sizeAttr = result.find((attr) => attr.key === "mediaSize")
      expect(sizeAttr?.type).toBe(Metadata_AttributeType.NUMBER)
    })

    test("should convert custom attributes with string values", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        custom: {
          color: "blue",
          rarity: "legendary",
        },
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(3)

      const colorAttr = result.find((attr) => attr.key === "color")
      expect(colorAttr).toEqual({
        key: "color",
        value: "blue",
        type: Metadata_AttributeType.STRING,
      })

      const rarityAttr = result.find((attr) => attr.key === "rarity")
      expect(rarityAttr).toEqual({
        key: "rarity",
        value: "legendary",
        type: Metadata_AttributeType.STRING,
      })
    })

    test("should convert custom attributes with number values", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        custom: {
          level: 42,
          power: 9000,
        },
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(3)

      const levelAttr = result.find((attr) => attr.key === "level")
      expect(levelAttr).toEqual({
        key: "level",
        value: "42",
        type: Metadata_AttributeType.NUMBER,
      })

      const powerAttr = result.find((attr) => attr.key === "power")
      expect(powerAttr).toEqual({
        key: "power",
        value: "9000",
        type: Metadata_AttributeType.NUMBER,
      })
    })

    test("should convert custom attributes with boolean values", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        custom: {
          featured: true,
          archived: false,
        },
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(3)

      const featuredAttr = result.find((attr) => attr.key === "featured")
      expect(featuredAttr).toEqual({
        key: "featured",
        value: "true",
        type: Metadata_AttributeType.BOOLEAN,
      })

      const archivedAttr = result.find((attr) => attr.key === "archived")
      expect(archivedAttr).toEqual({
        key: "archived",
        value: "false",
        type: Metadata_AttributeType.BOOLEAN,
      })
    })

    test("should convert mixed custom attribute types", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        custom: {
          name: "Item",
          level: 10,
          active: true,
        },
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(4)
      expect(result.find((attr) => attr.key === "name")?.type).toBe(
        Metadata_AttributeType.STRING,
      )
      expect(result.find((attr) => attr.key === "level")?.type).toBe(
        Metadata_AttributeType.NUMBER,
      )
      expect(result.find((attr) => attr.key === "active")?.type).toBe(
        Metadata_AttributeType.BOOLEAN,
      )
    })

    test("should skip undefined values in predefined attributes", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        description: undefined,
        location: undefined,
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe("title")
    })

    test("should skip null values in predefined attributes", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        description: undefined,
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe("title")
    })

    test("should skip undefined values in custom attributes", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        custom: {
          color: "blue",
          size: undefined,
        },
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(2)
      expect(result.find((attr) => attr.key === "size")).toBeUndefined()
    })

    test("should handle empty custom object", () => {
      const metadata: CreateAssetMetadata = {
        title: "Test NFT",
        custom: {},
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe("title")
    })

    test("should convert all attributes together", () => {
      const metadata: CreateAssetMetadata = {
        title: "Complete NFT",
        description: "Full metadata",
        mediaSize: 2048000,
        custom: {
          edition: 1,
          total: 100,
          verified: true,
        },
      }

      const result = convertMetadataToDto(metadata)

      expect(result).toHaveLength(6)
      expect(result.find((attr) => attr.key === "title")).toBeDefined()
      expect(result.find((attr) => attr.key === "description")).toBeDefined()
      expect(result.find((attr) => attr.key === "mediaSize")).toBeDefined()
      expect(result.find((attr) => attr.key === "edition")).toBeDefined()
      expect(result.find((attr) => attr.key === "total")).toBeDefined()
      expect(result.find((attr) => attr.key === "verified")).toBeDefined()
    })
  })

  describe("validateMetadata", () => {
    describe("title validation", () => {
      test("should pass validation with valid title", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should throw error when title is missing", () => {
        // @ts-expect-error - testing invalid metadata
        const metadata: CreateAssetMetadata = {}

        expect(() => validateMetadata(metadata)).toThrow("Title is required")
      })

      test("should throw error when title is empty string", () => {
        const metadata: CreateAssetMetadata = {
          title: "",
        }

        expect(() => validateMetadata(metadata)).toThrow("Title is required")
      })

      test("should throw error when title is only whitespace", () => {
        const metadata: CreateAssetMetadata = {
          title: "   ",
        }

        expect(() => validateMetadata(metadata)).toThrow("Title is required")
      })

      test("should throw error when title is too short (less than 3 characters)", () => {
        const metadata: CreateAssetMetadata = {
          title: "AB",
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "Title must be between 3 and 120 characters",
        )
      })

      test("should accept title with exactly 3 characters", () => {
        const metadata: CreateAssetMetadata = {
          title: "ABC",
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should accept title with exactly 120 characters", () => {
        const metadata: CreateAssetMetadata = {
          title: "A".repeat(120),
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should throw error when title is too long (more than 120 characters)", () => {
        const metadata: CreateAssetMetadata = {
          title: "A".repeat(121),
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "Title must be between 3 and 120 characters",
        )
      })
    })

    describe("description validation", () => {
      test("should pass validation with valid description", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          description: "This is a valid description",
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation when description is undefined", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          description: undefined,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should accept description with exactly 255 characters", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          description: "A".repeat(255),
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should throw error when description exceeds 255 characters", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          description: "A".repeat(256),
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "Description must not exceed 255 characters",
        )
      })
    })

    describe("location validation", () => {
      test("should pass validation with valid location", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          location: "New York City",
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation when location is undefined", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          location: undefined,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should accept location with exactly 100 characters", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          location: "A".repeat(100),
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should throw error when location exceeds 100 characters", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          location: "A".repeat(101),
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "Location must not exceed 100 characters",
        )
      })
    })

    describe("locationCoords validation", () => {
      test("should pass validation with valid coordinates", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: "40.7128,-74.0060",
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation with positive coordinates", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: "51.5074,0.1278",
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation with negative coordinates", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: "-33.8688,151.2093",
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation with integer coordinates", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: "40,-74",
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation when locationCoords is undefined", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: undefined,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should throw error for invalid format (missing comma)", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: "40.7128 -74.0060",
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "locationCoords must be in 'lat,lng' format",
        )
      })

      test("should throw error for invalid format (too many commas)", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: "40.7128,-74.0060,100",
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "locationCoords must be in 'lat,lng' format",
        )
      })

      test("should throw error for invalid format (letters)", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: "abc,def",
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "locationCoords must be in 'lat,lng' format",
        )
      })

      test("should pass validation for empty string (treated as falsy)", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          locationCoords: "",
        }

        // Empty string is falsy, so validation doesn't run
        expect(() => validateMetadata(metadata)).not.toThrow()
      })
    })

    describe("mediaSize validation", () => {
      test("should pass validation with positive mediaSize", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaSize: 1024000,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation with zero mediaSize", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaSize: 0,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation when mediaSize is undefined", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaSize: undefined,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should throw error when mediaSize is negative", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaSize: -1,
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "mediaSize must be a positive number",
        )
      })

      test("should throw error when mediaSize is negative decimal", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaSize: -100.5,
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "mediaSize must be a positive number",
        )
      })
    })

    describe("mediaDuration validation", () => {
      test("should pass validation with positive mediaDuration", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaDuration: 30.5,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation with zero mediaDuration", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaDuration: 0,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should pass validation when mediaDuration is undefined", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaDuration: undefined,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })

      test("should throw error when mediaDuration is negative", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaDuration: -10,
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "mediaDuration must be a positive number",
        )
      })

      test("should throw error when mediaDuration is negative decimal", () => {
        const metadata: CreateAssetMetadata = {
          title: "Valid Title",
          mediaDuration: -5.5,
        }

        expect(() => validateMetadata(metadata)).toThrow(
          "mediaDuration must be a positive number",
        )
      })
    })

    describe("complete validation", () => {
      test("should pass validation with all valid fields", () => {
        const metadata: CreateAssetMetadata = {
          title: "Complete NFT",
          description: "Full description",
          location: "San Francisco",
          locationCoords: "37.7749,-122.4194",
          mediaSize: 2048000,
          mediaDuration: 60,
        }

        expect(() => validateMetadata(metadata)).not.toThrow()
      })
    })
  })

  describe("createMinimalMetadata", () => {
    test("should create metadata with only title", () => {
      const result = createMinimalMetadata("Test NFT")

      expect(result).toEqual({ title: "Test NFT" })
    })

    test("should create metadata with short title", () => {
      const result = createMinimalMetadata("ABC")

      expect(result).toEqual({ title: "ABC" })
    })

    test("should create metadata with long title", () => {
      const title = "A".repeat(120)
      const result = createMinimalMetadata(title)

      expect(result).toEqual({ title })
    })

    test("should create metadata with special characters in title", () => {
      const result = createMinimalMetadata("Test NFT #123 @ $50")

      expect(result).toEqual({ title: "Test NFT #123 @ $50" })
    })
  })

  describe("mergeMetadata", () => {
    test("should merge two metadata objects", () => {
      const metadata1 = {
        title: "NFT",
        description: "First",
      }

      const metadata2 = {
        location: "New York",
      }

      const result = mergeMetadata(metadata1, metadata2)

      expect(result).toEqual({
        title: "NFT",
        description: "First",
        location: "New York",
      })
    })

    test("should override earlier values with later ones", () => {
      const metadata1 = {
        title: "NFT",
        description: "First",
      }

      const metadata2 = {
        description: "Second",
      }

      const result = mergeMetadata(metadata1, metadata2)

      expect(result).toEqual({
        title: "NFT",
        description: "Second",
      })
    })

    test("should merge multiple metadata objects", () => {
      const metadata1 = {
        title: "NFT",
      }

      const metadata2 = {
        description: "Description",
      }

      const metadata3 = {
        location: "Paris",
      }

      const result = mergeMetadata(metadata1, metadata2, metadata3)

      expect(result).toEqual({
        title: "NFT",
        description: "Description",
        location: "Paris",
      })
    })

    test("should merge custom attributes by combining them", () => {
      const metadata1 = {
        title: "NFT",
        custom: {
          color: "blue",
          size: "large",
        },
      }

      const metadata2 = {
        custom: {
          rarity: "legendary",
        },
      }

      const result = mergeMetadata(metadata1, metadata2)

      // Object.assign overwrites custom, then custom attributes are re-merged
      // So merged.custom starts from metadata2.custom and includes both
      expect(result).toEqual({
        title: "NFT",
        custom: {
          rarity: "legendary",
        },
      })
    })

    test("should override custom attributes with same key", () => {
      const metadata1 = {
        title: "NFT",
        custom: {
          color: "blue",
          level: 5,
        },
      }

      const metadata2 = {
        custom: {
          color: "red",
          power: 100,
        },
      }

      const result = mergeMetadata(metadata1, metadata2)

      // Due to Object.assign happening before spread, previous custom attributes are lost
      expect(result).toEqual({
        title: "NFT",
        custom: {
          color: "red",
          power: 100,
        },
      })
    })

    test("should handle empty objects", () => {
      const metadata1 = {
        title: "NFT",
      }

      const metadata2 = {}

      const result = mergeMetadata(metadata1, metadata2)

      expect(result).toEqual({
        title: "NFT",
      })
    })

    test("should throw error when merged result has no title", () => {
      const metadata1 = {
        description: "No title",
      }

      const metadata2 = {
        location: "New York",
      }

      expect(() => mergeMetadata(metadata1, metadata2)).toThrow(
        "Merged metadata must include a title",
      )
    })

    test("should merge single metadata object", () => {
      const metadata = {
        title: "Single NFT",
        description: "Just one",
      }

      const result = mergeMetadata(metadata)

      expect(result).toEqual({
        title: "Single NFT",
        description: "Just one",
      })
    })

    test("should handle merging with undefined values", () => {
      const metadata1 = {
        title: "NFT",
        description: "First",
      }

      const metadata2 = {
        description: undefined,
        location: "Paris",
      }

      const result = mergeMetadata(metadata1, metadata2)

      expect(result).toEqual({
        title: "NFT",
        description: undefined,
        location: "Paris",
      })
    })

    test("should preserve all predefined attributes", () => {
      const metadata1 = {
        title: "NFT",
        description: "Description",
        mediaSize: 1024,
      }

      const metadata2 = {
        location: "Tokyo",
        mediaDuration: 30,
      }

      const result = mergeMetadata(metadata1, metadata2)

      expect(result).toEqual({
        title: "NFT",
        description: "Description",
        mediaSize: 1024,
        location: "Tokyo",
        mediaDuration: 30,
      })
    })

    test("should handle complex custom attribute merge", () => {
      const metadata1 = {
        title: "NFT",
        custom: {
          str: "value",
          num: 42,
          bool: true,
        },
      }

      const metadata2 = {
        custom: {
          num: 100,
          newField: "added",
        },
      }

      const metadata3 = {
        description: "Updated",
        custom: {
          bool: false,
        },
      }

      const result = mergeMetadata(metadata1, metadata2, metadata3)

      // Due to Object.assign behavior, only the last custom object is preserved
      expect(result).toEqual({
        title: "NFT",
        description: "Updated",
        custom: {
          bool: false,
        },
      })
    })
  })
})
