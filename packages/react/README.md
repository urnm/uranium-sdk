# @uranium/react

React hooks and components for the Uranium SDK. Built on top of TanStack Query (React Query) for powerful data management, caching, and synchronization.

## Installation

```bash
bun add @uranium/react @uranium/sdk
```

## Peer Dependencies

- `react` ^18.0.0
- `react-dom` ^18.0.0
- `@tanstack/react-query` ^5.0.0

## Features

- **5 Powerful Hooks**: Ready-to-use hooks for all Uranium API operations
- **UraniumProvider**: Context provider for SDK instance management
- **Query Keys Factory**: Consistent cache key generation
- **Error Transformation**: User-friendly error messages
- **Automatic Cache Invalidation**: Smart query invalidation on mutations
- **TypeScript Support**: Full type safety with comprehensive types
- **Progress Tracking**: Real-time upload progress updates
- **Infinite Scroll**: Built-in pagination support for asset lists

## Quick Start

### 1. Wrap your app with UraniumProvider

```tsx
import { UraniumProvider } from "@uranium/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UraniumProvider apiKey="your-api-key">
        <YourApp />
      </UraniumProvider>
    </QueryClientProvider>
  );
}
```

### 2. Use hooks in your components

```tsx
import { useAccount, useContracts, useAssets } from "@uranium/react";

function UserProfile() {
  const { user, isAdmin, smartContractsLimit, isLoading } = useAccount();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user?.nickname}</h1>
      <p>Role: {isAdmin ? "Admin" : "User"}</p>
      <p>Collection Limit: {smartContractsLimit}</p>
    </div>
  );
}

function CollectionsList() {
  const { contracts, isLoading } = useContracts();

  if (isLoading) return <div>Loading collections...</div>;

  return (
    <ul>
      {contracts.map((collection) => (
        <li key={collection.id}>
          {collection.name} ({collection.symbol})
        </li>
      ))}
    </ul>
  );
}
```

## Available Hooks

### useAccount

Fetches current user account information with role-based limits.

```tsx
import { useAccount } from "@uranium/react";

function Component() {
  const {
    user,              // UserEntity | undefined
    isAdmin,           // boolean
    userId,            // string | undefined
    smartContractsLimit, // number (10 for users, 20 for admins)
    isLoading,         // boolean
    isError,           // boolean
    error,             // Error | null
    refetch,           // () => void
  } = useAccount();
}
```

### useContracts

Fetches user's NFT collections (smart contracts).

```tsx
import { useContracts } from "@uranium/react";

function Component() {
  const {
    contracts,  // ContractEntity[]
    isLoading,  // boolean
    isError,    // boolean
    error,      // Error | null
    refetch,    // () => void
  } = useContracts();
}
```

### useAssets

Fetches assets with infinite scroll pagination.

```tsx
import { useAssets } from "@uranium/react";

function Component() {
  const {
    assets,            // AssetEntity[]
    isLoading,         // boolean
    isError,           // boolean
    error,             // Error | null
    hasNextPage,       // boolean
    isFetchingNextPage, // boolean
    fetchNextPage,     // () => void
    refetch,           // () => void
  } = useAssets({
    contractId: "collection-id",
    pageSize: 20,
    sortBy: "createdAt",
    order: "desc",
    quickFilter: "search term",
    enabled: true,
  });

  return (
    <>
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
      {hasNextPage && (
        <button onClick={fetchNextPage} disabled={isFetchingNextPage}>
          Load More
        </button>
      )}
    </>
  );
}
```

### useCreateCollection

Creates a new NFT collection with automatic cache invalidation.

