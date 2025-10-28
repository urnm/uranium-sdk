# Core SDK Guide

This guide covers all features and capabilities of the Uranium SDK core package (`@uranium/sdk`).

## Table of Contents

- [SDK Class Overview](#sdk-class-overview)
- [Configuration Options](#configuration-options)
- [Account Operations](#account-operations)
- [Contract Management](#contract-management)
- [Asset Operations](#asset-operations)
- [File Upload System](#file-upload-system)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## SDK Class Overview

The `UraniumSDK` class is the main entry point for all SDK functionality:

```typescript
import UraniumSDK from "@uranium/sdk";

const sdk = new UraniumSDK({
  apiKey: "your-api-key"
});

// The SDK exposes four main interfaces:
sdk.account   // Account operations (user info)
sdk.contracts // Collection management
sdk.assets    // Asset operations (NFT management)
sdk.upload    // File upload and minting
```

## Configuration Options

### Basic Configuration

```typescript
const sdk = new UraniumSDK({
  apiKey: "your-api-key",          // Required
  baseUrl: "https://gw.urnm.pro",  // Optional: Custom API endpoint
  timeout: 20000,                  // Optional: Request timeout (ms)
  deviceId: "my-app-v1",           // Optional: Custom device identifier
  debug: false,                    // Optional: Enable debug logging
});
```

### Retry Configuration

Configure automatic retry behavior for failed requests:

```typescript
const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  retry: {
    enabled: true,              // Enable retry mechanism (default: false)
    maxRetries: 3,              // Maximum retry attempts (default: 3)
    retryDelay: 1000,           // Base delay between retries in ms (default: 1000)
    retryableStatuses: [500, 502, 503, 504], // Status codes to retry
    onRetry: (attempt, error, delayMs) => {
      console.log(`Retrying request (attempt ${attempt}) in ${delayMs}ms`);
    }
  }
});
```

**Retry Behavior:**
- Uses linear backoff: delay = attempt × retryDelay (1s, 2s, 3s)
- Only retries network errors and server errors (500, 502, 503, 504)
- Never retries authentication errors (401, 403) or rate limiting (429)
- Disabled by default to avoid unexpected behavior

### Per-Request Configuration

Override global retry settings for specific requests:

```typescript
// Override retry for a specific request
const collections = await sdk.contracts.list({
  retry: {
    enabled: true,
    maxRetries: 5,    // Use more retries for critical operations
    retryDelay: 2000  // Longer delay
  }
});

// Disable retry for a specific request
const quickFetch = await sdk.assets.list(
  { page: 1 },
  { retry: { enabled: false } }
);
```

### Debug Mode

Enable debug mode to log all requests and responses:

```typescript
const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  debug: true
});

// Console output:
// [Uranium SDK] Request: POST /clients-account/me { deviceId: "..." }
// [Uranium SDK] Response: 200 POST /clients-account/me { userId: "...", role: "USER" }
```

## Account Operations

### Get User Information

Retrieve information about the authenticated user:

```typescript
const user = await sdk.account.getMe("my-device-id");

console.log("User ID:", user.userId);
console.log("Role:", user.role);           // "USER" or "ADMIN"
console.log("Nickname:", user.nickname);
console.log("Phone:", user.phoneNumber);
console.log("Public Key:", user.publicKey);
```

**Response Type:**
```typescript
interface UserEntity {
  userId: string;
  role: "USER" | "ADMIN";
  nickname: string;
  phoneNumber: string;
  publicKey: string;
  verificationId: string | null;
}
```

### Role-Based Limits

Use the role to determine collection limits:

```typescript
const user = await sdk.account.getMe("my-app");

const maxCollections = user.role === "ADMIN" ? 20 : 10;
console.log(`You can create up to ${maxCollections} collections`);

// Check current collections
const collections = await sdk.contracts.list();
const remaining = maxCollections - collections.length;

console.log(`${remaining} collection slots remaining`);
```

## Contract Management

### List All Collections

Fetch all collections owned by the authenticated user:

```typescript
const collections = await sdk.contracts.list();

console.log(`Total collections: ${collections.length}`);

collections.forEach(contract => {
  console.log(`\n${contract.name} (${contract.symbol})`);
  console.log(`  ID: ${contract.id}`);
  console.log(`  Type: ${contract.ercType}`);        // "ERC721" or "ERC1155"
  console.log(`  Status: ${contract.status}`);       // "PENDING" or "COMPLETE"
  console.log(`  Address: ${contract.address}`);
  console.log(`  NFTs minted: ${contract.lastTokenId}`);
});
```

**Response Type:**
```typescript
interface ContractEntity {
  id: string;
  name: string;
  symbol: string;
  ercType: "ERC721" | "ERC1155";
  status: "PENDING" | "COMPLETE";
  address: string;
  lastTokenId: number;
  createdAt: string;
  updatedAt: string;
}
```

### Create a New Collection

Create a new NFT collection (smart contract):

```typescript
try {
  const collection = await sdk.contracts.create({
    name: "My Art Collection",
    symbol: "MYART",
    type: "ERC721"  // or "ERC1155" for multi-edition NFTs
  });

  console.log("Collection created successfully!");
  console.log("ID:", collection.id);
  console.log("Address:", collection.address);
  console.log("Status:", collection.status);

} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Invalid parameters:", error.message);
  } else if (error instanceof LimitExceededError) {
    console.error("Collection limit reached!");
  }
}
```

**Parameters:**
```typescript
interface CreateContractParams {
  name: string;      // 3-30 characters, letters/numbers and [_.-]
  symbol: string;    // 3-30 characters, letters/numbers and underscore
  type: "ERC721" | "ERC1155";
}
```

**Validation Rules:**
- **name**: 3-30 characters, can use letters, numbers, `_`, `.`, `-`, `[`, `]`
- **symbol**: 3-30 characters, only letters, numbers, and `_`
- **type**: Must be `"ERC721"` (unique NFTs) or `"ERC1155"` (multi-edition NFTs)

### Collection Types Explained

**ERC721 (Unique NFTs):**
- Each NFT is one-of-a-kind
- Editions parameter must be 1
- Best for art, collectibles, unique items

**ERC1155 (Multi-Edition NFTs):**
- Multiple copies of the same NFT
- Editions can be 1-1000
- Best for prints, tickets, game items

```typescript
// Create ERC721 collection
const uniqueCollection = await sdk.contracts.create({
  name: "Unique Art",
  symbol: "UNIART",
  type: "ERC721"
});

// Create ERC1155 collection
const editionCollection = await sdk.contracts.create({
  name: "Limited Prints",
  symbol: "PRINTS",
  type: "ERC1155"
});
```

## Asset Operations

### List Assets

Fetch assets with filtering, sorting, and pagination:

```typescript
// Simple list - get all assets
const allAssets = await sdk.assets.list({});

console.log(`Total assets: ${allAssets.meta.total}`);
console.log(`Page: ${allAssets.meta.page} of ${allAssets.meta.countPages}`);

allAssets.data.forEach(asset => {
  console.log(`${asset.title} - Status: ${asset.status}`);
});
```

### Filter by Collection

Get assets from a specific collection:

```typescript
const collectionAssets = await sdk.assets.list({
  contractId: "your-collection-id",
  page: 1,
  pageSize: 20
});

console.log(`Assets in collection: ${collectionAssets.meta.total}`);
```

### Search and Sort

Use advanced filtering options:

```typescript
const searchResults = await sdk.assets.list({
  quickFilter: "sunset",      // Search by title
  sortBy: "createdAt",        // Sort by creation date
  order: "desc",              // Newest first
  page: 1,
  pageSize: 10
});

console.log(`Found ${searchResults.data.length} matching assets`);
```

**List Parameters:**
```typescript
interface ListAssetsParams {
  contractId?: string;              // Filter by collection ID
  quickFilter?: string;             // Search by title
  sortBy?: "createdAt" | "title" | "status";  // Sort field
  order?: "asc" | "desc";          // Sort order
  page?: number;                   // Page number (default: 1)
  pageSize?: number;               // Items per page (default: 10, max: 100)
}
```

**Response Type:**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;       // Total items
    page: number;        // Current page
    pageSize: number;    // Items per page
    countPages: number;  // Total pages
  };
}
```

### Asset Status Tracking

**Important:** Asset status (AssetEntity.status) is different from client-side upload progress (UploadProgress.stage):
- **Asset Status**: Backend lifecycle stages tracked by the server and blockchain
- **Upload Progress**: Client-side stages during the upload API calls (see Upload System section)

Assets go through multiple backend status stages during the minting process:

```typescript
const asset = await sdk.assets.list({ contractId: "..." });

// Check asset status
switch (asset.data[0].status) {
  case "MEDIA_UPLOADING":
    console.log("File is being uploaded...");
    break;
  case "NFT_MINTING":
    console.log("NFT is being minted on blockchain...");
    break;
  case "NFT_ALL_BLOCK_CONFIRMED":
    console.log("NFT is fully confirmed!");
    break;
}
```

**Status Stages:**
1. MEDIA_UPLOAD_INITIALIZING
2. MEDIA_UPLOADING
3. MEDIA_VERIFYING
4. MEDIA_CONFIRMING
5. MEDIA_CONFIRMED
6. META_UPLOAD_INITIALIZING
7. META_UPLOADING
8. META_VERIFYING
9. META_CONFIRMING
10. META_CONFIRMED
11. NFT_INITIALIZING
12. NFT_SIGNING
13. NFT_MINTING
14. NFT_CONFIRMED
15. NFT_ALL_BLOCK_CONFIRMED (final status)

**Timeline:** Typically 30-60 seconds from start to final confirmation.

## File Upload System

The SDK provides two ways to upload files and mint NFTs.

### High-Level Upload (Recommended)

The easiest way - everything in one method:

```typescript
const asset = await sdk.upload.upload(file, {
  contractId: "your-collection-id",
  metadata: {
    title: "Beautiful Sunset",
    description: "A stunning sunset over the ocean",
    location: "San Francisco, CA"
  },
  editions: 1,                    // 1 for ERC721, 1-1000 for ERC1155
  shareWithCommunity: true,       // Make discoverable
  disableThumbnail: false,        // Generate thumbnails
  onProgress: (progress) => {
    console.log(`Stage: ${progress.stage}`);
    console.log(`Progress: ${progress.percent}%`);
    console.log(`Chunks: ${progress.uploadedChunks}/${progress.totalChunks}`);
  }
});

console.log("NFT minted successfully!");
console.log("Asset ID:", asset.id);
console.log("Media URL:", asset.mediaUrl);
```

**Upload Options:**
```typescript
interface UploadOptions {
  contractId: string;                    // Required: Collection ID
  metadata: UploadMetadata;              // Required: Asset metadata
  editions?: number;                     // Default: 1
  shareWithCommunity?: boolean;          // Default: false
  disableThumbnail?: boolean;            // Default: false
  isPrivate?: boolean;                   // Default: false
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;                  // For cancellation
}

interface UploadMetadata {
  title: string;          // Required: 3-120 characters
  description?: string;   // Optional: max 255 characters
  location?: string;      // Optional: max 100 characters
}
```

### Progress Tracking

The upload system reports progress through multiple stages:

```typescript
await sdk.upload.upload(file, {
  contractId: "...",
  metadata: { title: "..." },
  onProgress: (progress) => {
    // Client-side upload stages (progress.stage):
    // - VALIDATING (0-5%): Validating file and options
    // - PREPARING (5-12%): Requesting presigned URLs
    // - PROCESSING (12-18%): Converting file and splitting into chunks
    // - UPLOADING (18-75%): Uploading chunks to S3
    // - FINALIZING (75-85%): Completing upload and generating thumbnails
    // - REQUESTING_MINT (85-99%): Submitting NFT to mint queue
    // - DONE (100%): Upload complete

    console.log(`${progress.stage}: ${progress.percent.toFixed(0)}%`);

    if (progress.uploadedChunks > 0) {
      console.log(`Uploaded ${progress.uploadedChunks}/${progress.totalChunks} chunks`);
    }

    // Show chunk progress during UPLOADING stage
    if (progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined) {
      console.log(`Current chunk: ${progress.chunkProgress.toFixed(0)}%`);
    }
  }
});
```

### Cancel Uploads

Use AbortController to cancel long-running uploads:

```typescript
const abortController = new AbortController();

// Start upload
const uploadPromise = sdk.upload.upload(file, {
  contractId: "...",
  metadata: { title: "..." },
  signal: abortController.signal
});

// Cancel after 5 seconds
setTimeout(() => {
  abortController.abort();
  console.log("Upload cancelled");
}, 5000);

try {
  await uploadPromise;
} catch (error) {
  if (error instanceof UploadError && error.message.includes("aborted")) {
    console.log("Upload was cancelled by user");
  }
}
```

### Low-Level Upload API

For full control over the upload process:

```typescript
import { uploadChunk } from "@uranium/sdk";

// 1. Prepare upload
const prep = await sdk.assets.prepareNewFile({
  deviceId: "my-device",
  metadata: JSON.stringify({
    attributes: [
      { key: "title", value: "My NFT", type: 0 },
      { key: "appName", value: "my-app", type: 0 },
      { key: "appVersion", value: "1.0.0", type: 0 }
    ]
  }),
  type: "image",          // "image" | "video" | "gif"
  source: "upload",       // "upload" | "camera" | "gallery"
  fileSize: file.size,
  isPrivate: false
});

console.log("File ID:", prep.fileId);
console.log("Chunks to upload:", prep.chunkCount);

// 2. Upload chunks
const completedChunks = [];

for (const part of prep.uploadPartUrls) {
  const start = (part.partNumber - 1) * prep.chunkSize;
  const end = Math.min(start + prep.chunkSize, file.size);
  const chunkData = await file.slice(start, end).arrayBuffer();

  // Upload chunk with retry
  const eTag = await uploadChunk({
    url: part.url,
    data: chunkData,
    onProgress: (p) => {
      console.log(`Chunk ${part.partNumber}: ${(p * 100).toFixed(0)}%`);
    }
  });

  completedChunks.push({
    partNumber: part.partNumber,
    eTag: eTag
  });
}

// 3. Complete upload
await sdk.assets.completeUpload({
  fileId: prep.fileId,
  mimeType: file.type,
  chunks: completedChunks,
  disableThumbnail: false
});

// 4. Start minting
const mintResponse = await sdk.assets.startMinting({
  fileId: prep.fileId,
  contractId: "your-collection-id",
  editions: 1,
  shareWithCommunity: false,
  metadata: {
    attributes: [
      { key: "title", value: "My NFT", type: 0 },
      { key: "appName", value: "my-app", type: 0 },
      { key: "appVersion", value: "1.0.0", type: 0 }
    ]
  }
});

console.log("Minting started:", mintResponse.data?.status);
```

### File Size Limits

- **Maximum file size:** 100 MB
- **Chunk size:** Automatically determined by the API (~5 MB per chunk)
- **Supported types:** Images, videos, GIFs

### Metadata Attributes

Metadata is stored as key-value pairs with types:

```typescript
interface MetadataAttribute {
  key: string;
  value: string;    // Always string, even for numbers/booleans
  type: 0 | 1 | 2;  // 0 = STRING, 1 = NUMBER, 2 = BOOLEAN
}

// Example metadata
const metadata = {
  attributes: [
    { key: "title", value: "Sunset Photo", type: 0 },
    { key: "description", value: "Beautiful sunset", type: 0 },
    { key: "location", value: "California", type: 0 },
    { key: "year", value: "2024", type: 1 },          // NUMBER
    { key: "featured", value: "true", type: 2 }       // BOOLEAN
  ]
};
```

## Error Handling

### Error Classes

The SDK provides typed error classes:

```typescript
import {
  UraniumError,           // Base error class
  AuthenticationError,    // 401, 403 errors
  ValidationError,        // 400, 422 errors
  NetworkError,          // Network failures
  NotFoundError,         // 404 errors
  LimitExceededError,    // Collection limit reached
  UploadError,           // Upload failures
  MintingError,          // Minting failures
  isUraniumError,        // Type guard
} from "@uranium/sdk";
```

### Basic Error Handling

```typescript
try {
  const collections = await sdk.contracts.list();
} catch (error) {
  if (isUraniumError(error)) {
    console.error("Uranium Error:", error.message);
    console.error("Error Code:", error.code);
    console.error("Status Code:", error.statusCode);
  } else {
    console.error("Unknown error:", error);
  }
}
```

### Specific Error Handling

```typescript
import {
  AuthenticationError,
  ValidationError,
  NetworkError,
  LimitExceededError
} from "@uranium/sdk";

try {
  const collection = await sdk.contracts.create({
    name: "My Collection",
    symbol: "MC",
    type: "ERC721"
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key. Please check your credentials.");
  } else if (error instanceof ValidationError) {
    console.error("Invalid parameters:", error.message);
    if (error.fields) {
      // Show field-specific errors
      console.error("Field errors:", error.fields);
    }
  } else if (error instanceof LimitExceededError) {
    console.error("Collection limit reached. Delete or upgrade.");
  } else if (error instanceof NetworkError) {
    console.error("Network error. Please check your connection.");
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Validation Errors

Validation errors include detailed field information:

```typescript
try {
  const collection = await sdk.contracts.create({
    name: "X",  // Too short!
    symbol: "Y", // Too short!
    type: "ERC721"
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Validation failed:", error.message);

    // Access field-specific errors
    if (error.fields) {
      for (const [field, messages] of Object.entries(error.fields)) {
        console.error(`${field}:`);
        messages.forEach(msg => console.error(`  - ${msg}`));
      }
    }
  }
}
```

## Advanced Usage

### Using Low-Level API

For advanced use cases, you can use the low-level API directly:

```typescript
import { createApiRouters } from "@uranium/sdk";

// Create routers directly without SDK class
const api = createApiRouters({
  apiKey: "your-api-key",
  timeout: 30000,
  baseUrl: "https://gw.urnm.pro"
});

// Use routers directly
const user = await api.account.getMe("device-id");
const collections = await api.contracts.list();
```

### Custom Axios Client

Create a custom axios client for advanced configuration:

```typescript
import {
  createApiClient,
  createApiRoutersFromClient
} from "@uranium/sdk";

// Create custom axios client
const customClient = createApiClient({
  apiKey: "your-api-key",
  timeout: 30000,
  retry: {
    enabled: true,
    maxRetries: 5,
    retryDelay: 2000
  }
});

// Add custom interceptors
customClient.interceptors.request.use(config => {
  // Custom request logic
  return config;
});

// Create routers from custom client
const api = createApiRoutersFromClient(customClient);
```

### Device Management

The SDK uses device IDs to track API usage:

```typescript
import { generateDeviceId } from "@uranium/sdk";

// Generate a unique device ID
const deviceId = generateDeviceId();
console.log(deviceId); // "sdk-{uuid}"

// Use custom device ID
const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  deviceId: "my-custom-device-id"
});
```

### Manual Validation

For advanced use cases, use validation schemas directly:

```typescript
import {
  validateSchema,
  createContractSchema,
  assetTitleSchema,
  editionsSchema
} from "@uranium/sdk/validation";

// Validate a single field
try {
  const title = validateSchema(assetTitleSchema, "My NFT");
  console.log("Valid title:", title);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Invalid title:", error.message);
  }
}

// Validate complex object
try {
  const params = validateSchema(createContractSchema, {
    name: "My Collection",
    symbol: "MC",
    type: "ERC721"
  });
  console.log("Valid parameters:", params);
} catch (error) {
  console.error("Validation failed:", error);
}
```

### TypeScript Utilities

The SDK exports useful TypeScript types:

```typescript
import type {
  ContractEntity,
  AssetEntity,
  UserEntity,
  UraniumConfig,
  UploadOptions,
  UploadProgress,
  PaginatedResponse
} from "@uranium/sdk";

// Use types in your application
function processCollection(collection: ContractEntity) {
  console.log(collection.name);
}

function trackProgress(progress: UploadProgress) {
  console.log(`${progress.stage}: ${progress.percent}%`);
}
```

## Best Practices

### 1. Store API Keys Securely

Never hardcode API keys in your source code:

```typescript
// Good
const sdk = new UraniumSDK({
  apiKey: process.env.URANIUM_API_KEY!
});

// Bad - DON'T DO THIS
const sdk = new UraniumSDK({
  apiKey: "ur_api_key_12345..."  // Never hardcode!
});
```

### 2. Handle Errors Gracefully

Always wrap SDK calls in try-catch blocks:

```typescript
async function createCollection() {
  try {
    const collection = await sdk.contracts.create({...});
    return { success: true, collection };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: "Invalid input" };
    }
    return { success: false, error: "Unknown error" };
  }
}
```

### 3. Use Progress Callbacks

Provide feedback to users during long operations:

```typescript
await sdk.upload.upload(file, {
  contractId: "...",
  metadata: { title: "..." },
  onProgress: (progress) => {
    // Update UI with progress
    updateProgressBar(progress.percent);
    showStatus(progress.stage);
  }
});
```

### 4. Enable Retry for Critical Operations

Enable retry for important operations that should not fail:

```typescript
// Critical data fetch with retry
const collections = await sdk.contracts.list({
  retry: {
    enabled: true,
    maxRetries: 5
  }
});
```

### 5. Validate Before API Calls

Use validation schemas to catch errors early:

```typescript
import { validateSchema, assetTitleSchema } from "@uranium/sdk/validation";

function uploadAsset(title: string, file: File) {
  // Validate early
  try {
    validateSchema(assetTitleSchema, title);
  } catch (error) {
    // Show error to user immediately
    return { error: "Invalid title" };
  }

  // Now upload with confidence
  return sdk.upload.upload(file, {
    contractId: "...",
    metadata: { title }
  });
}
```

## Performance Tips

### 1. Reuse SDK Instances

Create one SDK instance and reuse it:

```typescript
// Good - create once
const sdk = new UraniumSDK({ apiKey: "..." });

export async function getCollections() {
  return sdk.contracts.list();
}

export async function getAssets() {
  return sdk.assets.list({});
}

// Bad - creates new instance every time
export async function getCollections() {
  const sdk = new UraniumSDK({ apiKey: "..." });
  return sdk.contracts.list();
}
```

### 2. Use Pagination

Don't fetch all assets at once:

```typescript
// Good - paginated
const firstPage = await sdk.assets.list({
  page: 1,
  pageSize: 20
});

// Bad - fetching everything
const allAssets = await sdk.assets.list({
  pageSize: 100  // Max limit
});
```

### 3. Cancel Unnecessary Uploads

Use AbortSignal to cancel uploads when users navigate away:

```typescript
const controller = new AbortController();

// Start upload
const upload = sdk.upload.upload(file, {
  contractId: "...",
  metadata: { title: "..." },
  signal: controller.signal
});

// User navigates away
window.addEventListener("beforeunload", () => {
  controller.abort();
});
```

## Next Steps

- **[React Integration Guide](./react-integration.md)** - Use the SDK in React applications
- **[Getting Started](./getting-started.md)** - Back to basics

## Need Help?

Check the error messages carefully - the SDK provides detailed error descriptions. Enable debug mode to see full request/response logs. Contact support through the Uranium portal for additional assistance.
