# Getting Started with Uranium SDK

Welcome to the Uranium SDK! This guide will help you get up and running with the Uranium NFT platform in minutes.

## What is Uranium SDK?

Uranium SDK is a comprehensive TypeScript library for building NFT applications on the Uranium platform. It provides:

- **Type-safe API client** - No manual HTTP requests, everything through typed methods
- **File upload system** - Easy-to-use upload with progress tracking
- **React integration** - Ready-to-use hooks for React applications
- **Full NFT lifecycle** - From collection creation to asset minting

## Installation

The SDK is split into two packages depending on your needs:

### Core SDK Only (Node.js, CLI, etc.)

```bash
bun add @uranium/sdk
```

### With React Integration

```bash
bun add @uranium/sdk @uranium/react
```

> **Note:** The examples use Bun, but you can also use npm or yarn:
> - npm: `npm install @uranium/sdk @uranium/react`
> - yarn: `yarn add @uranium/sdk @uranium/react`

## Getting Your API Key

Before using the SDK, you need an API key from the Uranium portal:

1. Visit [https://portal.uranium.pro/dashboard/profile/api-keys](https://portal.urnm.pro/dashboard/profile/api-keys)
2. Click "Create API Key"
3. Copy the key immediately (it's only shown once!)
4. Store it securely in your environment variables

```bash
# .env file
URANIUM_API_KEY=your-api-key-here
```

## Your First API Call

Let's start with a simple example that fetches your user information:

```typescript
import UraniumSDK from "@uranium/sdk";

// Initialize the SDK
const sdk = new UraniumSDK({
  apiKey: process.env.URANIUM_API_KEY!
});

// Fetch user information
const user = await sdk.account.getMe("my-device-id");

console.log("User ID:", user.userId);
console.log("Role:", user.role); // "USER" or "ADMIN"
console.log("Nickname:", user.nickname);
```

That's it! You've made your first API call.

## Basic Concepts

### Collections (Contracts)

Collections are smart contracts that hold your NFTs. Think of them as albums for your digital assets.

```typescript
// List all your collections
const collections = await sdk.contracts.list();

console.log(`You have ${collections.length} collections`);

// Create a new collection
const newCollection = await sdk.contracts.create({
  name: "My Art Collection",
  symbol: "MYART",
  type: "ERC721" // For unique NFTs
});

console.log("Collection created:", newCollection.id);
```

**Collection Types:**
- **ERC721** - Each NFT is unique (1 edition only)
- **ERC1155** - Multi-edition NFTs (1-1000 editions per asset)

**Collection Limits:**
- Regular users: 10 collections
- Admin users: 20 collections

### Assets (NFTs)

Assets are the individual NFTs within your collections. Each asset can have media, metadata, and editions.

```typescript
// List assets in a collection
const assets = await sdk.assets.list({
  contractId: "your-collection-id",
  page: 1,
  pageSize: 20
});

console.log(`Found ${assets.meta.total} assets`);

// Browse through assets
assets.data.forEach(asset => {
  console.log(`${asset.title} - Status: ${asset.status}`);
});
```

### Uploads

The SDK provides two ways to upload files and mint NFTs:

#### Simple Upload (Recommended)

Everything in one method call with progress tracking:

```typescript
const asset = await sdk.upload.upload(file, {
  contractId: "your-collection-id",
  metadata: {
    title: "Beautiful Sunset",
    description: "A sunset over the ocean",
    location: "San Francisco, CA"
  },
  onProgress: (progress) => {
    console.log(`${progress.stage}: ${progress.percent}%`);
  }
});

console.log("NFT minted:", asset.id);
```

#### Advanced Upload (Full Control)

For advanced use cases where you need complete control over each step:

```typescript
// 1. Prepare upload
const prep = await sdk.assets.prepareNewFile({
  deviceId: "my-device",
  metadata: JSON.stringify({ title: "My NFT" }),
  type: "image",
  source: "upload",
  fileSize: file.size
});

// 2. Upload chunks (with retry)
// 3. Complete upload
// 4. Start minting

// See the Core SDK Guide for full details
```

## Configuration Options

The SDK accepts several configuration options:

```typescript
const sdk = new UraniumSDK({
  apiKey: "your-api-key",          // Required
  baseUrl: "https://gw.urnm.pro",  // Optional: API base URL
  timeout: 20000,                  // Optional: Request timeout (ms)
  debug: true,                     // Optional: Enable debug logs
  retry: {                         // Optional: Retry configuration
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000
  }
});
```

### Debug Mode

Enable debug mode to see detailed logs of all API requests and responses:

```typescript
const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  debug: true
});

// Console output:
// [Uranium SDK] Request: POST /clients-account/me
// [Uranium SDK] Response: 200 POST /clients-account/me
```

### Retry Logic

Configure automatic retries for failed requests:

```typescript
const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  retry: {
    enabled: true,       // Enable retry mechanism
    maxRetries: 3,       // Number of retry attempts
    retryDelay: 1000,    // Base delay between retries (ms)
    onRetry: (attempt, error, delayMs) => {
      console.log(`Retry attempt ${attempt} in ${delayMs}ms`);
    }
  }
});
```

**What gets retried:**
- Network errors
- Server errors (500, 502, 503, 504)

**What never gets retried:**
- Authentication errors (401, 403)
- Validation errors (400)
- Rate limiting (429)

## Error Handling

The SDK provides typed error classes for better error handling:

```typescript
import {
  UraniumError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  NotFoundError,
  isUraniumError
} from "@uranium/sdk";

try {
  const collections = await sdk.contracts.list();
} catch (error) {
  if (isUraniumError(error)) {
    // All Uranium-specific errors
    console.error("Uranium Error:", error.message);

    if (error instanceof AuthenticationError) {
      console.error("Invalid API key!");
    } else if (error instanceof ValidationError) {
      console.error("Invalid parameters:", error.message);
    } else if (error instanceof NetworkError) {
      console.error("Network issue:", error.message);
    }
  } else {
    // Other errors
    console.error("Unknown error:", error);
  }
}
```

## Complete Example

Here's a complete example that creates a collection and uploads an NFT:

```typescript
import UraniumSDK from "@uranium/sdk";
import { readFileSync } from "fs";

// Initialize SDK
const sdk = new UraniumSDK({
  apiKey: process.env.URANIUM_API_KEY!,
  debug: true
});

async function createNFT() {
  try {
    // 1. Get user info
    const user = await sdk.account.getMe("my-app");
    console.log(`Logged in as ${user.nickname}`);

    // 2. Create collection
    const collection = await sdk.contracts.create({
      name: "My First Collection",
      symbol: "MFC",
      type: "ERC721"
    });
    console.log("Collection created:", collection.id);

    // 3. Upload and mint NFT
    const fileBuffer = readFileSync("./image.jpg");
    const file = new File([fileBuffer], "image.jpg", { type: "image/jpeg" });

    const asset = await sdk.upload.upload(file, {
      contractId: collection.id,
      metadata: {
        title: "My First NFT",
        description: "Created with Uranium SDK"
      },
      onProgress: (progress) => {
        console.log(`Upload: ${progress.percent}% - ${progress.stage}`);
      }
    });

    console.log("NFT minted successfully!");
    console.log("Asset ID:", asset.id);
    console.log("View at:", asset.mediaUrl);

  } catch (error) {
    console.error("Error:", error);
  }
}

createNFT();
```

## Next Steps

Now that you understand the basics, explore these guides:

- **[Core SDK Guide](./core-sdk-guide.md)** - Deep dive into all SDK features
- **[React Integration Guide](./react-integration.md)** - Using the SDK in React apps

## Additional Resources

- **API Portal:** [https://portal.uranium.pro](https://portal.urnm.pro)
- **API Keys:** [https://portal.uranium.pro/dashboard/profile/api-keys](https://portal.urnm.pro/dashboard/profile/api-keys)
- **Support:** Contact support through the portal

## Common Issues

### "API key is required" error

Make sure you're passing the API key to the SDK constructor:

```typescript
const sdk = new UraniumSDK({
  apiKey: process.env.URANIUM_API_KEY! // Don't forget this!
});
```

### TypeScript errors with File objects

If you're using Node.js and seeing TypeScript errors with File objects, you may need to install additional types:

```bash
bun add -D @types/node
```

### Import errors

Make sure you're using the correct import syntax:

```typescript
// Default import (recommended)
import UraniumSDK from "@uranium/sdk";

// Named import (also works)
import { UraniumSDK } from "@uranium/sdk";
```

## Need Help?

If you run into any issues:

1. Check the error message carefully - the SDK provides detailed error descriptions
2. Review the API documentation
3. Enable debug mode to see detailed request/response logs
4. Contact support through the Uranium portal

Happy building!