```tsx
import { useCreateCollection } from "@uranium/react";

function CreateCollectionForm() {
  const {
    createCollection, // (params) => Promise<ContractEntity>
    isLoading,        // boolean
    isError,          // boolean
    isSuccess,        // boolean
    error,            // Error | null
    data,             // ContractEntity | undefined
    reset,            // () => void
  } = useCreateCollection();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const collection = await createCollection({
        name: "My NFT Collection",
        symbol: "MNFT",
        type: "ERC721", // or "ERC1155"
      });
      console.log("Created:", collection);
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>Error: {error.message}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Collection"}
      </button>
    </form>
  );
}
```

### useUploadAsset

Uploads files and mints NFTs with progress tracking.

```tsx
import { useUploadAsset } from "@uranium/react";

function UploadAssetForm() {
  const {
    uploadAsset,   // (params) => Promise<AssetEntity>
    isLoading,     // boolean
    isError,       // boolean
    isSuccess,     // boolean
    error,         // Error | null
    data,          // AssetEntity | undefined
    progress,      // UploadProgress | null
    reset,         // () => void
  } = useUploadAsset();

  const handleUpload = async (file: File) => {
    try {
      const asset = await uploadAsset({
        file,
        options: {
          contractId: "collection-id",
          metadata: {
            title: "My NFT",
            description: "Amazing artwork",
            location: "Optional location",
          },
          editions: 1,
          shareWithCommunity: false,
        },
      });
      console.log("Uploaded:", asset);
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <div>
      {progress && (
        <div>
          <p>Stage: {progress.stage}</p>
          <p>Progress: {progress.percent}%</p>
          <p>{progress.currentStatus}</p>

          {/* Show chunk progress during UPLOADING stage */}
          {progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined && (
            <p>Chunk: {progress.chunkProgress}%</p>
          )}
        </div>
      )}
      {error && <div>Error: {error.message}</div>}
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={isLoading}
      />
    </div>
  );
}
```

## Query Configuration

All hooks use React Query with the following default configuration:

- **Stale Time**: 5 minutes - Data is considered fresh for 5 minutes
- **Retry**: 3 attempts on failure (configurable via UraniumProvider)
- **Cache**: Persistent across component unmounts
- **Auto-invalidation**: Mutations automatically invalidate related queries

### Custom Configuration

```tsx
<UraniumProvider
  apiKey="your-api-key"
  config={{
    baseUrl: "https://gw.urnm.pro",
    timeout: 20000,
    debug: false,
    retry: {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      retryableStatuses: [500, 502, 503, 504],
    },
  }}
>
  <YourApp />
</UraniumProvider>
```

## Advanced Usage

### Accessing SDK Instance

```tsx
import { useUranium } from "@uranium/react";

function Component() {
  const sdk = useUranium();

  // Access SDK directly for custom operations
  const customOperation = async () => {
    const result = await sdk.assets.get("asset-id");
    return result;
  };
}
```

### Query Keys

```tsx
import { accountQueryKeys, contractsQueryKeys, assetsQueryKeys } from "@uranium/react";

// Use in custom queries or manual invalidation
const queryClient = useQueryClient();

// Invalidate all account queries
queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });

// Invalidate specific asset list
queryClient.invalidateQueries({
  queryKey: assetsQueryKeys.list({ contractId: "collection-id" }),
});
```

## Error Handling

All hooks transform errors into user-friendly messages:

```tsx
function Component() {
  const { error, isError } = useAccount();

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }
}
```

For custom error handling:

```tsx
import { getErrorMessage } from "@uranium/react";

try {
  await uploadAsset({ file, options });
} catch (error) {
  const message = getErrorMessage(error);
  console.error(message);
}
```

## Documentation

For comprehensive React integration guides and examples, visit the main repository documentation.

## Build Information

- **Format**: ESM and CommonJS
- **TypeScript**: Full type declarations included
- **Target**: Browser and Node.js
- **Dependencies**: @uranium/sdk, @uranium/types, @tanstack/react-query, axios

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun test

# Development mode with watch
bun run dev
```

## License

Apache 2.0

See [LICENSE](../../LICENSE) in the repository root for full license text.
