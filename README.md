# Uranium SDK

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-926%20passing-brightgreen.svg)](#test-coverage)

A comprehensive TypeScript SDK for the Uranium NFT Platform. Build powerful NFT applications with type-safe APIs, React integration, and built-in error handling.

## ✨ Features

- **Type-Safe API Client** - Full TypeScript support with intelligent autocomplete
- **React Integration** - Ready-to-use hooks and provider with React Query
- **File Upload System** - Multipart upload with progress tracking and retry logic
- **Automatic Validation** - Zod-based validation for all API requests
- **Error Handling** - Comprehensive error types with user-friendly messages
- **Retry Logic** - Configurable exponential backoff for failed requests
- **Cross-Platform** - Works in Node.js and browsers
- **Monorepo Architecture** - Clean separation of concerns with workspace packages

## 🚀 Quick Start

### 📦 Installation

```bash
# Install core SDK
bun add @uranium/sdk

# For React applications
bun add @uranium/sdk @uranium/react
```

### Basic Usage

```typescript
import UraniumSDK from "@uranium/sdk";

// Initialize the SDK
const sdk = new UraniumSDK({
  apiKey: "your-api-key" // Get from https://portal.uranium.pro/dashboard/profile/api-keys
});

// Get user information
const user = await sdk.account.getMe("device-id");

// List collections
const collections = await sdk.contracts.list();

// Create a new collection
const collection = await sdk.contracts.create({
  name: "My NFT Collection",
  symbol: "MYNFT",
  type: "ERC721"
});

// List assets with filtering
const assets = await sdk.assets.list({
  contractId: "collection-id",
  page: 1,
  pageSize: 20,
  sortBy: "createdAt",
  order: "desc"
});
```

### Upload Assets

```typescript
// High-level API with automatic progress tracking
const asset = await sdk.upload.upload(file, {
  contractId: "your-collection-id",
  metadata: {
    title: "Beautiful Sunset",
    description: "A stunning sunset over the ocean",
    location: "San Francisco, CA"
  },
  editions: 1,
  shareWithCommunity: true,
  onProgress: (progress) => {
    console.log(`${progress.stage}: ${progress.percent.toFixed(0)}%`);
    // Stages: VALIDATING, PREPARING, PROCESSING, UPLOADING, FINALIZING, REQUESTING_MINT, DONE

    // Track individual chunk progress during upload
    if (progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined) {
      console.log(`Chunk progress: ${progress.chunkProgress}%`);
    }
  }
});

console.log("NFT minted:", asset.id);
```

### React Integration

```typescript
import { UraniumProvider, useContracts, useUploadAsset } from "@uranium/react";

function App() {
  return (
    <UraniumProvider config={{ apiKey: "your-api-key" }}>
      <MyComponent />
    </UraniumProvider>
  );
}

function MyComponent() {
  // Fetch collections with React Query
  const { data: collections, isLoading } = useContracts();

  // Upload with progress tracking
  const { mutate: upload, progress } = useUploadAsset({
    onSuccess: (asset) => {
      console.log("Upload complete:", asset.id);
    }
  });

  const handleUpload = (file: File) => {
    upload({
      file,
      contractId: "collection-id",
      metadata: { title: "My NFT" }
    });
  };

  return (
    <div>
      {progress && <div>Upload: {progress.percent}%</div>}
      {collections?.map(c => <div key={c.id}>{c.name}</div>)}
    </div>
  );
}
```

## 📚 Packages

This monorepo contains three main packages:

### [@uranium/sdk](./packages/core)

Core SDK package with full API client functionality.

**Key Features:**
- Complete API coverage (account, contracts, assets)
- Upload manager with chunked multipart uploads
- Automatic validation with Zod schemas
- Retry logic with exponential backoff
- Device ID management
- Debug mode

📦 **Size:** ESM: 40.52 KB (gzipped: 9.19 KB), CJS: 43.67 KB (gzipped: 9.79 KB)

### [@uranium/react](./packages/react)

React hooks and provider for seamless integration.

**Key Features:**
- `useAccount()` - User information with derived state
- `useContracts()` - Collection listing
- `useAssets()` - Infinite scroll asset listing
- `useCreateCollection()` - Collection creation mutation
- `useUploadAsset()` - Upload with progress tracking
- React Query v5 integration
- Automatic query invalidation

📦 **Size:** ESM: 10.70 KB (gzipped: 2.61 KB), CJS: 12.26 KB (gzipped: 3.01 KB)

### [@uranium/types](./packages/types)

Shared TypeScript type definitions and error classes.

**Key Features:**
- Base error classes (UraniumError, ValidationError, etc.)
- Type guards for error handling
- Shared across all packages

📦 **Size:** ESM: 2.41 KB (gzipped: 0.67 KB), CJS: 3.63 KB (gzipped: 1.10 KB)

## 📖 Documentation

- **[Getting Started Guide](./docs/getting-started.md)** - Step-by-step setup guide
- **[API Reference](./docs/api-reference.md)** - Complete API documentation
- **[Upload Guide](./docs/upload-guide.md)** - File upload and NFT minting
- **[React Integration](./docs/react-integration.md)** - React hooks and components
- **[Error Handling](./docs/error-handling.md)** - Error types and recovery patterns
- **[Architecture](./docs/architecture.md)** - System design and principles
- **[Contributing Guide](./CONTRIBUTING.md)** - Developer setup and conventions
- **[Publishing Guide](./PUBLISH.md)** - Instructions for publishing new versions
- **[Code Quality Guide](./CODE_QUALITY.md)** - Linting, formatting, and best practices

## 🛠️ Development

### Prerequisites

- [Bun](https://bun.sh) v1.3.1 or later
- Node.js v18+ (for compatibility checks)
- TypeScript 5.3+

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd uranium-sdk

# Install dependencies
bun install

# Build all packages
bun run build
```

### Common Commands

```bash
# Build all packages
bun run build

# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Lint code
bun run lint

# Format code
bun run format

# Clean build artifacts
bun run clean

# Development mode with hot reload
bun run dev
```

### Working with Individual Packages

```bash
# Navigate to a package
cd packages/core

# Build the package
bun run build

# Run tests
bun test

# Development mode
bun run dev
```

### Running Tests

```bash
# Run all tests
bun test

# Run tests for specific package
bun test packages/core/src
bun test packages/react/src

# Run tests with coverage
bun test --coverage

# Watch mode
bun test --watch
```

## 🏗️ Architecture

### Monorepo Structure

```
uranium-sdk/
├── packages/
│   ├── configs/          # Shared TypeScript configuration
│   ├── types/            # @uranium/types - Shared type definitions
│   ├── core/             # @uranium/sdk - Core SDK
│   │   ├── src/
│   │   │   ├── client/   # API routers (account, contracts, assets)
│   │   │   ├── upload/   # Upload system with progress tracking
│   │   │   ├── validation/ # Zod schemas and validation utilities
│   │   │   ├── types/    # Type definitions
│   │   │   └── index.ts  # Main SDK class
│   │   └── dist/         # Build output (ESM + CJS + types)
│   └── react/            # @uranium/react - React integration
│       ├── src/
│       │   ├── hooks/    # React Query hooks
│       │   ├── utils/    # Query keys and error helpers
│       │   └── provider.tsx # React Context provider
│       └── dist/         # Build output
├── USAGE_EXAMPLES.md     # Usage documentation
├── PROGRESS.md           # Development history
├── REVIEW_REPORT.md      # Quality metrics
└── CONTRIBUTING.md       # Developer guide
```

### Design Principles

1. **Router-Based Architecture** - Modular API organization (inspired by MCP server)
2. **Type Safety First** - Comprehensive TypeScript types with strict mode
3. **Progressive Enhancement** - High-level API for simplicity, low-level for control
4. **Validation at Boundaries** - Zod schemas validate all inputs before API calls
5. **Explicit Error Handling** - Custom error classes for different failure scenarios
6. **Test-Driven Development** - 926 passing tests across 27 test suites

## 📡 API Reference

### Core SDK

```typescript
import UraniumSDK from "@uranium/sdk";

const sdk = new UraniumSDK({
  apiKey: string;           // Required: API key from portal
  baseUrl?: string;         // Optional: API base URL (default: https://gw.urnm.pro)
  timeout?: number;         // Optional: Request timeout in ms (default: 20000)
  deviceId?: string;        // Optional: Device identifier (auto-generated)
  debug?: boolean;          // Optional: Enable debug logging (default: false)
  retry?: {                 // Optional: Retry configuration
    enabled: boolean;       // Enable retry (default: false)
    maxRetries?: number;    // Max attempts (default: 3)
    retryDelay?: number;    // Base delay in ms (default: 1000)
    retryableStatuses?: number[]; // Status codes to retry (default: [500, 502, 503, 504])
    onRetry?: (attempt, error, delayMs) => void; // Retry callback
  }
});

// Available routers
sdk.account.getMe(deviceId: string): Promise<UserEntity>

sdk.contracts.list(): Promise<ContractEntity[]>
sdk.contracts.create(params): Promise<ContractEntity>

sdk.assets.list(params): Promise<PaginatedResponse<AssetEntity>>
sdk.assets.prepareNewFile(params): Promise<PrepareFileResponse>
sdk.assets.completeUpload(params): Promise<CompleteUploadResponse>
sdk.assets.startMinting(params): Promise<MintingResponse>

sdk.upload.upload(file, options): Promise<AssetEntity>
```

### React Hooks

```typescript
import {
  UraniumProvider,
  useUranium,
  useAccount,
  useContracts,
  useAssets,
  useCreateCollection,
  useUploadAsset
} from "@uranium/react";

// Provider (required)
<UraniumProvider config={{ apiKey: "..." }}>
  {children}
</UraniumProvider>

// Hooks
const sdk = useUranium(); // Access SDK instance
const { data, isLoading, error } = useAccount();
const { data, isLoading } = useContracts();
const { data, fetchNextPage, hasNextPage } = useAssets({ contractId });
const { mutate, isPending } = useCreateCollection();
const { mutate, progress } = useUploadAsset();
```

## ⚠️ Error Handling

The SDK provides comprehensive error types:

```typescript
import {
  UraniumError,           // Base error class
  AuthenticationError,    // 401 - Invalid API key
  ValidationError,        // 400 - Invalid parameters
  NetworkError,           // Network/timeout errors
  NotFoundError,          // 404 - Resource not found
  LimitExceededError,     // Limit reached (e.g., collections)
  UploadError,            // Upload-specific errors
  MintingError,           // Minting-specific errors
  isUraniumError,         // Type guard
  isRetryableError        // Check if error is retryable
} from "@uranium/sdk";

try {
  const collection = await sdk.contracts.create(params);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Invalid parameters:", error.fields);
  } else if (error instanceof AuthenticationError) {
    console.error("Check your API key");
  } else if (isRetryableError(error)) {
    console.error("Temporary error, will retry");
  }
}
```

## 🧪 Test Coverage

**Overall Stats:**
- Total Tests: **926** (100% passing)
- Test Suites: **27**
- Coverage tracked via `bun test --coverage`

The SDK maintains high test coverage across all packages with comprehensive unit and integration tests. Run `bun test` to execute the test suite.

## 🔧 Technology Stack

- **Runtime:** [Bun](https://bun.sh) v1.3.1 - Fast all-in-one JavaScript runtime
- **Language:** TypeScript 5.3 with strict mode
- **Build Tool:** Bun bundler for ESM and CJS outputs
- **HTTP Client:** Axios with interceptors
- **Validation:** Zod v4 for runtime type checking
- **React Integration:** React Query v5 for state management
- **Testing:** Bun test runner with 926 passing tests
- **Code Quality:** Biome for linting and formatting
- **Monorepo:** Bun workspaces with Turbo

## 📌 Versioning

Current version: **0.1.0**

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

## 📝 License

[Apache 2.0](./LICENSE)

Copyright 2025 Uranium

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## 🔗 Resources

- **Portal:** https://portal.uranium.pro
- **API Keys:** https://portal.uranium.pro/dashboard/profile/api-keys
- **Base URL:** https://gw.urnm.pro
- **Full Documentation:** [https://docs.uranium.pro](https://docs.uranium.pro

## 💬 Support

For issues, questions, or contributions:
1. Check the [documentation guides](./docs/getting-started.md)
2. Review [contributing guidelines](./CONTRIBUTING.md)
3. Open an issue for bugs or feature requests

## 👏 Credits

Built with [Bun](https://bun.sh) by the Uranium.

