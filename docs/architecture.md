# Architecture Overview

Comprehensive guide to the Uranium SDK architecture, design patterns, and internal systems.

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Package Architecture](#package-architecture)
- [Router Pattern](#router-pattern)
- [Validation Layer](#validation-layer)
- [HTTP Client](#http-client)
- [Retry Mechanism](#retry-mechanism)
- [Upload System](#upload-system)
- [React Query Integration](#react-query-integration)
- [Device ID Management](#device-id-management)
- [Build System](#build-system)
- [Test Coverage](#test-coverage)

## Overview

The Uranium SDK is a modern, type-safe TypeScript library for interacting with the Uranium NFT platform. It follows a modular monorepo architecture with clear separation of concerns.

### Design Principles

1. **Type Safety First** - Full TypeScript coverage with strict mode
2. **Developer Experience** - Intuitive API with comprehensive error handling
3. **Modularity** - Isolated packages with clear dependencies
4. **Testing** - High test coverage (97.56%) with unit and integration tests
5. **Performance** - Optimized builds with tree-shaking support
6. **Cross-Platform** - Works in browser, Node.js, and Bun environments

### Technology Stack

- **Runtime:** Bun (with Node.js compatibility)
- **Language:** TypeScript 5.3+
- **Build Tool:** Bun bundler + TypeScript compiler
- **Monorepo:** Bun workspaces + Turbo
- **HTTP Client:** Axios
- **Validation:** Zod
- **React Integration:** React Query v5
- **Testing:** Bun test runner

## Monorepo Structure

```
uranium-sdk/
├── packages/
│   ├── configs/           # Shared TypeScript configuration
│   ├── types/             # Base types and errors
│   ├── core/              # Core SDK functionality
│   └── react/             # React hooks and provider
├── docs/                  # Technical documentation
├── turbo.json             # Turbo pipeline configuration
├── package.json           # Root workspace configuration
└── bun.lock              # Lockfile
```

### Bun Workspaces

Configured in root `package.json`:

```json
{
  "workspaces": ["packages/*"],
  "packageManager": "bun@1.3.1"
}
```

**Benefits:**
- Shared dependencies across packages
- Fast installation with Bun
- Symlinked local packages for development
- Unified version management

### Turbo Pipeline

Orchestrates build tasks with dependency awareness:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Execution:**
```bash
bun run build      # Builds packages in dependency order (uses turbo internally)
bun test           # Runs all tests
```

## Package Architecture

### Dependency Graph

```
┌──────────────┐
│ @uranium/    │
│   configs    │  ← Shared TypeScript config
└──────────────┘
       ↑
       │
┌──────────────┐
│ @uranium/    │
│   types      │  ← Base errors and type guards
└──────────────┘
       ↑
       │
┌──────────────┐
│ @uranium/    │
│   sdk        │  ← Core SDK (account, contracts, assets, upload)
└──────────────┘
       ↑
       │
┌──────────────┐
│ @uranium/    │
│   react      │  ← React hooks and provider
└──────────────┘
```

### @uranium/configs

Shared TypeScript configuration base.

**Files:**
```
configs/
└── tsconfig.json    # Base TypeScript config
```

**Purpose:**
- Centralized compiler settings
- Consistent build output across packages
- Easy config inheritance

**Usage:**
```json
{
  "extends": "@uranium/configs/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### @uranium/types

Foundational types and error classes.

**Files:**
```
types/src/
├── errors.ts     # Base error classes
└── index.ts      # Public exports
```

**Exports:**
- `UraniumError` - Base error class
- `AuthenticationError` - 401/403 errors
- `ValidationError` - 400 validation errors
- `NetworkError` - Network failures
- `NotFoundError` - 404 errors
- `UploadError` - File upload errors
- `isUraniumError()` - Type guard
- `isRetryableError()` - Retry check

**Why Separate Package?**
- Reusable across multiple projects
- No dependencies on SDK internals
- Can be used independently
- Minimal bundle size

### @uranium/sdk (Core)

Main SDK with complete API client.

**Structure:**
```
core/src/
├── client/              # HTTP client and routers
│   ├── base.ts          # Axios client setup
│   ├── utils.ts         # Client utilities
│   ├── retry.ts         # Retry logic
│   ├── device.ts        # Device ID management
│   ├── account.ts       # Account router
│   ├── contracts.ts     # Contracts router
│   ├── assets.ts        # Assets router
│   └── index.ts         # Router factory
├── types/               # SDK-specific types
│   ├── config.ts        # Configuration types
│   ├── entities.ts      # API entities (User, Contract, Asset)
│   ├── enums.ts         # Enums (Status, FileType, etc.)
│   ├── api-types.ts     # Request/Response DTOs
│   ├── metadata.ts      # NFT metadata utilities
│   ├── pagination.ts    # Pagination utilities
│   └── errors.ts        # SDK-specific errors
├── validation/          # Input validation
│   ├── schemas.ts       # Zod schemas
│   ├── utils.ts         # Validation helpers
│   └── index.ts
├── upload/              # File upload system
│   ├── types.ts         # Upload types
│   ├── utils.ts         # Upload utilities
│   ├── chunk-uploader.ts  # Low-level chunk upload
│   ├── upload-manager.ts  # High-level upload orchestrator
│   └── index.ts
├── test-utils/          # Testing utilities
│   ├── mocks.ts         # Mock factories
│   └── index.ts
└── index.ts             # Main SDK class
```

**Bundle Output:**
- ESM: `dist/index.js`
- CJS: `dist/index.cjs`
- Types: `dist/index.d.ts`

### @uranium/react

React integration with hooks and provider.

**Structure:**
```
react/src/
├── provider.tsx         # UraniumProvider + useUranium
├── hooks/
│   ├── useAccount.ts    # Account query
│   ├── useContracts.ts  # Contracts query
│   ├── useAssets.ts     # Infinite assets query
│   ├── useCreateCollection.ts  # Create collection mutation
│   ├── useUploadAsset.ts       # Upload mutation
│   └── index.ts
├── utils/
│   ├── query-keys.ts    # Query keys factory
│   ├── error-messages.ts  # Error helpers
│   └── index.ts
└── index.ts             # Public exports
```

**Bundle Output:**
- ESM: `dist/index.js` (browser target, 2.28 MB)
- CJS: `dist/index.cjs` (node target, 0.91 MB)
- Types: `dist/index.d.ts`

## Router Pattern

SDK functionality is organized into domain-specific routers.

### Router Architecture

```
┌────────────────────────────────────────┐
│            UraniumSDK                   │
├────────────────────────────────────────┤
│  + account: AccountRouter               │
│  + contracts: ContractsRouter           │
│  + assets: AssetsRouter                 │
│  + upload: UploadManager                │
└────────────────────────────────────────┘
             │
             ├─────────────┬──────────────┬───────────────┐
             ▼             ▼              ▼               ▼
      ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐
      │ Account  │  │ Contracts │  │  Assets  │  │    Upload    │
      │  Router  │  │  Router   │  │  Router  │  │   Manager    │
      └──────────┘  └───────────┘  └──────────┘  └──────────────┘
```

### Router Implementation

Each router is a factory function that receives an Axios client:

```typescript
// Router factory pattern
export const accountRouter = (client: AxiosInstance) => ({
  getMe: async (deviceId: string): Promise<UserEntity> => {
    const response = await client.post("/clients-account/me", { deviceId });
    return response.data.ok;
  }
});

export type AccountRouter = ReturnType<typeof accountRouter>;
```

**Benefits:**
- Dependency injection (client)
- Type inference for return types
- Easy to test (mock client)
- Consistent structure

### Router Factory

Centralized router creation:

```typescript
export const createApiRouters = (config: UraniumConfig) => {
  const client = createApiClient(config);

  return {
    account: accountRouter(client),
    contracts: contractsRouter(client),
    assets: assetsRouter(client)
  };
};
```

### SDK Class Integration

```typescript
export class UraniumSDK {
  public readonly account: AccountRouter;
  public readonly contracts: ContractsRouter;
  public readonly assets: AssetsRouter;
  public readonly upload: UploadManager;

  constructor(config: UraniumConfig) {
    const client = createApiClient(config);

    this.account = accountRouter(client);
    this.contracts = contractsRouter(client);
    this.assets = assetsRouter(client);
    this.upload = new UploadManager(this.assets, generateDeviceId());
  }
}
```

## Validation Layer

Input validation with Zod before API calls.

### Validation Flow

```
User Input
    ↓
Zod Schema Validation
    ↓
[VALID] → API Request
    ↓
[INVALID] → ValidationError (thrown immediately)
```

### Schema Organization

**File:** `validation/schemas.ts`

```typescript
import { z } from "zod";

// Collection schemas
export const contractNameSchema = z.string()
  .min(3)
  .max(30)
  .regex(/^(?=[a-zA-Z0-9._\-\[\]]{3,30}$)/);

export const contractSymbolSchema = z.string()
  .min(3)
  .max(30)
  .regex(/^(?=[a-zA-Z0-9_]{3,30}$)/);

// Asset schemas
export const assetTitleSchema = z.string()
  .min(3)
  .max(120)
  .trim();

export const assetDescriptionSchema = z.string()
  .max(255)
  .optional();

// Composite schemas
export const createContractSchema = z.object({
  name: contractNameSchema,
  symbol: contractSymbolSchema,
  type: ercTypeSchema
});
```

### Validation Helper

**File:** `validation/utils.ts`

```typescript
export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw handleZodError(error, context);
    }
    throw error;
  }
};
```

### Usage in Routers

```typescript
export const contractsRouter = (client: AxiosInstance) => ({
  create: async (params: CreateContractParams): Promise<ContractEntity> => {
    // Validate before API call
    const validated = validateSchema(
      createContractSchema,
      params,
      "Invalid contract parameters"
    );

    const response = await client.post("/contracts/create", validated);
    return response.data.ok;
  }
});
```

## HTTP Client

Axios-based HTTP client with interceptors.

### Client Architecture

```
┌────────────────────────────────────────────────┐
│           Axios Client                          │
├────────────────────────────────────────────────┤
│  Base URL: https://gw.urnm.pro                 │
│  Timeout: 20s                                  │
│  Headers: { x-auth-token: apiKey }             │
└────────────────────────────────────────────────┘
           ↓                        ↑
    Request Interceptor      Response Interceptor
           ↓                        ↑
     Add Headers              Handle Errors
     Debug Logging            Retry Logic
           ↓                        ↑
    ┌──────────────────────────────────────┐
    │          API Endpoint                 │
    └──────────────────────────────────────┘
```

### Client Factory

**File:** `client/base.ts`

```typescript
export const createApiClient = (config: UraniumConfig): AxiosInstance => {
  const resolvedConfig = resolveConfig(config);

  const client = axios.create({
    baseURL: resolvedConfig.baseUrl,
    timeout: resolvedConfig.timeout,
    headers: {
      "Content-Type": "application/json"
    }
  });

  // Request interceptor
  client.interceptors.request.use((config) => {
    config.headers["x-auth-token"] = resolvedConfig.apiKey;
    debugLog(resolvedConfig.debug, "Request:", config);
    return config;
  });

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      debugLog(resolvedConfig.debug, "Response:", response);
      return response;
    },
    async (error) => {
      debugLog(resolvedConfig.debug, "Request Error:", error);

      // Map HTTP errors to SDK errors
      if (isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401 || status === 403) {
          throw new AuthenticationError(/* ... */);
        }
        if (status === 404) {
          throw new NotFoundError(/* ... */);
        }
        // ... more mappings
      }

      throw error;
    }
  );

  return client;
};
```

### Error Mapping

HTTP status codes are automatically mapped to SDK error classes:

| Status | Error Class |
|--------|-------------|
| 401, 403 | `AuthenticationError` |
| 400 | `ValidationError` |
| 404 | `NotFoundError` |
| 429 | `LimitExceededError` |
| 500+ | `NetworkError` |

## Retry Mechanism

Automatic retry with exponential backoff for transient failures.

### Retry Architecture

```
┌──────────────────────────────────────────┐
│         withRetry<T>()                    │
├──────────────────────────────────────────┤
│  1. Check if retry enabled               │
│  2. Execute function                     │
│  3. On error:                            │
│     ├─ Check if retryable               │
│     ├─ Check max attempts               │
│     ├─ Calculate backoff delay          │
│     ├─ Call onRetry callback            │
│     └─ Wait and retry                   │
│  4. Return result or throw              │
└──────────────────────────────────────────┘
```

### Implementation

**File:** `client/retry.ts`

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: RetryConfig
): Promise<T> {
  if (!retryConfig.enabled) {
    return fn();  // Skip retry if disabled
  }

  let lastError: unknown;
  const maxAttempts = retryConfig.maxRetries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if retryable
      if (!shouldRetry(error, retryConfig.retryableStatuses)) {
        throw error;
      }

      // Last attempt
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate exponential backoff
      const delayMs = attempt * retryConfig.retryDelay;

      // Callback
      if (retryConfig.onRetry) {
        await retryConfig.onRetry(attempt, error, delayMs);
      }

      // Wait
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
```

### Retry Decision Logic

**File:** `client/utils.ts`

```typescript
export const shouldRetry = (
  error: unknown,
  retryableStatuses: number[] = [500, 502, 503, 504]
): boolean => {
  if (!isAxiosError(error)) return false;

  const status = error.response?.status;
  if (!status) return true;  // Network error, retry

  // Never retry rate limits
  if (status === 429) return false;

  return retryableStatuses.includes(status);
};
```

### Configuration

```typescript
const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  retry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [500, 502, 503, 504],
    onRetry: (attempt, error, delay) => {
      console.log(`Retry ${attempt} after ${delay}ms`);
    }
  }
});
```

## Upload System

Sophisticated file upload with chunking, retry, and progress tracking.

### Upload Architecture

```
┌────────────────────────────────────────────────┐
│           UploadManager                         │
│  (High-level orchestrator)                     │
├────────────────────────────────────────────────┤
│  1. Validate file and metadata                 │
│  2. Call prepareNewFile()                      │
│  3. Split file into chunks                     │
│  4. Upload chunks sequentially                 │
│  5. Call completeUpload()                      │
│  6. Call startMinting()                        │
│  7. Return AssetEntity                         │
└────────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────┐
│         uploadChunk()                           │
│  (Low-level chunk uploader)                    │
├────────────────────────────────────────────────┤
│  • PUT to S3 presigned URL                     │
│  • Retry: 3 attempts, exponential backoff      │
│  • Extract ETag from response                  │
│  • Support AbortSignal                         │
└────────────────────────────────────────────────┘
```

### UploadManager Class

**File:** `upload/upload-manager.ts`

**Responsibilities:**
1. File validation (size, type)
2. Metadata validation (title, description, location)
3. Progress tracking (5 stages, 0-100%)
4. Chunk orchestration
5. Error handling and recovery

**Key Methods:**

```typescript
class UploadManager {
  async upload(
    file: File | Buffer,
    options: UploadOptions
  ): Promise<AssetEntity> {
    // Stage 1: Preparing (0-10%)
    // Stage 2: Uploading (10-70%)
    // Stage 3: Completing (70-80%)
    // Stage 4: Minting (80-100%)
    // Stage 5: Done (100%)
  }

  private validateOptions(options: UploadOptions): void
  private getFileSize(file: File | Buffer): number
  private validateFileSize(size: number): void
  private getMimeType(file: File | Buffer): string
  private fileToArrayBuffer(file: File | Buffer): Promise<ArrayBuffer>
  private calculateProgress(current, total, min, max): number
  private reportProgress(callback, progress): void
  private checkAbort(signal): void
}
```

### Chunk Uploader

**File:** `upload/chunk-uploader.ts`

**Features:**
- Direct upload to S3 via presigned URLs
- Automatic retry (3 attempts)
- Exponential backoff (1s, 2s, 4s)
- Progress callbacks per chunk
- AbortSignal support
- ETag extraction

**Implementation:**

```typescript
export async function uploadChunk(
  params: UploadChunkParams
): Promise<string> {
  const { url, data, onProgress, signal } = params;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Check abort
      if (signal?.aborted) {
        throw new UploadError("Upload aborted");
      }

      // Upload to S3
      const response = await axios.put(url, data, {
        headers: { "Content-Type": "application/octet-stream" },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(event.loaded / event.total);
          }
        },
        signal
      });

      // Extract ETag
      const etag = extractEtagFromHeaders(response.headers);
      if (!etag) {
        throw new UploadError("Failed to extract ETag");
      }

      return etag;
    } catch (error) {
      // Handle errors and retry
    }
  }

  throw new UploadError("Failed after max retries");
}
```

### Upload Flow Diagram

```
User File
    ↓
┌───────────────────────────────┐
│  prepareNewFile()              │
│  • API returns presigned URLs  │
│  • Get chunk count/size        │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│  Split file into chunks        │
│  • ~5 MB per chunk             │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│  Upload chunks sequentially    │
│  • uploadChunk() per chunk     │
│  • Collect ETags               │
│  • Report progress             │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│  completeUpload()              │
│  • Send ETags to API           │
│  • Verify integrity            │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│  startMinting()                │
│  • Create metadata             │
│  • Submit to blockchain        │
└───────────────────────────────┘
    ↓
Minted NFT
```

## React Query Integration

React hooks powered by TanStack Query v5.

### Provider Architecture

```
┌────────────────────────────────────────┐
│      UraniumProvider                    │
├────────────────────────────────────────┤
│  • Creates SDK instance                │
│  • Memoizes SDK (prevent recreation)   │
│  • Provides QueryClient               │
│  • Exposes via UraniumContext          │
└────────────────────────────────────────┘
           ↓
    React.Context
           ↓
    ┌──────────────────────────────────┐
    │       useUranium()                │
    │  Returns SDK instance             │
    └──────────────────────────────────┘
```

**Implementation:**

```typescript
export function UraniumProvider({
  config,
  queryClient,
  children
}: UraniumProviderProps) {
  // Memoize SDK to prevent recreation
  const sdk = useMemo(
    () => new UraniumSDK(config),
    [
      config.apiKey,
      config.baseUrl,
      config.timeout,
      config.deviceId,
      config.debug,
      JSON.stringify(config.retry)
    ]
  );

  return (
    <UraniumContext.Provider value={sdk}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </UraniumContext.Provider>
  );
}
```

### Query Keys Factory

**File:** `react/utils/query-keys.ts`

Centralized query key management:

```typescript
export const accountQueryKeys = {
  all: ["account"] as const,
  detail: () => [...accountQueryKeys.all, "detail"] as const
};

export const contractsQueryKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractsQueryKeys.all, "list"] as const,
  list: () => [...contractsQueryKeys.lists()] as const
};

export const assetsQueryKeys = {
  all: ["assets"] as const,
  lists: () => [...assetsQueryKeys.all, "list"] as const,
  list: (params?: any) => [...assetsQueryKeys.lists(), params] as const
};
```

**Benefits:**
- Type-safe keys
- Consistent structure
- Easy invalidation
- Hierarchical organization

### Hook Patterns

**Query Hook:**

```typescript
export function useContracts() {
  const sdk = useUranium();

  return useQuery({
    queryKey: contractsQueryKeys.list(),
    queryFn: async () => {
      try {
        return await sdk.contracts.list();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    retry: 3
  });
}
```

**Mutation Hook:**

```typescript
export function useCreateCollection() {
  const sdk = useUranium();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateContractParams) => {
      try {
        return await sdk.contracts.create(params);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      // Invalidate contracts query
      queryClient.invalidateQueries({
        queryKey: contractsQueryKeys.all
      });
    }
  });
}
```

**Infinite Query Hook:**

```typescript
export function useAssets(params?: AssetsParams) {
  const sdk = useUranium();

  return useInfiniteQuery({
    queryKey: assetsQueryKeys.list(params),
    queryFn: async ({ pageParam = 1 }) => {
      try {
        return await sdk.assets.list({
          ...params,
          page: pageParam
        });
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const hasMore = lastPage.meta.page < lastPage.meta.countPages;
      return hasMore ? lastPage.meta.page + 1 : undefined;
    }
  });
}
```

## Device ID Management

Persistent device identification across sessions.

### DeviceManager Class

**File:** `client/device.ts`

**Features:**
- Generates UUID v4 with `crypto.randomUUID()`
- Persistent storage (localStorage → cookies → memory)
- Cross-platform (browser + Node.js)
- Format: `sdk-${uuid}`

**Implementation:**

```typescript
export class DeviceManager {
  private static STORAGE_KEY = "uranium-device-id";
  private static deviceId: string | null = null;

  static getDeviceId(): string {
    // Try memory cache
    if (this.deviceId) return this.deviceId;

    // Try localStorage (browser)
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.deviceId = stored;
        return stored;
      }
    }

    // Try cookies (browser fallback)
    if (typeof document !== "undefined") {
      const stored = this.getFromCookies();
      if (stored) {
        this.deviceId = stored;
        return stored;
      }
    }

    // Generate new ID
    const newId = this.generateDeviceId();
    this.setDeviceId(newId);
    return newId;
  }

  static generateDeviceId(): string {
    return `sdk-${crypto.randomUUID()}`;
  }

  static clearDeviceId(): void {
    this.deviceId = null;
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    // Also clear cookies
  }

  private static setDeviceId(id: string): void {
    this.deviceId = id;
    // Store in localStorage and cookies
  }
}
```

**Usage:**

```typescript
// Get or create device ID (persistent)
const deviceId = DeviceManager.getDeviceId();

// Generate new ID (non-persistent)
const newId = DeviceManager.generateDeviceId();

// Clear stored ID
DeviceManager.clearDeviceId();
```

## Build System

Multi-format builds with TypeScript and Bun.

### Build Pipeline

```
┌────────────────────────────────────────┐
│  Source (src/*.ts)                     │
└────────────────────────────────────────┘
              ↓
    ┌─────────────────┐
    │  TypeScript      │  → dist/*.d.ts (declarations)
    │  Compiler        │
    └─────────────────┘
              ↓
    ┌─────────────────┐
    │  Bun Bundler     │  → dist/index.js (ESM)
    │  (ESM)           │
    └─────────────────┘
              ↓
    ┌─────────────────┐
    │  Bun Bundler     │  → dist/index.cjs (CJS)
    │  (CJS)           │
    └─────────────────┘
```

### Build Scripts

**File:** `package.json` (in each package)

```json
{
  "scripts": {
    "build": "bun run clean && bun run build:types && bun run build:js",
    "build:types": "tsc --emitDeclarationOnly",
    "build:js": "bun build ./src/index.ts --target node --format esm --outfile ./dist/index.js && bun build ./src/index.ts --target node --format cjs --outfile ./dist/index.cjs",
    "clean": "rm -rf dist"
  }
}
```

### TypeScript Configuration

**Base:** `@uranium/configs/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

**Package:** `packages/core/tsconfig.json`

```json
{
  "extends": "@uranium/configs/tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Package Exports

**File:** `packages/core/package.json`

```json
{
  "name": "@uranium/sdk",
  "version": "0.2.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

**Supports:**
- ESM imports: `import { UraniumSDK } from "@uranium/sdk"`
- CJS requires: `const { UraniumSDK } = require("@uranium/sdk")`
- TypeScript types: Full type checking

## Test Coverage

Comprehensive test suite with high coverage.

### Test Statistics

**Overall:**
- **Total tests:** 846 tests
- **Pass rate:** 100%
- **Line coverage:** 97.56%
- **Function coverage:** 95.49%

**By Package:**

| Package | Tests | Line Coverage | Function Coverage |
|---------|-------|---------------|-------------------|
| @uranium/types | - | 100% | 100% |
| @uranium/sdk | 334 | 93.49% | 93.33% |
| @uranium/react | 406 | 100% | 100% |

### Test Structure

```
packages/core/src/
├── client/
│   ├── account.ts
│   ├── account.test.ts        # 12 tests
│   ├── contracts.ts
│   ├── contracts.test.ts      # 18 tests
│   ├── assets.ts
│   ├── assets.test.ts         # 28 tests
│   ├── base.ts
│   ├── base.test.ts           # 22 tests
│   ├── retry.ts
│   ├── retry.test.ts          # 26 tests
│   ├── utils.ts
│   ├── utils.test.ts          # 19 tests
│   ├── device.ts
│   └── device.test.ts         # 21 tests
├── types/
│   ├── metadata.ts
│   ├── metadata.test.ts       # 69 tests
│   ├── pagination.ts
│   └── pagination.test.ts     # 89 tests
├── validation/
│   ├── schemas.ts
│   ├── schemas.test.ts        # 73 tests
│   ├── utils.ts
│   └── utils.test.ts          # 25 tests
└── upload/
    ├── chunk-uploader.ts
    ├── chunk-uploader.test.ts # 9 tests
    ├── upload-manager.ts
    ├── upload-manager.test.ts # 23 tests
    ├── utils.ts
    └── utils.test.ts          # 31 tests
```

### Test Utilities

**File:** `core/src/test-utils/mocks.ts`

Mock factories for consistent testing:

```typescript
export const mockData = {
  user: (overrides?: Partial<UserEntity>): UserEntity => ({
    userId: "user-123",
    role: "USER",
    nickname: "Test User",
    ...overrides
  }),

  contract: (overrides?: Partial<ContractEntity>): ContractEntity => ({
    id: "contract-123",
    name: "Test Collection",
    symbol: "TEST",
    type: "ERC721",
    status: "COMPLETE",
    ...overrides
  }),

  asset: (overrides?: Partial<AssetEntity>): AssetEntity => ({
    id: "asset-123",
    status: 14,
    title: "Test Asset",
    ...overrides
  })
};

export const createMockAxiosClient = (config: {
  get?: () => Promise<any>;
  post?: () => Promise<any>;
  put?: () => Promise<any>;
}): AxiosInstance => {
  return {
    get: mock(config.get || (() => Promise.resolve({ data: {} }))),
    post: mock(config.post || (() => Promise.resolve({ data: {} }))),
    put: mock(config.put || (() => Promise.resolve({ data: {} })))
  } as unknown as AxiosInstance;
};
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific package
cd packages/core && bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### Coverage Thresholds

Target coverage levels:

- **Critical files:** 95%+ (base.ts, retry.ts, upload-manager.ts)
- **Business logic:** 90%+ (routers, validators)
- **Utilities:** 85%+ (utils, helpers)

**100% coverage files:**
- client/account.ts
- client/contracts.ts
- client/index.ts
- types/config.ts
- types/enums.ts
- types/errors.ts
- upload/chunk-uploader.ts
- upload/utils.ts
- validation/schemas.ts
- All 13 React hooks and utilities

## Related Documentation

- [Upload Guide](./upload-guide.md)
- [Error Handling](./error-handling.md)
- [API Reference](./api-reference.md)
