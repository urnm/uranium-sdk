# Upload Guide

Complete guide to uploading files and minting NFTs with the Uranium SDK.

## Table of Contents

- [Overview](#overview)
- [Upload Workflow](#upload-workflow)
- [High-Level API](#high-level-api)
- [Low-Level API](#low-level-api)
- [File Requirements](#file-requirements)
- [Progress Tracking](#progress-tracking)
- [Cancellation](#cancellation)
- [Metadata Structure](#metadata-structure)
- [Error Handling](#error-handling)
- [Complete Examples](#complete-examples)

## Overview

The Uranium SDK provides two approaches for uploading files and minting NFTs:

1. **High-Level API**: Single method that handles the entire workflow with progress tracking
2. **Low-Level API**: Individual methods for each step, providing maximum control

Both approaches support:
- Chunked uploads for large files
- Automatic retry with exponential backoff
- Progress callbacks
- Cancellation via AbortSignal
- Comprehensive error handling

## Upload Workflow

The upload and minting process consists of 7 client-side stages. Note that these stages represent **client-side operations**, not the backend asset status. After the upload completes, the NFT is minted asynchronously by the blockchain.

```
┌─────────────────────────────────────────────────────────────┐
│              Client-Side Upload & Mint Workflow              │
└─────────────────────────────────────────────────────────────┘

1. VALIDATING (0-5%)
   ├─ Validate file size (max 100 MB)
   ├─ Validate file type (image/video/gif)
   ├─ Validate metadata (title, description, location)
   └─ Validate upload options

2. PREPARING (5-12%)
   ├─ Call prepareNewFile API
   ├─ Receive presigned S3 upload URLs
   ├─ Receive chunk configuration
   └─ Initialize upload session

3. PROCESSING (12-18%)
   ├─ Convert file to ArrayBuffer
   ├─ Split into chunks (~5 MB each)
   └─ Prepare chunk metadata

4. UPLOADING (18-75%)
   ├─ Upload chunks sequentially to S3
   ├─ Track progress per chunk (chunkProgress field)
   ├─ Automatic retry on failures
   └─ Collect ETags for verification

5. FINALIZING (75-85%)
   ├─ Call completeUpload API
   ├─ S3 multipart upload finalization
   ├─ Backend integrity verification
   └─ Generate thumbnails (if enabled)

6. REQUESTING_MINT (85-99%)
   ├─ Call startMinting API
   ├─ Submit NFT to mint queue
   ├─ NFT will be minted asynchronously
   └─ Return AssetEntity with pending status

7. DONE (100%)
   └─ Upload complete, NFT submitted to blockchain
```

**Important Notes:**
- These are **client-side stages** tracking local operations and API calls
- After DONE, the NFT is queued for minting on the blockchain
- Actual minting happens asynchronously in the backend
- The returned asset may still have a pending status
- Monitor the asset status separately to track blockchain confirmation

**Total time:** 30-90 seconds depending on file size and network speed

## High-Level API

### sdk.upload.upload()

Single method that orchestrates the entire upload and minting process.

**Signature:**
```typescript
async upload(
  file: File | Buffer,
  options: UploadOptions
): Promise<AssetEntity>
```

**Parameters:**

```typescript
interface UploadOptions {
  // Required
  contractId: string;        // Collection ID to mint into
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
  signal?: AbortSignal;      // For cancellation
}
```

**Progress Interface:**

```typescript
interface UploadProgress {
  stage: ClientUploadStage;  // Current client-side stage enum
  percent: number;           // 0-100
  uploadedChunks: number;    // Chunks completed
  totalChunks: number;       // Total chunks
  currentChunk: number;      // Current chunk index (1-based)
  currentStatus: string;     // Human-readable message
  chunkProgress?: number;    // Current chunk upload progress (0-100), only during UPLOADING stage
}
```

**Client Upload Stages:**
- `VALIDATING` (0-5%) - Validating file and options
- `PREPARING` (5-12%) - Requesting presigned URLs from API
- `PROCESSING` (12-18%) - Converting file and splitting into chunks
- `UPLOADING` (18-75%) - Uploading chunks to S3
- `FINALIZING` (75-85%) - Completing upload and generating thumbnails
- `REQUESTING_MINT` (85-99%) - Submitting NFT to mint queue
- `DONE` (100%) - Upload complete

**Note:** These stages track client-side operations only. The NFT minting happens asynchronously on the blockchain after the upload completes.

**Example:**

```typescript
import { UraniumSDK } from "@uranium/sdk";

const sdk = new UraniumSDK({ apiKey: "your-api-key" });

// Upload with progress tracking
const asset = await sdk.upload.upload(file, {
  contractId: "collection-id",
  metadata: {
    title: "My Artwork",
    description: "Beautiful digital art",
    location: "San Francisco, CA"
  },
  editions: 1,
  shareWithCommunity: true,
  onProgress: (progress) => {
    console.log(`${progress.percent}% - ${progress.currentStatus}`);
    console.log(`Stage: ${progress.stage}`);
    console.log(`Chunks: ${progress.uploadedChunks}/${progress.totalChunks}`);

    // During UPLOADING stage, track individual chunk progress
    if (progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined) {
      console.log(`Current chunk progress: ${progress.chunkProgress}%`);
    }
  }
});

console.log("Minted NFT:", asset.id);
```

## Low-Level API

For advanced use cases requiring fine-grained control over each step.

### Step 1: Prepare Upload

Request presigned URLs for chunk uploads.

```typescript
const prepareResult = await sdk.assets.prepareNewFile({
  deviceId: "sdk-device-id",
  metadata: JSON.stringify({
    title: "My Artwork",
    description: "Beautiful digital art",
    location: "San Francisco, CA"
  }),
  type: FileType.Image,       // Image | Video | Gif
  source: FileSource.Upload,  // Upload | Camera | Gallery
  fileSize: file.size,
  isPrivate: false
});

// Response includes:
// - fileId: string
// - uploadId: string
// - uploadPartUrls: Array<{ partNumber: number, url: string }>
// - chunkCount: number
// - chunkSize: number
```

### Step 2: Upload Chunks

Upload each chunk to its presigned URL.

```typescript
import { uploadChunk } from "@uranium/sdk";

const eTags: Array<{ partNumber: number, eTag: string }> = [];

for (const part of prepareResult.uploadPartUrls) {
  const start = (part.partNumber - 1) * prepareResult.chunkSize;
  const end = Math.min(start + prepareResult.chunkSize, file.size);
  const chunkData = await file.slice(start, end).arrayBuffer();

  const eTag = await uploadChunk({
    url: part.url,
    data: chunkData,
    onProgress: (progress) => {
      console.log(`Chunk ${part.partNumber}: ${(progress * 100).toFixed(0)}%`);
    }
  });

  eTags.push({ partNumber: part.partNumber, eTag });
}
```

**Chunk Upload Features:**
- Automatic retry (3 attempts)
- Exponential backoff: 1s, 2s, 4s
- Progress callbacks per chunk
- AbortSignal support

### Step 3: Complete Upload

Finalize the multipart upload with ETags.

```typescript
await sdk.assets.completeUpload({
  fileId: prepareResult.fileId,
  mimeType: file.type,
  chunks: eTags,
  disableThumbnail: false
});
```

### Step 4: Start Minting

Begin the NFT minting process.

```typescript
const mintingResult = await sdk.assets.startMinting({
  fileId: prepareResult.fileId,
  editions: 1,
  contractId: "collection-id",
  shareWithCommunity: true,
  metadata: {
    attributes: [
      { key: "title", value: "My Artwork", type: 0 },
      { key: "description", value: "Beautiful digital art", type: 0 },
      { key: "appName", value: "uranium-sdk", type: 0 },
      { key: "appVersion", value: "0.1.0", type: 0 }
    ]
  }
});

// Response includes:
// - status: number (AssetSVCStatus enum)
// - contractAddress?: string
// - tokenId?: string
```

## File Requirements

### Size Limits

- **Maximum file size:** 100 MB
- **Minimum file size:** > 0 bytes
- **Chunk size:** ~5 MB (determined by API)

### Supported File Types

**Images:**
- PNG, JPG/JPEG, GIF, WebP
- MIME types: `image/*`

**Videos:**
- MP4, MOV, AVI, WebM
- MIME types: `video/*`

**Detection:**
File type is automatically detected from MIME type:
- `image/gif` → `FileType.Gif`
- `image/*` → `FileType.Image`
- `video/*` → `FileType.Video`

### Cross-Platform Support

**Browser:**
```typescript
const file = document.getElementById('input').files[0];
await sdk.upload.upload(file, options);
```

**Node.js:**
```typescript
const fileBuffer = await Bun.file('path/to/file.png').arrayBuffer();
const buffer = Buffer.from(fileBuffer);
await sdk.upload.upload(buffer, options);
```

## Progress Tracking

### Understanding Client-Side Stages

The progress tracking system reports **client-side stages** that represent local operations and API calls made by the SDK. These stages are different from backend asset statuses:

**Client-Side Stages (UploadProgress.stage):**
- Track what the SDK is doing right now
- Move sequentially from VALIDATING to DONE
- Complete when the upload finishes and NFT is submitted
- Percentage ranges: VALIDATING (0-5%), PREPARING (5-12%), PROCESSING (12-18%), UPLOADING (18-75%), FINALIZING (75-85%), REQUESTING_MINT (85-99%), DONE (100%)

**Backend Asset Status (AssetEntity.status):**
- Track the NFT's lifecycle on the blockchain
- May still be "pending" after client upload completes
- Updated asynchronously as the blockchain processes the mint
- Use separate polling to monitor blockchain status

**Important:** When `progress.stage` reaches `DONE`, the upload is complete and the NFT has been submitted to the mint queue. However, the actual blockchain minting happens asynchronously. The returned asset may have a pending status initially.

### Progress Callback

Track upload progress with detailed stage information:

```typescript
await sdk.upload.upload(file, {
  contractId: "collection-id",
  metadata: { title: "My NFT" },
  onProgress: (progress) => {
    // Update UI based on client-side stage
    switch (progress.stage) {
      case "VALIDATING":
        console.log("Validating file and options...");
        break;
      case "PREPARING":
        console.log("Requesting upload URLs...");
        break;
      case "PROCESSING":
        console.log("Processing file...");
        break;
      case "UPLOADING":
        console.log(`Uploading: ${progress.percent}%`);
        console.log(`Chunk ${progress.currentChunk}/${progress.totalChunks}`);
        if (progress.chunkProgress !== undefined) {
          console.log(`Chunk progress: ${progress.chunkProgress}%`);
        }
        break;
      case "FINALIZING":
        console.log("Finalizing upload...");
        break;
      case "REQUESTING_MINT":
        console.log("Submitting NFT to mint queue...");
        break;
      case "DONE":
        console.log("Complete! NFT will be minted asynchronously.");
        break;
    }
  }
});
```

### Fine-Grained Chunk Progress

During the `UPLOADING` stage, the SDK provides fine-grained progress tracking for individual chunks via the `chunkProgress` field:

```typescript
await sdk.upload.upload(file, {
  contractId: "collection-id",
  metadata: { title: "My NFT" },
  onProgress: (progress) => {
    if (progress.stage === 'UPLOADING') {
      // Overall upload progress (18-75%)
      console.log(`Overall: ${progress.percent}%`);

      // Current chunk being uploaded
      console.log(`Chunk ${progress.currentChunk} of ${progress.totalChunks}`);

      // Progress within the current chunk (0-100%)
      if (progress.chunkProgress !== undefined) {
        console.log(`Current chunk: ${progress.chunkProgress}%`);
      }
    }
  }
});
```

**Use Cases:**
- Show dual progress bars (overall + current chunk)
- Provide detailed feedback for large file uploads
- Debug upload performance issues
- Calculate estimated time remaining per chunk

**Note:** The `chunkProgress` field is only available during the `UPLOADING` stage and is `undefined` in other stages.

### React Hook with Progress

```typescript
import { useUploadAsset } from "@uranium/react";

function UploadComponent() {
  const { uploadAsset, isLoading, progress, error } = useUploadAsset();

  const handleUpload = async (file: File) => {
    await uploadAsset({
      file,
      options: {
        contractId: "collection-id",
        metadata: { title: "My NFT" }
      }
    });
  };

  return (
    <div>
      {progress && (
        <div>
          <progress value={progress.percent} max={100} />
          <p>{progress.currentStatus}</p>
          <p>Stage: {progress.stage}</p>
          <p>Chunk {progress.currentChunk} of {progress.totalChunks}</p>

          {/* Show chunk progress during UPLOADING */}
          {progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined && (
            <div>
              <p>Current chunk: {progress.chunkProgress.toFixed(0)}%</p>
              <progress value={progress.chunkProgress} max={100} />
            </div>
          )}
        </div>
      )}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## Cancellation

### Using AbortController

Cancel long-running uploads with AbortSignal:

```typescript
const controller = new AbortController();

// Start upload
const uploadPromise = sdk.upload.upload(file, {
  contractId: "collection-id",
  metadata: { title: "My NFT" },
  signal: controller.signal
});

// Cancel after 10 seconds
setTimeout(() => {
  controller.abort();
}, 10000);

try {
  await uploadPromise;
} catch (error) {
  if (error.code === "UPLOAD_CANCELLED") {
    console.log("Upload was cancelled");
  }
}
```

### React Hook with Cancellation

```typescript
function UploadComponent() {
  const controllerRef = useRef<AbortController>();
  const { uploadAsset } = useUploadAsset();

  const handleUpload = async (file: File) => {
    controllerRef.current = new AbortController();

    try {
      await uploadAsset({
        file,
        options: {
          contractId: "collection-id",
          metadata: { title: "My NFT" },
          signal: controllerRef.current.signal
        }
      });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleCancel = () => {
    controllerRef.current?.abort();
  };

  return (
    <div>
      <button onClick={() => handleUpload(file)}>Upload</button>
      <button onClick={handleCancel}>Cancel</button>
    </div>
  );
}
```

## Metadata Structure

### Required Attributes

```typescript
{
  title: string;  // 3-120 characters, required
}
```

### Optional Attributes

```typescript
{
  description?: string;  // Max 255 characters
  location?: string;     // Max 100 characters
}
```

### Validation Rules

**Title:**
- Minimum: 3 characters
- Maximum: 120 characters
- Cannot be empty or whitespace only

**Description:**
- Maximum: 255 characters
- Can be empty or undefined

**Location:**
- Maximum: 100 characters
- Can be empty or undefined

### Metadata in API Format

The SDK automatically converts metadata to the required API format:

```typescript
// Your input
{
  title: "My Artwork",
  description: "Beautiful piece",
  location: "San Francisco"
}

// API format (handled automatically)
{
  attributes: [
    { key: "title", value: "My Artwork", type: 0 },           // STRING
    { key: "description", value: "Beautiful piece", type: 0 }, // STRING
    { key: "location", value: "San Francisco", type: 0 },      // STRING
    { key: "appName", value: "uranium-sdk", type: 0 },
    { key: "appVersion", value: "0.1.0", type: 0 }
  ]
}
```

**Attribute Types:**
- `0` = STRING
- `1` = NUMBER
- `2` = BOOLEAN

## Error Handling

### Common Errors

**ValidationError:**
```typescript
try {
  await sdk.upload.upload(file, {
    contractId: "collection-id",
    metadata: { title: "Hi" }  // Too short (min 3 chars)
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Validation failed:", error.message);
    console.error("Error code:", error.code);  // INVALID_INPUT
  }
}
```

**UploadError:**
```typescript
try {
  await sdk.upload.upload(largeFile, options);  // > 100 MB
} catch (error) {
  if (error instanceof UploadError) {
    console.error("Upload failed:", error.message);
    console.error("Error code:", error.code);  // FILE_TOO_LARGE
  }
}
```

**NetworkError:**
```typescript
try {
  await sdk.upload.upload(file, options);
} catch (error) {
  if (error instanceof NetworkError) {
    console.error("Network error:", error.message);
    console.error("HTTP status:", error.statusCode);
    console.error("Retryable:", error.retryable);
  }
}
```

### Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `INVALID_FILE_TYPE` | Unsupported file type | No |
| `FILE_TOO_LARGE` | File exceeds 100 MB | No |
| `INVALID_FILE_SIZE` | File size is 0 or negative | No |
| `VALIDATION_ERROR` | Metadata validation failed | No |
| `UPLOAD_FAILED` | Upload failed after retries | No |
| `UPLOAD_CANCELLED` | User cancelled upload | No |
| `UPLOAD_ABORTED` | Upload aborted via AbortSignal | No |
| `CHUNK_UPLOAD_FAILED` | Chunk upload failed | Yes (auto-retry) |
| `ETAG_MISSING` | Failed to extract ETag | No |
| `NETWORK_ERROR` | Network connectivity issue | Yes |

## Complete Examples

### Basic Upload

```typescript
import { UraniumSDK } from "@uranium/sdk";

const sdk = new UraniumSDK({ apiKey: "your-api-key" });

async function uploadNFT(file: File, contractId: string) {
  try {
    const asset = await sdk.upload.upload(file, {
      contractId,
      metadata: {
        title: "My First NFT",
        description: "Created with Uranium SDK",
        location: "New York, NY"
      },
      editions: 1,
      shareWithCommunity: true
    });

    console.log("Success! Asset ID:", asset.id);
    console.log("Contract:", asset.contractAddress);
    console.log("Token ID:", asset.tokenId);

    return asset;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}
```

### Upload with Progress Bar

```typescript
async function uploadWithProgress(file: File, contractId: string) {
  const asset = await sdk.upload.upload(file, {
    contractId,
    metadata: { title: "My NFT" },
    onProgress: (progress) => {
      // Update progress bar
      const progressBar = document.getElementById("progress") as HTMLProgressElement;
      progressBar.value = progress.percent;

      // Update status text
      const statusText = document.getElementById("status") as HTMLSpanElement;
      statusText.textContent = progress.currentStatus;

      // Log detailed info
      console.log(`Stage: ${progress.stage}`);
      console.log(`Progress: ${progress.percent}%`);
      console.log(`Chunks: ${progress.uploadedChunks}/${progress.totalChunks}`);

      // Show chunk progress during UPLOADING
      if (progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined) {
        console.log(`Current chunk: ${progress.chunkProgress}%`);
      }
    }
  });

  return asset;
}
```

### Upload with Cancellation

```typescript
class UploadManager {
  private controller?: AbortController;

  async startUpload(file: File, contractId: string) {
    this.controller = new AbortController();

    try {
      const asset = await sdk.upload.upload(file, {
        contractId,
        metadata: { title: "Cancellable Upload" },
        signal: this.controller.signal,
        onProgress: (progress) => {
          console.log(`${progress.percent}% - ${progress.currentStatus}`);
        }
      });

      return asset;
    } catch (error) {
      if (error.code === "UPLOAD_CANCELLED") {
        console.log("Upload was cancelled by user");
        return null;
      }
      throw error;
    }
  }

  cancelUpload() {
    this.controller?.abort();
    this.controller = undefined;
  }
}

// Usage
const manager = new UploadManager();
const uploadPromise = manager.startUpload(file, "collection-id");

// Cancel after 5 seconds
setTimeout(() => manager.cancelUpload(), 5000);
```

### Low-Level Upload (Full Control)

```typescript
async function manualUpload(file: File, contractId: string) {
  // Step 1: Prepare
  const prepare = await sdk.assets.prepareNewFile({
    deviceId: "my-device-id",
    metadata: JSON.stringify({ title: "Manual Upload" }),
    type: FileType.Image,
    source: FileSource.Upload,
    fileSize: file.size,
    isPrivate: false
  });

  console.log(`Prepared upload: ${prepare.fileId}`);
  console.log(`Will upload ${prepare.chunkCount} chunks`);

  // Step 2: Upload chunks
  const eTags: Array<{ partNumber: number, eTag: string }> = [];

  for (const part of prepare.uploadPartUrls) {
    const start = (part.partNumber - 1) * prepare.chunkSize;
    const end = Math.min(start + prepare.chunkSize, file.size);
    const chunkData = await file.slice(start, end).arrayBuffer();

    console.log(`Uploading chunk ${part.partNumber}...`);

    const eTag = await uploadChunk({
      url: part.url,
      data: chunkData
    });

    eTags.push({ partNumber: part.partNumber, eTag });
    console.log(`Chunk ${part.partNumber} uploaded with ETag: ${eTag}`);
  }

  // Step 3: Complete upload
  console.log("Completing upload...");
  await sdk.assets.completeUpload({
    fileId: prepare.fileId,
    mimeType: file.type,
    chunks: eTags,
    disableThumbnail: false
  });

  // Step 4: Start minting
  console.log("Starting minting process...");
  const result = await sdk.assets.startMinting({
    fileId: prepare.fileId,
    editions: 1,
    contractId,
    shareWithCommunity: true,
    metadata: {
      attributes: [
        { key: "title", value: "Manual Upload", type: 0 }
      ]
    }
  });

  console.log("Minting started!");
  console.log("Status:", result.status);
  console.log("Contract:", result.contractAddress);
  console.log("Token ID:", result.tokenId);

  return result;
}
```

### React Component Example

```typescript
import { useUploadAsset } from "@uranium/react";
import { useState, useRef } from "react";

function NFTUploader({ contractId }: { contractId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const controllerRef = useRef<AbortController>();

  const {
    uploadAsset,
    isLoading,
    progress,
    error,
    data: asset
  } = useUploadAsset();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;

    controllerRef.current = new AbortController();

    await uploadAsset({
      file,
      options: {
        contractId,
        metadata: {
          title: file.name,
          description: "Uploaded via React app"
        },
        signal: controllerRef.current.signal
      }
    });
  };

  const handleCancel = () => {
    controllerRef.current?.abort();
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isLoading} />

      {file && !isLoading && (
        <button onClick={handleUpload}>Upload & Mint</button>
      )}

      {isLoading && (
        <div>
          <p>Stage: {progress?.stage}</p>
          <progress value={progress?.percent || 0} max={100} />
          <p>{progress?.currentStatus}</p>
          <p>
            Chunk {progress?.currentChunk} of {progress?.totalChunks}
          </p>

          {/* Show chunk-level progress during UPLOADING */}
          {progress?.stage === 'UPLOADING' && progress.chunkProgress !== undefined && (
            <div>
              <p>Current chunk: {progress.chunkProgress.toFixed(0)}%</p>
              <progress value={progress.chunkProgress} max={100} />
            </div>
          )}

          <button onClick={handleCancel}>Cancel</button>
        </div>
      )}

      {error && (
        <div style={{ color: "red" }}>
          Error: {error.message}
        </div>
      )}

      {asset && (
        <div style={{ color: "green" }}>
          <p>Successfully minted!</p>
          <p>Asset ID: {asset.id}</p>
          <p>Contract: {asset.contractAddress}</p>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Always validate file size** before attempting upload
2. **Provide progress feedback** for better UX
3. **Handle errors gracefully** with user-friendly messages
4. **Use AbortSignal** for long-running uploads
5. **Keep metadata concise** to minimize gas costs
6. **Test with various file types** and sizes
7. **Implement retry logic** for critical uploads (low-level API)
8. **Monitor upload stages** to debug issues

## Related Documentation

- [Error Handling Guide](./error-handling.md)
- [API Reference](./api-reference.md)
- [Architecture Overview](./architecture.md)
