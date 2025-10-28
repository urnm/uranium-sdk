# API Reference

Complete reference for all Uranium SDK methods and types.

## Table of Contents

- [SDK Initialization](#sdk-initialization)
- [Account Router](#account-router)
- [Contracts Router](#contracts-router)
- [Assets Router](#assets-router)
- [Upload Manager](#upload-manager)
- [Validation Rules](#validation-rules)
- [Type Definitions](#type-definitions)
- [Status Codes](#status-codes)

## SDK Initialization

### UraniumSDK

Main SDK class providing access to all API routers.

```typescript
class UraniumSDK {
  constructor(config: UraniumConfig)

  readonly version: string
  readonly account: AccountRouter
  readonly contracts: ContractsRouter
  readonly assets: AssetsRouter
  readonly upload: UploadManager
}
```

**Configuration:**

```typescript
interface UraniumConfig {
  // Required
  apiKey: string;                    // API key from portal.uranium.pro

  // Optional
  baseUrl?: string;                  // API base URL (default: "https://gw.urnm.pro")
  timeout?: number;                  // Request timeout in ms (default: 20000)
  deviceId?: string;                 // Device identifier (auto-generated if not provided)
  debug?: boolean;                   // Enable debug logging (default: false)

  // Retry configuration
  retry?: {
    enabled?: boolean;               // Enable automatic retry (default: false)
    maxRetries?: number;             // Max retry attempts (default: 3)
    retryDelay?: number;             // Base delay in ms (default: 1000)
    retryableStatuses?: number[];    // HTTP codes to retry (default: [500, 502, 503, 504])
    onRetry?: (attempt: number, error: any, delayMs: number) => void | Promise<void>;
  };
}
```

**Example:**

```typescript
import { UraniumSDK } from "@uranium/sdk";

const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  debug: true,
  retry: {
    enabled: true,
    maxRetries: 3,
    onRetry: (attempt, error, delay) => {
      console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
    }
  }
});

console.log("SDK version:", sdk.version);
```

## Account Router

Operations for user account management.

### getMe()

Get current user information.

```typescript
account.getMe(
  deviceId: string,
  options?: RequestOptions
): Promise<UserEntity>
```

**Parameters:**
- `deviceId` - Device identifier (string)
- `options` - Optional request options

**Returns:** `UserEntity`

```typescript
interface UserEntity {
  userId: string;
  role: "USER" | "ADMIN";
  nickname?: string;
  phoneNumber?: string;
  publicKey?: string;
  verificationId?: string;
}
```

**Example:**

```typescript
const user = await sdk.account.getMe("sdk-device-123");

console.log("User ID:", user.userId);
console.log("Role:", user.role);
console.log("Is Admin:", user.role === "ADMIN");

// User role determines collection limits
// USER: 10 collections max
// ADMIN: 20 collections max
```

**Errors:**
- `AuthenticationError` - Invalid API key
- `NetworkError` - Network failure

---

## Contracts Router

Operations for NFT collection (smart contract) management.

### list()

Get all collections for the authenticated user.

```typescript
contracts.list(
  options?: RequestOptions
): Promise<ContractEntity[]>
```

**Parameters:**
- `options` - Optional request options

**Returns:** Array of `ContractEntity`

```typescript
interface ContractEntity {
  id: string;
  name: string;
  symbol: string;
  type: "ERC721" | "ERC1155";
  status: "PENDING" | "COMPLETE";
  contractAddress?: string;
  createdAt: string;
  updatedAt: string;
  collectionType: "CREATED" | "EXTERNAL" | "DEFAULT" | "SANDBOX";
  userId: string;
}
```

**Example:**

```typescript
const collections = await sdk.contracts.list();

console.log(`Found ${collections.length} collections`);

collections.forEach(collection => {
  console.log(`${collection.name} (${collection.symbol})`);
  console.log(`Type: ${collection.type}`);
  console.log(`Status: ${collection.status}`);
  console.log(`Address: ${collection.contractAddress}`);
});
```

**Errors:**
- `AuthenticationError` - Invalid API key
- `NetworkError` - Network failure

### create()

Create a new NFT collection.

```typescript
contracts.create(
  params: CreateContractParams,
  options?: RequestOptions
): Promise<ContractEntity>
```

**Parameters:**

```typescript
interface CreateContractParams {
  name: string;      // 3-30 chars, pattern: /^(?=[a-zA-Z0-9._\-\[\]]{3,30}$)/
  symbol: string;    // 3-30 chars, pattern: /^(?=[a-zA-Z0-9_]{3,30}$)/
  type: "ERC721" | "ERC1155";
}
```

**Validation:**
- Name: 3-30 characters, letters, numbers, and `._-[]`
- Symbol: 3-30 characters, letters, numbers, and underscore
- Type: Must be "ERC721" (single edition) or "ERC1155" (multi-edition)

**Collection Limits:**
- USER role: 10 collections maximum
- ADMIN role: 20 collections maximum

**Returns:** `ContractEntity`

**Example:**

```typescript
const collection = await sdk.contracts.create({
  name: "My NFT Collection",
  symbol: "MNFT",
  type: "ERC721"
});

console.log("Created collection:", collection.id);
console.log("Status:", collection.status);  // "PENDING"

// Wait for deployment
// Status will change to "COMPLETE" when contract is deployed
```

**Errors:**
- `ValidationError` - Invalid name/symbol format
- `LimitExceededError` - Collection limit reached
- `AuthenticationError` - Invalid API key
- `NetworkError` - Network failure

---

## Assets Router

Operations for NFT asset management.

### list()

List assets with optional filtering and pagination.

```typescript
assets.list(
  params?: FindUserAssetsRequestDto,
  options?: RequestOptions
): Promise<PaginatedResponse<AssetEntity>>
```

**Parameters:**

```typescript
interface FindUserAssetsRequestDto {
  contractId?: string;     // Filter by collection ID
  quickFilter?: string;    // Search by title
  sortBy?: "createdAt" | "title" | "status";  // Sort field (default: "createdAt")
  order?: "asc" | "desc";                     // Sort order (default: "asc")
  page?: number;           // Page number (default: 1, min: 1)
  pageSize?: number;       // Items per page (default: 10, min: 1, max: 100)
}
```

**Returns:** `PaginatedResponse<AssetEntity>`

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;        // Total items
    page: number;         // Current page
    pageSize: number;     // Items per page
    countPages: number;   // Total pages
  } | null;
}

interface AssetEntity {
  id: string;
  status: number;                    // AssetSVCStatus enum (0-14)
  contractAddress?: string;
  tokenId?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Example:**

```typescript
// List all assets
const { data, meta } = await sdk.assets.list();
console.log(`Total: ${meta?.total}, Page: ${meta?.page}/${meta?.countPages}`);

// Filter by collection
const collectionAssets = await sdk.assets.list({
  contractId: "collection-id",
  page: 1,
  pageSize: 20
});

// Search by title
const searchResults = await sdk.assets.list({
  quickFilter: "sunset",
  sortBy: "createdAt",
  order: "desc"
});

// Pagination
for (let page = 1; page <= meta.countPages; page++) {
  const { data } = await sdk.assets.list({ page, pageSize: 50 });
  console.log(`Page ${page}: ${data.length} assets`);
}
```

**Errors:**
- `ValidationError` - Invalid parameters
- `NotFoundError` - Collection not found
- `AuthenticationError` - Invalid API key
- `NetworkError` - Network failure

### prepareNewFile()

Prepare a new file upload and get presigned URLs.

```typescript
assets.prepareNewFile(
  params: PrepareNewFileRequestDto
): Promise<PrepareNewFileResponseDto>
```

**Parameters:**

```typescript
interface PrepareNewFileRequestDto {
  deviceId: string;
  metadata: string;       // JSON string of metadata
  type: FileType;         // "image" | "video" | "gif"
  source: FileSource;     // "upload" | "camera" | "gallery"
  fileSize: number;       // File size in bytes (max 100 MB)
  isPrivate?: boolean;    // Hide from public listings (default: false)
}
```

**Returns:** `PrepareNewFileResponseDto`

```typescript
interface PrepareNewFileResponseDto {
  fileId: string;
  uploadId: string;
  uploadPartUrls: Array<{
    partNumber: number;
    url: string;          // S3 presigned URL
  }>;
  chunkCount: number;
  chunkSize: number;
}
```

**Example:**

```typescript
const prepare = await sdk.assets.prepareNewFile({
  deviceId: "sdk-device-123",
  metadata: JSON.stringify({
    title: "My Artwork",
    description: "Beautiful piece"
  }),
  type: "image",
  source: "upload",
  fileSize: 5242880  // 5 MB
});

console.log("File ID:", prepare.fileId);
console.log("Chunks:", prepare.chunkCount);
console.log("Chunk size:", prepare.chunkSize);
```

**Errors:**
- `ValidationError` - Invalid file size or metadata
- `UploadError` - File too large (> 100 MB)
- `AuthenticationError` - Invalid API key
- `NetworkError` - Network failure

### completeUpload()

Complete a multipart file upload.

```typescript
assets.completeUpload(
  params: CompleteUploadRequestDto
): Promise<CompleteUploadResponseDto>
```

**Parameters:**

```typescript
interface CompleteUploadRequestDto {
  fileId: string;
  mimeType: string;
  chunks: Array<{
    partNumber: number;
    eTag: string;      // ETag from S3 upload response
  }>;
  disableThumbnail?: boolean;  // Skip thumbnail generation (default: false)
}
```

**Returns:** `CompleteUploadResponseDto`

```typescript
interface CompleteUploadResponseDto {
  status: string;      // "ok"
}
```

**Example:**

```typescript
await sdk.assets.completeUpload({
  fileId: prepare.fileId,
  mimeType: "image/png",
  chunks: [
    { partNumber: 1, eTag: "abc123..." },
    { partNumber: 2, eTag: "def456..." }
  ],
  disableThumbnail: false
});

console.log("Upload completed successfully");
```

**Errors:**
- `ValidationError` - Invalid fileId or chunks
- `UploadError` - Upload completion failed
- `AuthenticationError` - Invalid API key
- `NetworkError` - Network failure

### startMinting()

Start the NFT minting process.

```typescript
assets.startMinting(
  params: StartMintingRequestDto
): Promise<StartMintingResponseDataDto>
```

**Parameters:**

```typescript
interface StartMintingRequestDto {
  fileId: string;
  editions: number;           // 1 for ERC721, 1-1000 for ERC1155
  contractId: string;         // Collection ID
  shareWithCommunity?: boolean;  // Make discoverable (default: false)
  metadata: {
    attributes: Array<{
      key: string;
      value: string;
      type: 0 | 1 | 2;      // 0=STRING, 1=NUMBER, 2=BOOLEAN
    }>;
  };
}
```

**Returns:** `StartMintingResponseDataDto`

```typescript
interface StartMintingResponseDataDto {
  status: number;           // AssetSVCStatus enum (0-14)
  contractAddress?: string;
  tokenId?: string;
}
```

**Example:**

```typescript
const result = await sdk.assets.startMinting({
  fileId: prepare.fileId,
  editions: 1,
  contractId: "collection-id",
  shareWithCommunity: true,
  metadata: {
    attributes: [
      { key: "title", value: "My NFT", type: 0 },
      { key: "description", value: "Amazing artwork", type: 0 },
      { key: "rarity", value: "legendary", type: 0 }
    ]
  }
});

console.log("Minting status:", result.status);
console.log("Contract:", result.contractAddress);
console.log("Token ID:", result.tokenId);
```

**Errors:**
- `ValidationError` - Invalid editions or metadata
- `MintingError` - Minting process failed
- `NotFoundError` - Collection or file not found
- `AuthenticationError` - Invalid API key
- `NetworkError` - Network failure

---

## Upload Manager

High-level API for complete upload and minting workflow.

### upload()

Upload a file and mint it as an NFT in one operation.

```typescript
upload.upload(
  file: File | Buffer,
  options: UploadOptions
): Promise<AssetEntity>
```

**Parameters:**

```typescript
interface UploadOptions {
  // Required
  contractId: string;
  metadata: {
    title: string;           // 3-120 characters
    description?: string;    // Max 255 characters
    location?: string;       // Max 100 characters
  };

  // Optional
  editions?: number;         // 1 for ERC721, 1-1000 for ERC1155 (default: 1)
  shareWithCommunity?: boolean;  // Make discoverable (default: false)
  disableThumbnail?: boolean;    // Skip thumbnail generation (default: false)
  isPrivate?: boolean;           // Hide from public listings (default: false)

  // Callbacks
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

interface UploadProgress {
  stage: UploadStatus;       // Current stage
  percent: number;           // 0-100
  uploadedChunks: number;
  totalChunks: number;
  currentChunk: number;
  currentStatus: string;     // Human-readable message
}
```

**Returns:** `AssetEntity`

**Example:**

See [Upload Guide](./upload-guide.md) for complete examples.

```typescript
const asset = await sdk.upload.upload(file, {
  contractId: "collection-id",
  metadata: {
    title: "My NFT",
    description: "Beautiful artwork",
    location: "San Francisco"
  },
  editions: 1,
  onProgress: (progress) => {
    console.log(`${progress.percent}% - ${progress.currentStatus}`);
  }
});
```

**Errors:**
- `ValidationError` - Invalid file or metadata
- `UploadError` - Upload failed
- `MintingError` - Minting failed
- `AuthenticationError` - Invalid API key
- `NetworkError` - Network failure

---

## Validation Rules

Summary of validation constraints for API inputs.

### Collections

| Field | Min | Max | Pattern | Notes |
|-------|-----|-----|---------|-------|
| name | 3 | 30 | `[a-zA-Z0-9._\-\[\]]` | No consecutive special chars |
| symbol | 3 | 30 | `[a-zA-Z0-9_]` | No consecutive underscores |
| type | - | - | `ERC721 \| ERC1155` | Enum value |

### Assets

| Field | Min | Max | Pattern | Notes |
|-------|-----|-----|---------|-------|
| title | 3 | 120 | - | Required |
| description | 0 | 255 | - | Optional |
| location | 0 | 100 | - | Optional |
| editions | 1 | 1000 | - | 1 for ERC721 |
| fileSize | 1 | 104857600 | - | Max 100 MB |

### Pagination

| Field | Min | Max | Default | Notes |
|-------|-----|-----|---------|-------|
| page | 1 | - | 1 | Page number |
| pageSize | 1 | 100 | 10 | Items per page |
| sortBy | - | - | "createdAt" | Sort field |
| order | - | - | "asc" | Sort direction |

### Upload

| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| File size | 1 byte | 100 MB | Enforced by API |
| Chunk size | - | ~5 MB | Determined by API |
| MIME types | - | - | `image/*`, `video/*` |

---

## Type Definitions

### Enums

**AssetSVCStatus** (15 stages, 0-14):
```typescript
enum AssetSVCStatus {
  MEDIA_UPLOAD_INITIALIZING = 0,
  MEDIA_UPLOADING = 1,
  MEDIA_VERIFYING = 2,
  MEDIA_CONFIRMING = 3,
  MEDIA_CONFIRMED = 4,
  META_UPLOAD_INITIALIZING = 5,
  META_UPLOADING = 6,
  META_VERIFYING = 7,
  META_CONFIRMING = 8,
  META_CONFIRMED = 9,
  NFT_INITIALIZING = 10,
  NFT_SIGNING = 11,
  NFT_MINTING = 12,
  NFT_CONFIRMED = 13,
  NFT_ALL_BLOCK_CONFIRMED = 14
}
```

**FileType**:
```typescript
enum FileType {
  Image = "image",
  Video = "video",
  Gif = "gif",
  Unknown = "unknown"
}
```

**FileSource**:
```typescript
enum FileSource {
  Camera = "camera",
  Gallery = "gallery",
  Upload = "upload"
}
```

**ERCType**:
```typescript
enum ERCType {
  ERC721 = "ERC721",    // Single edition per token
  ERC1155 = "ERC1155"   // Multiple editions per token
}
```

**UserRole**:
```typescript
enum UserRole {
  USER = "USER",     // 10 collections max
  ADMIN = "ADMIN"    // 20 collections max
}
```

**CollectionStatus**:
```typescript
enum CollectionStatus {
  PENDING = "PENDING",     // Being deployed
  COMPLETE = "COMPLETE"    // Deployed and ready
}
```

### Request Options

Override SDK configuration per request:

```typescript
interface RequestOptions {
  retry?: {
    enabled?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: any, delayMs: number) => void | Promise<void>;
  };
}

// Example
await sdk.assets.list({}, {
  retry: {
    enabled: true,
    maxRetries: 5,
    retryDelay: 2000
  }
});
```

---

## Status Codes

### HTTP Status Codes

| Code | Meaning | SDK Error |
|------|---------|-----------|
| 200 | Success | - |
| 400 | Bad Request | `ValidationError` |
| 401 | Unauthorized | `AuthenticationError` |
| 403 | Forbidden | `AuthenticationError` |
| 404 | Not Found | `NotFoundError` |
| 408 | Timeout | `NetworkError` |
| 413 | Payload Too Large | `LimitExceededError` |
| 429 | Rate Limited | `LimitExceededError` |
| 500 | Internal Error | `NetworkError` |
| 502 | Bad Gateway | `NetworkError` (retryable) |
| 503 | Service Unavailable | `NetworkError` (retryable) |
| 504 | Gateway Timeout | `NetworkError` (retryable) |

### Asset Status Progress

Track minting progress with status codes:

| Stage | Status | Duration | Description |
|-------|--------|----------|-------------|
| 0 | MEDIA_UPLOAD_INITIALIZING | ~1-2s | Preparing upload |
| 1 | MEDIA_UPLOADING | ~5-10s | Uploading media |
| 2 | MEDIA_VERIFYING | ~2-3s | Verifying upload |
| 3 | MEDIA_CONFIRMING | ~1-2s | Confirming upload |
| 4 | MEDIA_CONFIRMED | instant | Upload complete |
| 5 | META_UPLOAD_INITIALIZING | ~1-2s | Preparing metadata |
| 6 | META_UPLOADING | ~2-5s | Uploading metadata |
| 7 | META_VERIFYING | ~2-3s | Verifying metadata |
| 8 | META_CONFIRMING | ~1-2s | Confirming metadata |
| 9 | META_CONFIRMED | instant | Metadata complete |
| 10 | NFT_INITIALIZING | ~2-3s | Preparing contract |
| 11 | NFT_SIGNING | ~1-2s | Signing transaction |
| 12 | NFT_MINTING | ~10-20s | Minting on blockchain |
| 13 | NFT_CONFIRMED | instant | NFT minted |
| 14 | NFT_ALL_BLOCK_CONFIRMED | instant | Fully confirmed |

**Total time:** 30-60 seconds from start to finish

### Helper Functions

```typescript
import {
  getAssetStatusText,
  isAssetMinted,
  transformSvcStatusToDbStatus
} from "@uranium/sdk";

// Get display text for status
const text = getAssetStatusText(AssetSVCStatus.NFT_MINTING);
console.log(text);  // "Minting NFT..."

// Check if fully minted
const isMinted = isAssetMinted(asset.status);
if (isMinted) {
  console.log("NFT is fully minted!");
}

// Convert numeric status to string enum
const uploadStatus = transformSvcStatusToDbStatus(12);
console.log(uploadStatus);  // "NFT_MINTING"
```

---

## Related Documentation

- [Upload Guide](./upload-guide.md)
- [Error Handling](./error-handling.md)
- [Architecture Overview](./architecture.md)
