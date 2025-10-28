# React Integration Guide

This guide covers using the Uranium SDK in React applications with the `@uranium/react` package.

## Table of Contents

- [Installation](#installation)
- [Setup UraniumProvider](#setup-uraniumprovider)
- [Available Hooks](#available-hooks)
- [useAccount Hook](#useaccount-hook)
- [useContracts Hook](#usecontracts-hook)
- [useAssets Hook](#useassets-hook)
- [useCreateCollection Hook](#usecreatecollection-hook)
- [useUploadAsset Hook](#useuploadasset-hook)
- [Query Keys](#query-keys)
- [Error Handling](#error-handling)
- [Complete Example](#complete-example)

## Installation

Install both the core SDK and React integration:

```bash
bun add @uranium/sdk @uranium/react
```

The React package depends on React Query (TanStack Query) which will be installed automatically.

## Setup UraniumProvider

Wrap your application with `UraniumProvider` to make the SDK available to all components:

```typescript
import { UraniumProvider } from "@uranium/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      retry: 3,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UraniumProvider apiKey={import.meta.env.VITE_URANIUM_API_KEY}>
        <YourApp />
      </UraniumProvider>
    </QueryClientProvider>
  );
}
```

### Provider Configuration

The provider accepts all SDK configuration options:

```typescript
<UraniumProvider
  apiKey="your-api-key"
  baseUrl="https://gw.urnm.pro"
  timeout={20000}
  debug={true}
  retry={{
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000
  }}
>
  <YourApp />
</UraniumProvider>
```

### Custom Query Client

You can provide a custom Query Client:

```typescript
import { QueryClient } from "@tanstack/react-query";

const customQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,  // 10 minutes
      cacheTime: 15 * 60 * 1000,  // 15 minutes
      refetchOnWindowFocus: false,
    },
  },
});

<UraniumProvider
  apiKey="your-api-key"
  queryClient={customQueryClient}
>
  <YourApp />
</UraniumProvider>
```

### Access SDK Directly

Use the `useUranium` hook to access the SDK instance directly:

```typescript
import { useUranium } from "@uranium/react";

function MyComponent() {
  const sdk = useUranium();

  // Access SDK directly for custom operations
  const handleCustomOperation = async () => {
    const user = await sdk.account.getMe("my-device");
    console.log(user);
  };

  return <button onClick={handleCustomOperation}>Custom API Call</button>;
}
```

## Available Hooks

The React package provides five main hooks:

| Hook | Purpose | Query Type |
|------|---------|------------|
| `useAccount` | Get user information | Query |
| `useContracts` | List collections | Query |
| `useAssets` | List assets with infinite scroll | Infinite Query |
| `useCreateCollection` | Create new collections | Mutation |
| `useUploadAsset` | Upload files and mint NFTs | Mutation |

## useAccount Hook

Fetch and display user information with derived state:

```typescript
import { useAccount } from "@uranium/react";

function UserProfile() {
  const {
    data: user,
    isLoading,
    isError,
    error,
    isAdmin,              // Derived: user.role === "ADMIN"
    smartContractsLimit   // Derived: 20 for admin, 10 for user
  } = useAccount();

  if (isLoading) return <div>Loading user info...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Welcome, {user.nickname}!</h2>
      <p>Role: {user.role}</p>
      <p>User ID: {user.userId}</p>
      <p>Phone: {user.phoneNumber}</p>

      {isAdmin && <AdminBadge />}

      <p>Collection Limit: {smartContractsLimit}</p>
    </div>
  );
}
```

### Hook Options

```typescript
const { data, isLoading } = useAccount({
  staleTime: 5 * 60 * 1000,  // Override default stale time
  enabled: true,              // Enable/disable query
  refetchInterval: 60000,     // Refetch every minute
  onSuccess: (data) => {
    console.log("User loaded:", data);
  }
});
```

### Derived State

The hook provides convenient derived state:

```typescript
const { isAdmin, smartContractsLimit } = useAccount();

// isAdmin = user.role === "ADMIN"
// smartContractsLimit = isAdmin ? 20 : 10

if (isAdmin) {
  console.log("User has admin privileges");
}

console.log(`Can create up to ${smartContractsLimit} collections`);
```

## useContracts Hook

List and manage collections:

```typescript
import { useContracts } from "@uranium/react";

function CollectionsList() {
  const {
    data: collections,
    isLoading,
    isError,
    error,
    refetch
  } = useContracts();

  if (isLoading) return <div>Loading collections...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>My Collections ({collections.length})</h2>

      <button onClick={() => refetch()}>
        Refresh
      </button>

      <ul>
        {collections.map(collection => (
          <li key={collection.id}>
            <h3>{collection.name} ({collection.symbol})</h3>
            <p>Type: {collection.ercType}</p>
            <p>Status: {collection.status}</p>
            <p>NFTs: {collection.lastTokenId}</p>
            <p>Address: {collection.address}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Hook Options

```typescript
const { data, refetch } = useContracts({
  staleTime: 5 * 60 * 1000,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  onSuccess: (collections) => {
    console.log(`Loaded ${collections.length} collections`);
  }
});
```

### Check Collection Limit

Combine with `useAccount` to check limits:

```typescript
function CollectionsHeader() {
  const { data: collections } = useContracts();
  const { smartContractsLimit } = useAccount();

  const remaining = smartContractsLimit - (collections?.length || 0);
  const canCreate = remaining > 0;

  return (
    <div>
      <h2>Collections ({collections?.length || 0}/{smartContractsLimit})</h2>
      {canCreate ? (
        <p>{remaining} slots remaining</p>
      ) : (
        <p>Collection limit reached</p>
      )}
    </div>
  );
}
```

## useAssets Hook

Infinite scroll query for assets with filtering:

```typescript
import { useAssets } from "@uranium/react";

function AssetsList({ collectionId }: { collectionId?: string }) {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useAssets({
    contractId: collectionId,
    pageSize: 20,
    sortBy: "createdAt",
    order: "desc"
  });

  if (isLoading) return <div>Loading assets...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  // Flatten pages into single array
  const allAssets = data?.pages.flatMap(page => page.data) || [];

  return (
    <div>
      <h2>Assets ({data?.pages[0]?.meta.total || 0})</h2>

      <div className="assets-grid">
        {allAssets.map(asset => (
          <div key={asset.id} className="asset-card">
            <img src={asset.thumbnailUrl} alt={asset.title} />
            <h3>{asset.title}</h3>
            <p>Status: {asset.status}</p>
            {asset.description && <p>{asset.description}</p>}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

### Search Assets

Use the `quickFilter` parameter for search:

```typescript
function AssetsSearch() {
  const [search, setSearch] = useState("");

  const { data } = useAssets({
    quickFilter: search,
    pageSize: 20,
    sortBy: "title",
    order: "asc"
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search assets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Display results */}
    </div>
  );
}
```

### Filter by Collection

Filter assets to a specific collection:

```typescript
function CollectionAssets({ collectionId }: { collectionId: string }) {
  const { data, isLoading } = useAssets({
    contractId: collectionId,
    pageSize: 10
  });

  if (isLoading) return <div>Loading...</div>;

  const totalAssets = data?.pages[0]?.meta.total || 0;

  return (
    <div>
      <h3>Assets in Collection: {totalAssets}</h3>
      {/* Render assets */}
    </div>
  );
}
```

### Infinite Scroll Implementation

Implement infinite scroll with Intersection Observer:

```typescript
import { useRef, useEffect } from "react";
import { useAssets } from "@uranium/react";

function InfiniteAssetsList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useAssets({
    pageSize: 20
  });

  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allAssets = data?.pages.flatMap(page => page.data) || [];

  return (
    <div>
      {allAssets.map(asset => (
        <div key={asset.id}>{asset.title}</div>
      ))}

      <div ref={observerTarget} style={{ height: "20px" }} />

      {isFetchingNextPage && <div>Loading more...</div>}
    </div>
  );
}
```

## useCreateCollection Hook

Create new collections with automatic cache invalidation:

```typescript
import { useCreateCollection } from "@uranium/react";

function CreateCollectionForm() {
  const {
    mutate: createCollection,
    isPending,
    isError,
    error,
    isSuccess,
    data: newCollection
  } = useCreateCollection();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createCollection({
      name: formData.get("name") as string,
      symbol: formData.get("symbol") as string,
      type: formData.get("type") as "ERC721" | "ERC1155"
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Collection Name" required />
      <input name="symbol" placeholder="Symbol" required />

      <select name="type" required>
        <option value="ERC721">ERC721 (Unique NFTs)</option>
        <option value="ERC1155">ERC1155 (Multi-Edition)</option>
      </select>

      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Collection"}
      </button>

      {isError && <p className="error">{error.message}</p>}
      {isSuccess && <p>Collection created: {newCollection.name}</p>}
    </form>
  );
}
```

### Callbacks

Use callbacks to handle success and errors:

```typescript
const { mutate } = useCreateCollection({
  onSuccess: (collection) => {
    console.log("Collection created:", collection);
    toast.success(`Created ${collection.name}`);
    navigate(`/collections/${collection.id}`);
  },
  onError: (error) => {
    console.error("Failed to create collection:", error);
    toast.error("Failed to create collection");
  }
});
```

### Validation

The hook automatically validates inputs:

```typescript
const { mutate, error } = useCreateCollection();

// Invalid input will trigger ValidationError
mutate({
  name: "X",      // Too short! Minimum 3 characters
  symbol: "Y",    // Too short! Minimum 3 characters
  type: "ERC721"
});

// Error message will be user-friendly
console.log(error?.message);
// "Collection name must be at least 3 characters"
```

### Automatic Cache Updates

The hook automatically invalidates and refetches the collections list:

```typescript
function CreateCollectionButton() {
  const { mutate } = useCreateCollection();
  const { data: collections } = useContracts();

  const handleCreate = () => {
    mutate({
      name: "New Collection",
      symbol: "NEW",
      type: "ERC721"
    });

    // Collections list will automatically refresh after creation
  };

  return (
    <div>
      <p>Current collections: {collections?.length || 0}</p>
      <button onClick={handleCreate}>Create Collection</button>
    </div>
  );
}
```

## useUploadAsset Hook

Upload files and mint NFTs with progress tracking.

**Important:** The progress tracking shows **client-side upload stages**, not the backend NFT minting status. After the upload completes (stage = DONE), the NFT is submitted to a mint queue and minted asynchronously on the blockchain. The returned asset may initially have a pending status.

```typescript
import { useUploadAsset } from "@uranium/react";

function UploadForm({ collectionId }: { collectionId: string }) {
  const {
    mutate: uploadAsset,
    isPending,
    isError,
    error,
    isSuccess,
    data: mintedAsset,
    progress
  } = useUploadAsset();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadAsset({
      file,
      options: {
        contractId: collectionId,
        metadata: {
          title: "My NFT",
          description: "Created with Uranium SDK",
          location: "San Francisco"
        },
        editions: 1,
        shareWithCommunity: true
      }
    });
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        disabled={isPending}
      />

      {isPending && progress && (
        <div>
          <p>Stage: {progress.stage}</p>
          <progress value={progress.percent} max={100} />
          <p>{progress.percent.toFixed(0)}%</p>

          {progress.uploadedChunks > 0 && (
            <p>
              Uploaded {progress.uploadedChunks}/{progress.totalChunks} chunks
            </p>
          )}

          {/* Show fine-grained chunk progress during UPLOADING stage */}
          {progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined && (
            <div>
              <p>Current chunk: {progress.chunkProgress.toFixed(0)}%</p>
              <progress value={progress.chunkProgress} max={100} />
            </div>
          )}
        </div>
      )}

      {isError && <p className="error">{error.message}</p>}
      {isSuccess && (
        <div>
          <p>NFT minted successfully!</p>
          <img src={mintedAsset.thumbnailUrl} alt={mintedAsset.title} />
          <a href={mintedAsset.mediaUrl} target="_blank">View Full Size</a>
        </div>
      )}
    </div>
  );
}
```

### Progress States

The upload goes through 7 client-side stages:

```typescript
function UploadProgress({ progress }: { progress?: UploadProgress }) {
  if (!progress) return null;

  const stageLabels = {
    VALIDATING: "Validating file...",
    PREPARING: "Preparing upload...",
    PROCESSING: "Processing file...",
    UPLOADING: "Uploading file...",
    FINALIZING: "Finalizing upload...",
    REQUESTING_MINT: "Submitting NFT to mint queue...",
    DONE: "Complete!",
  };

  return (
    <div className="upload-progress">
      <p>{stageLabels[progress.stage]}</p>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p>{progress.percent.toFixed(1)}%</p>

      {/* Show chunk progress during UPLOADING stage */}
      {progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined && (
        <div className="chunk-progress">
          <p>Current chunk: {progress.chunkProgress.toFixed(0)}%</p>
        </div>
      )}
    </div>
  );
}

function UploadComponent() {
  const { progress, isPending } = useUploadAsset();

  return (
    <div>
      {isPending && <UploadProgress progress={progress} />}
    </div>
  );
}
```

### Cancel Uploads

Cancel uploads using AbortController:

```typescript
import { useRef } from "react";

function CancellableUpload() {
  const abortControllerRef = useRef<AbortController>();
  const { mutate, isPending } = useUploadAsset();

  const handleUpload = (file: File) => {
    // Create new AbortController
    abortControllerRef.current = new AbortController();

    mutate({
      file,
      options: {
        contractId: "...",
        metadata: { title: "..." },
        signal: abortControllerRef.current.signal
      }
    });
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }} />

      {isPending && (
        <button onClick={handleCancel}>Cancel Upload</button>
      )}
    </div>
  );
}
```

### Callbacks

Use callbacks for success and error handling:

```typescript
const { mutate } = useUploadAsset({
  onSuccess: (asset) => {
    console.log("Asset uploaded:", asset);
    toast.success(`Minted ${asset.title}`);
    navigate(`/assets/${asset.id}`);
  },
  onError: (error) => {
    console.error("Upload failed:", error);
    toast.error("Failed to upload asset");
  },
  onSettled: () => {
    // Always called after success or error
    console.log("Upload complete");
  }
});
```

### Automatic Cache Updates

The hook automatically invalidates related queries:

```typescript
function UploadToCollection({ collectionId }: { collectionId: string }) {
  const { mutate } = useUploadAsset();
  const { data: assets } = useAssets({ contractId: collectionId });

  const handleUpload = (file: File) => {
    mutate({
      file,
      options: {
        contractId: collectionId,
        metadata: { title: file.name }
      }
    });

    // Assets list will automatically refresh after upload
  };

  return (
    <div>
      <p>Current assets: {assets?.pages[0]?.meta.total || 0}</p>
      {/* Upload form */}
    </div>
  );
}
```

## Query Keys

The package uses a structured query key system for cache management:

```typescript
import { queryKeys } from "@uranium/react";

// Query key structure
queryKeys.account()              // ["uranium", "account"]
queryKeys.contracts()            // ["uranium", "contracts"]
queryKeys.assets({ contractId }) // ["uranium", "assets", { contractId, ... }]

// Use in custom queries
import { useQuery } from "@tanstack/react-query";

function useCustomQuery() {
  return useQuery({
    queryKey: queryKeys.account(),
    queryFn: async () => {
      // Custom query logic
    }
  });
}
```

### Manual Cache Invalidation

Invalidate queries manually when needed:

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@uranium/react";

function RefreshButton() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Invalidate specific query
    queryClient.invalidateQueries({
      queryKey: queryKeys.contracts()
    });

    // Invalidate all assets queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.assets()
    });

    // Invalidate all Uranium queries
    queryClient.invalidateQueries({
      queryKey: ["uranium"]
    });
  };

  return <button onClick={handleRefresh}>Refresh All</button>;
}
```

## Error Handling

### User-Friendly Error Messages

The React package provides user-friendly error messages:

```typescript
import { getErrorMessage } from "@uranium/react";

function MyComponent() {
  const { isError, error } = useContracts();

  if (isError) {
    const message = getErrorMessage(error);
    return <div className="error">{message}</div>;
  }

  // Render component
}
```

**Error message examples:**
- `AuthenticationError` → "Authentication failed. Please check your API key."
- `ValidationError` → "Invalid input. Please check your data."
- `NetworkError` → "Network error. Please check your connection."
- `LimitExceededError` → "Collection limit reached. Please delete some collections or upgrade your account."

### Validation Errors

Display field-specific validation errors:

```typescript
import { ValidationError } from "@uranium/sdk";

function CreateCollectionForm() {
  const { mutate, isError, error } = useCreateCollection();

  return (
    <form>
      {/* Form fields */}

      {isError && error instanceof ValidationError && error.fields && (
        <div className="validation-errors">
          {Object.entries(error.fields).map(([field, messages]) => (
            <div key={field}>
              <strong>{field}:</strong>
              <ul>
                {messages.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
```

### Global Error Boundary

Create a global error boundary for React Query errors:

```typescript
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { getErrorMessage } from "@uranium/react";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <p>{getErrorMessage(error)}</p>
      <button onClick={resetErrorBoundary}>Try Again</button>
    </div>
  );
}

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={reset}>
          <UraniumProvider apiKey="...">
            <YourApp />
          </UraniumProvider>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## Complete Example

Here's a complete React application using all hooks:

```typescript
import {
  UraniumProvider,
  useAccount,
  useContracts,
  useAssets,
  useCreateCollection,
  useUploadAsset
} from "@uranium/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const queryClient = new QueryClient();

function Dashboard() {
  const { data: user, isAdmin, smartContractsLimit } = useAccount();
  const { data: collections, isLoading: collectionsLoading } = useContracts();
  const { data: assets } = useAssets({ pageSize: 10 });

  const canCreateCollection = (collections?.length || 0) < smartContractsLimit;

  return (
    <div className="dashboard">
      <header>
        <h1>Welcome, {user?.nickname}!</h1>
        {isAdmin && <span className="badge">Admin</span>}
      </header>

      <section>
        <h2>Collections ({collections?.length || 0}/{smartContractsLimit})</h2>
        {collectionsLoading ? (
          <p>Loading...</p>
        ) : (
          <CollectionsList collections={collections || []} />
        )}

        {canCreateCollection && <CreateCollectionButton />}
      </section>

      <section>
        <h2>Recent Assets</h2>
        <AssetsList assets={assets?.pages[0]?.data || []} />
      </section>
    </div>
  );
}

function CollectionsList({ collections }) {
  return (
    <div className="collections-grid">
      {collections.map(collection => (
        <div key={collection.id} className="collection-card">
          <h3>{collection.name}</h3>
          <p>{collection.symbol} • {collection.ercType}</p>
          <p>NFTs: {collection.lastTokenId}</p>
          <CollectionAssets collectionId={collection.id} />
        </div>
      ))}
    </div>
  );
}

function CollectionAssets({ collectionId }) {
  const { data } = useAssets({ contractId: collectionId, pageSize: 5 });
  const count = data?.pages[0]?.meta.total || 0;

  return <p className="asset-count">{count} assets</p>;
}

function CreateCollectionButton() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return <button onClick={() => setIsOpen(true)}>Create Collection</button>;
  }

  return <CreateCollectionForm onClose={() => setIsOpen(false)} />;
}

function CreateCollectionForm({ onClose }) {
  const { mutate, isPending } = useCreateCollection({
    onSuccess: () => {
      toast.success("Collection created!");
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    mutate({
      name: formData.get("name"),
      symbol: formData.get("symbol"),
      type: formData.get("type")
    });
  };

  return (
    <form onSubmit={handleSubmit} className="modal">
      <h3>Create Collection</h3>

      <input name="name" placeholder="Collection Name" required />
      <input name="symbol" placeholder="Symbol" required />

      <select name="type" required>
        <option value="ERC721">ERC721 (Unique)</option>
        <option value="ERC1155">ERC1155 (Multi-Edition)</option>
      </select>

      <div className="actions">
        <button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

function AssetsList({ assets }) {
  return (
    <div className="assets-grid">
      {assets.map(asset => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function AssetCard({ asset }) {
  return (
    <div className="asset-card">
      <img src={asset.thumbnailUrl} alt={asset.title} />
      <h4>{asset.title}</h4>
      <p className="status">{asset.status}</p>
    </div>
  );
}

function UploadAssetButton({ collectionId }) {
  const [file, setFile] = useState<File | null>(null);
  const { mutate, isPending, progress } = useUploadAsset({
    onSuccess: (asset) => {
      toast.success(`Minted ${asset.title}`);
      setFile(null);
    }
  });

  const handleUpload = () => {
    if (!file) return;

    mutate({
      file,
      options: {
        contractId: collectionId,
        metadata: {
          title: file.name,
        }
      }
    });
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={isPending}
      />

      <button onClick={handleUpload} disabled={!file || isPending}>
        Upload
      </button>

      {isPending && progress && (
        <div>
          <p>{progress.stage}: {progress.percent.toFixed(0)}%</p>
          <progress value={progress.percent} max={100} />

          {/* Show chunk progress during UPLOADING */}
          {progress.stage === 'UPLOADING' && progress.chunkProgress !== undefined && (
            <div>
              <small>Chunk: {progress.chunkProgress.toFixed(0)}%</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UraniumProvider apiKey={import.meta.env.VITE_URANIUM_API_KEY}>
        <Dashboard />
      </UraniumProvider>
    </QueryClientProvider>
  );
}

export default App;
```

## Best Practices

### 1. Use Query Keys Consistently

Always use the provided query keys factory:

```typescript
import { queryKeys } from "@uranium/react";

// Good
queryClient.invalidateQueries({ queryKey: queryKeys.contracts() });

// Bad - don't hardcode keys
queryClient.invalidateQueries({ queryKey: ["uranium", "contracts"] });
```

### 2. Handle Loading States

Always handle loading states for better UX:

```typescript
function MyComponent() {
  const { data, isLoading, isError } = useContracts();

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage />;
  if (!data) return <EmptyState />;

  return <CollectionsList collections={data} />;
}
```

### 3. Provide User Feedback

Show feedback for mutations:

```typescript
import toast from "react-hot-toast";

const { mutate } = useCreateCollection({
  onSuccess: () => toast.success("Collection created!"),
  onError: () => toast.error("Failed to create collection")
});
```

### 4. Implement Optimistic Updates

For better UX, update UI before API responds:

```typescript
const { mutate } = useCreateCollection({
  onMutate: async (newCollection) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.contracts() });

    // Snapshot previous value
    const previousCollections = queryClient.getQueryData(queryKeys.contracts());

    // Optimistically update
    queryClient.setQueryData(queryKeys.contracts(), (old) => [
      ...old,
      { ...newCollection, id: "temp", status: "PENDING" }
    ]);

    return { previousCollections };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(
      queryKeys.contracts(),
      context.previousCollections
    );
  }
});
```

### 5. Configure Stale Time

Set appropriate stale times based on data freshness needs:

```typescript
// User info changes rarely - 10 minutes
const { data } = useAccount({
  staleTime: 10 * 60 * 1000
});

// Collections change more often - 1 minute
const { data } = useContracts({
  staleTime: 1 * 60 * 1000
});
```

## TypeScript Support

All hooks are fully typed:

```typescript
import type {
  UseAccountResult,
  UseContractsResult,
  UseAssetsResult,
  UseCreateCollectionResult,
  UseUploadAssetResult
} from "@uranium/react";

// Type the hook results
const accountResult: UseAccountResult = useAccount();
const contractsResult: UseContractsResult = useContracts();
```

## Need Help?

- Check the [Core SDK Guide](./core-sdk-guide.md) for SDK basics
- Review the [React Query docs](https://tanstack.com/query/latest) for query management
- Enable debug mode to see detailed logs

Happy building with React and Uranium!
