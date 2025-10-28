import { Metadata_AttributeType } from "./enums"

/**
 * Predefined metadata attribute keys supported by Uranium
 * These are the standard attributes recognized by the system
 */
export type PredefinedAttribute =
  | "title"
  | "description"
  | "location"
  | "locationCoords"
  | "appName"
  | "appVersion"
  | "authorName"
  | "source"
  | "mediaType"
  | "mediaSize"
  | "mediaDuration"
  | "sourceMimeType"
  | "creatorAddress"
  | "creatorName"

/**
 * Type-safe metadata attribute with inferred value type
 * @template K - The attribute key from PredefinedAttribute
 */
export interface MetadataAttribute<
  K extends PredefinedAttribute = PredefinedAttribute,
> {
  /** Attribute key */
  key: K
  /** Attribute value (stringified) */
  value: string
  /** Data type of the attribute */
  type: Metadata_AttributeType
}

/**
 * Custom metadata attribute for user-defined fields
 */
export interface CustomMetadataAttribute {
  /** Custom attribute key (any string) */
  key: string
  /** Attribute value (stringified) */
  value: string
  /** Data type of the attribute */
  type: Metadata_AttributeType
}

/**
 * Type-safe metadata for creating assets
 * Provides autocomplete for predefined attributes
 */
export interface CreateAssetMetadata {
  /** Required: Asset title (3-120 characters) */
  title: string
  /** Optional: Asset description (max 255 characters) */
  description?: string
  /** Optional: Location where asset was created (max 100 characters) */
  location?: string
  /** Optional: Geographic coordinates in "lat,lng" format */
  locationCoords?: string
  /** Optional: Name of the app used to create the asset */
  appName?: string
  /** Optional: Version of the app used to create the asset */
  appVersion?: string
  /** Optional: Name of the author/creator */
  authorName?: string
  /** Optional: Source type (camera, gallery, upload) */
  source?: string
  /** Optional: Media type (image, video, gif) */
  mediaType?: string
  /** Optional: Size of media file in bytes */
  mediaSize?: number
  /** Optional: Duration of video/audio in seconds */
  mediaDuration?: number
  /** Optional: MIME type of source file */
  sourceMimeType?: string
  /** Optional: Blockchain address of creator */
  creatorAddress?: string
  /** Optional: Display name of creator */
  creatorName?: string
  /** Optional: Custom attributes (key-value pairs) */
  custom?: Record<string, string | number | boolean>
}

/**
 * Helper type for converting CreateAssetMetadata to API format
 */
export type MetadataAttributeArray = Array<
  MetadataAttribute | CustomMetadataAttribute
>

/**
 * Utility type for partial metadata updates
 */
export type PartialMetadata = Partial<CreateAssetMetadata>

/**
 * Type guard to check if attribute is predefined
 */
export function isPredefinedAttribute(key: string): key is PredefinedAttribute {
  const predefinedKeys: PredefinedAttribute[] = [
    "title",
    "description",
    "location",
    "locationCoords",
    "appName",
    "appVersion",
    "authorName",
    "source",
    "mediaType",
    "mediaSize",
    "mediaDuration",
    "sourceMimeType",
    "creatorAddress",
    "creatorName",
  ]
  return predefinedKeys.includes(key as PredefinedAttribute)
}

/**
 * Converts CreateAssetMetadata to API MetadataDto format
 * @param metadata - Structured metadata object
 * @returns Array of metadata attributes in API format
 */
export function convertMetadataToDto(
  metadata: CreateAssetMetadata,
): MetadataAttributeArray {
  const attributes: MetadataAttributeArray = []

  // Add predefined attributes
  Object.entries(metadata).forEach(([key, value]) => {
    if (key === "custom") return // Handle custom attributes separately

    if (value !== undefined && value !== null) {
      const type =
        typeof value === "number"
          ? Metadata_AttributeType.NUMBER
          : typeof value === "boolean"
            ? Metadata_AttributeType.BOOLEAN
            : Metadata_AttributeType.STRING

      if (isPredefinedAttribute(key)) {
        attributes.push({
          key,
          value: String(value),
          type,
        })
      }
    }
  })

  // Add custom attributes
  if (metadata.custom) {
    Object.entries(metadata.custom).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const type =
          typeof value === "number"
            ? Metadata_AttributeType.NUMBER
            : typeof value === "boolean"
              ? Metadata_AttributeType.BOOLEAN
              : Metadata_AttributeType.STRING

        attributes.push({
          key,
          value: String(value),
          type,
        })
      }
    })
  }

  return attributes
}

/**
 * Validates metadata constraints
 * @param metadata - Metadata to validate
 * @throws Error if validation fails
 */
export function validateMetadata(metadata: CreateAssetMetadata): void {
  // Title is required
  if (!metadata.title || metadata.title.trim().length === 0) {
    throw new Error("Title is required")
  }

  // Title length validation (3-120 characters)
  if (metadata.title.length < 3 || metadata.title.length > 120) {
    throw new Error("Title must be between 3 and 120 characters")
  }

  // Description length validation (max 255 characters)
  if (metadata.description && metadata.description.length > 255) {
    throw new Error("Description must not exceed 255 characters")
  }

  // Location length validation (max 100 characters)
  if (metadata.location && metadata.location.length > 100) {
    throw new Error("Location must not exceed 100 characters")
  }

  // Validate locationCoords format if provided
  if (metadata.locationCoords) {
    const coordPattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/
    if (!coordPattern.test(metadata.locationCoords)) {
      throw new Error("locationCoords must be in 'lat,lng' format")
    }
  }

  // Validate numeric fields are positive
  if (metadata.mediaSize !== undefined && metadata.mediaSize < 0) {
    throw new Error("mediaSize must be a positive number")
  }

  if (metadata.mediaDuration !== undefined && metadata.mediaDuration < 0) {
    throw new Error("mediaDuration must be a positive number")
  }
}

/**
 * Creates a minimal metadata object with just the title
 * @param title - Asset title
 * @returns Minimal valid metadata
 */
export function createMinimalMetadata(title: string): CreateAssetMetadata {
  return { title }
}

/**
 * Merges multiple metadata objects (later values override earlier ones)
 * @param metadataObjects - Array of metadata objects to merge
 * @returns Merged metadata object
 */
export function mergeMetadata(
  ...metadataObjects: PartialMetadata[]
): CreateAssetMetadata {
  const merged: Partial<CreateAssetMetadata> = {}

  for (const metadata of metadataObjects) {
    Object.assign(merged, metadata)

    // Merge custom attributes separately to avoid overwriting
    if (metadata.custom) {
      merged.custom = { ...merged.custom, ...metadata.custom }
    }
  }

  // Ensure title exists
  if (!merged.title) {
    throw new Error("Merged metadata must include a title")
  }

  return merged as CreateAssetMetadata
}
