# Error Handling Guide

Comprehensive guide to error handling in the Uranium SDK.

## Table of Contents

- [Overview](#overview)
- [Error Hierarchy](#error-hierarchy)
- [Error Types](#error-types)
- [Error Codes](#error-codes)
- [Retry Logic](#retry-logic)
- [Type Guards](#type-guards)
- [Error Handling Patterns](#error-handling-patterns)
- [React Error Handling](#react-error-handling)
- [Best Practices](#best-practices)

## Overview

The Uranium SDK provides a structured error handling system with:

- **Type-safe error classes** extending a common base
- **Organized error codes** by category (1xxx auth, 2xxx validation, etc.)
- **Automatic retry logic** for transient failures
- **Context preservation** for debugging
- **User-friendly error messages** for UI display

All SDK errors extend from `UraniumError`, making it easy to catch and handle SDK-specific errors.

## Error Hierarchy

```
Error (JavaScript base)
  └─ UraniumError (SDK base)
      ├─ AuthenticationError    // 401, 403 errors
      ├─ ValidationError        // 400 validation errors
      ├─ NetworkError           // Network/connection errors
      ├─ NotFoundError          // 404 resource not found
      ├─ UploadError            // File upload errors
      ├─ MintingError           // NFT minting errors
      ├─ BlockchainError        // Blockchain transaction errors
      └─ LimitExceededError     // Rate limits, quotas
```

### Class Diagram

```
┌─────────────────────────────────────────────┐
│              UraniumError                   │
├─────────────────────────────────────────────┤
│ + message: string                           │
│ + code: string                              │
│ + statusCode?: number                       │
│ + context?: Record<string, unknown>         │
│ + timestamp: Date                           │
└─────────────────────────────────────────────┘
                    ▲
                    │
    ┌───────────────┴──────────────────┐
    │                                   │
┌───────────────┐              ┌────────────────┐
│ NetworkError  │              │ UploadError    │
├───────────────┤              ├────────────────┤
│ + retryable   │              │ + retryAttempts│
└───────────────┘              └────────────────┘
```

## Error Types

### UraniumError (Base)

Base class for all SDK errors.

```typescript
class UraniumError extends Error {
  name: string;
  message: string;
  code: string;              // Error code (e.g., "AUTH_INVALID")
  statusCode?: number;       // HTTP status code if applicable
  context?: Record<string, unknown>;  // Additional context
  timestamp: Date;           // When error occurred
}
```

**Example:**
```typescript
try {
  await sdk.contracts.create({ ... });
} catch (error) {
  if (error instanceof UraniumError) {
    console.error("SDK Error:", error.message);
    console.error("Code:", error.code);
    console.error("Status:", error.statusCode);
    console.error("Context:", error.context);
    console.error("Timestamp:", error.timestamp);
  }
}
```

### AuthenticationError

Authentication and authorization failures.

**Thrown when:**
- API key is missing or invalid (401)
- Insufficient permissions (403)
- API key has expired (401)

```typescript
class AuthenticationError extends UraniumError {
  // Inherits all UraniumError properties
}
```

**Example:**
```typescript
try {
  const user = await sdk.account.getMe("device-id");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Authentication failed:", error.message);
    // Redirect to login or show API key setup instructions
  }
}
```

**Common codes:**
- `AUTH_REQUIRED` - API key is missing
- `AUTH_INVALID` - API key is invalid
- `AUTH_EXPIRED` - API key has expired
- `PERMISSION_DENIED` - User lacks required permissions

### ValidationError

Input validation failures before or after API calls.

**Thrown when:**
- Required fields are missing
- Values are out of valid range
- Format is incorrect (e.g., invalid email)
- Zod schema validation fails

```typescript
class ValidationError extends UraniumError {
  // Inherits all UraniumError properties
}
```

**Example:**
```typescript
try {
  await sdk.contracts.create({
    name: "AB",  // Too short (min 3 chars)
    symbol: "NFT",
    type: "ERC721"
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Validation failed:", error.message);
    console.error("Field:", error.context?.field);
    // Show validation error to user
  }
}
```

**Common codes:**
- `INVALID_INPUT` - General validation failure
- `MISSING_FIELD` - Required field is missing
- `INVALID_FORMAT` - Value format is incorrect
- `VALUE_OUT_OF_RANGE` - Value exceeds allowed range

### NetworkError

Network connectivity and HTTP errors.

**Thrown when:**
- Network request fails
- Server returns error status (500, 502, 503, 504)
- Timeout occurs
- Connection is lost

```typescript
class NetworkError extends UraniumError {
  retryable: boolean;  // Can this error be retried?
}
```

**Example:**
```typescript
try {
  const assets = await sdk.assets.list();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error("Network error:", error.message);
    if (error.retryable) {
      console.log("This error can be retried");
      // Implement retry logic or enable SDK retry
    } else {
      console.log("This error should not be retried");
    }
  }
}
```

**Common codes:**
- `NETWORK_ERROR` - General network failure
- `TIMEOUT` - Request timed out
- `CONNECTION_FAILED` - Cannot connect to server
- `SERVICE_UNAVAILABLE` - Server is temporarily unavailable

### NotFoundError

Resource not found (404).

**Thrown when:**
- Collection/contract doesn't exist
- Asset/file doesn't exist
- User doesn't exist
- Endpoint doesn't exist

```typescript
class NotFoundError extends UraniumError {
  // Inherits all UraniumError properties
}
```

**Example:**
```typescript
try {
  const assets = await sdk.assets.list({
    contractId: "non-existent-id"
  });
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error("Resource not found:", error.message);
    // Show "collection not found" message to user
  }
}
```

**Common codes:**
- `NOT_FOUND` - Resource doesn't exist
- `CONTRACT_NOT_FOUND` - Collection/contract not found

### UploadError

File upload failures.

**Thrown when:**
- File is too large (> 100 MB)
- File type is unsupported
- Upload is cancelled by user
- Chunk upload fails after retries
- ETag extraction fails

```typescript
class UploadError extends UraniumError {
  retryAttempts?: number;  // Number of retry attempts made
}
```

**Example:**
```typescript
try {
  await sdk.upload.upload(largeFile, options);
} catch (error) {
  if (error instanceof UploadError) {
    console.error("Upload failed:", error.message);
    console.error("Retries:", error.retryAttempts);

    if (error.code === "FILE_TOO_LARGE") {
      console.log("File exceeds 100 MB limit");
    } else if (error.code === "UPLOAD_CANCELLED") {
      console.log("User cancelled the upload");
    }
  }
}
```

**Common codes:**
- `UPLOAD_FAILED` - Upload failed after retries
- `UPLOAD_CANCELLED` - User cancelled upload
- `UPLOAD_ABORTED` - Upload aborted via AbortSignal
- `FILE_TOO_LARGE` - File exceeds 100 MB
- `INVALID_FILE_TYPE` - Unsupported file type
- `CHUNK_UPLOAD_FAILED` - Chunk upload failed
- `ETAG_MISSING` - Failed to extract ETag from response

### MintingError

NFT minting process failures.

**Thrown when:**
- Minting transaction fails
- Metadata is invalid
- Contract/collection doesn't exist
- Insufficient balance for gas fees

```typescript
class MintingError extends UraniumError {
  assetId?: string;  // Asset/file ID being minted
  stage?: string;    // Stage where error occurred
}
```

**Example:**
```typescript
try {
  await sdk.assets.startMinting({ ... });
} catch (error) {
  if (error instanceof MintingError) {
    console.error("Minting failed:", error.message);
    console.error("Asset ID:", error.assetId);
    console.error("Failed at stage:", error.stage);
  }
}
```

**Common codes:**
- `MINTING_FAILED` - General minting failure
- `METADATA_INVALID` - NFT metadata is invalid
- `INSUFFICIENT_BALANCE` - Not enough funds for gas

### BlockchainError

Blockchain transaction failures.

**Thrown when:**
- Transaction fails or reverts
- Gas estimation fails
- Network is congested
- Transaction cannot be submitted

```typescript
class BlockchainError extends UraniumError {
  transactionHash?: string;  // Transaction hash if available
  contractAddress?: string;  // Contract address involved
}
```

**Example:**
```typescript
try {
  await sdk.assets.startMinting({ ... });
} catch (error) {
  if (error instanceof BlockchainError) {
    console.error("Blockchain error:", error.message);
    console.error("Transaction:", error.transactionHash);
    console.error("Contract:", error.contractAddress);
  }
}
```

**Common codes:**
- `TRANSACTION_FAILED` - Transaction execution failed
- `TRANSACTION_REVERTED` - Transaction reverted on-chain
- `GAS_ESTIMATION_FAILED` - Cannot estimate gas
- `NETWORK_CONGESTION` - Blockchain network is congested

### LimitExceededError

Rate limits and quotas exceeded (429).

**Thrown when:**
- Too many requests in time window
- Collection limit reached
- File size quota exceeded

```typescript
class LimitExceededError extends UraniumError {
  limit?: number;     // Limit that was exceeded
  current?: number;   // Current value
  resetAt?: Date;     // When limit resets
}
```

**Example:**
```typescript
try {
  await sdk.contracts.create({ ... });
} catch (error) {
  if (error instanceof LimitExceededError) {
    console.error("Limit exceeded:", error.message);
    console.error("Limit:", error.limit);
    console.error("Current:", error.current);
    console.error("Resets at:", error.resetAt);

    // Wait until reset
    if (error.resetAt) {
      const waitMs = error.resetAt.getTime() - Date.now();
      console.log(`Wait ${waitMs}ms before retrying`);
    }
  }
}
```

**Common codes:**
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `QUOTA_EXCEEDED` - Quota limit reached
- `FILE_TOO_LARGE` - File size quota exceeded (413)

## Error Codes

Error codes are organized by category for easy identification.

### Authentication (1xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_REQUIRED` | 401 | API key is missing |
| `AUTH_INVALID` | 401 | API key is invalid |
| `AUTH_EXPIRED` | 401 | API key has expired |
| `PERMISSION_DENIED` | 403 | User lacks permissions |

### Validation (2xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_INPUT` | 400 | General validation error |
| `MISSING_FIELD` | 400 | Required field missing |
| `INVALID_FORMAT` | 400 | Incorrect format |
| `VALUE_OUT_OF_RANGE` | 400 | Value exceeds range |

### Resources (3xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `CONFLICT` | 409 | Resource conflict |

### Limits (4xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `QUOTA_EXCEEDED` | 429 | Quota limit reached |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |

### Upload (5xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `UPLOAD_FAILED` | 500 | Upload failed |
| `UPLOAD_TIMEOUT` | 408 | Upload timed out |
| `INVALID_FILE_TYPE` | 400 | Unsupported file type |
| `CHUNK_UPLOAD_FAILED` | 500 | Chunk upload failed |

### Minting (6xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `MINTING_FAILED` | 500 | Minting process failed |
| `METADATA_INVALID` | 400 | NFT metadata invalid |
| `CONTRACT_NOT_FOUND` | 404 | Collection not found |
| `INSUFFICIENT_BALANCE` | 402 | Not enough funds |

### Blockchain (7xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `TRANSACTION_FAILED` | 500 | Transaction failed |
| `TRANSACTION_REVERTED` | 500 | Transaction reverted |
| `GAS_ESTIMATION_FAILED` | 500 | Gas estimation failed |
| `NETWORK_CONGESTION` | 503 | Network congested |

### Network (8xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `NETWORK_ERROR` | 500 | Network error |
| `TIMEOUT` | 408 | Request timeout |
| `CONNECTION_FAILED` | 503 | Connection failed |

### Server (9xxx)

| Code | HTTP | Description |
|------|------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service unavailable |
| `MAINTENANCE` | 503 | Under maintenance |

## Retry Logic

The SDK includes automatic retry with exponential backoff for transient failures.

### What Gets Retried

**✅ Retryable errors:**
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable
- `504` - Gateway Timeout
- Network timeouts
- Connection errors

**❌ Non-retryable errors:**
- `401` - Unauthorized (auth errors)
- `403` - Forbidden (permission errors)
- `400` - Bad Request (validation errors)
- `404` - Not Found (resource errors)
- `429` - Rate Limited (wait for reset)

### Configuration

```typescript
const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  retry: {
    enabled: true,           // Enable automatic retry
    maxRetries: 3,           // Max retry attempts (default: 3)
    retryDelay: 1000,        // Base delay in ms (default: 1000)
    retryableStatuses: [     // HTTP status codes to retry
      500, 502, 503, 504
    ],
    onRetry: (attempt, error, delayMs) => {
      console.log(`Retry attempt ${attempt} after ${delayMs}ms`);
      console.log(`Error: ${error.message}`);
    }
  }
});
```

### Exponential Backoff

Retry delays increase with each attempt:

```
Attempt 1: 1000ms  (1s)
Attempt 2: 2000ms  (2s)
Attempt 3: 3000ms  (3s)
```

Formula: `delay = attempt × retryDelay`

### Per-Request Override

Override retry config for specific requests:

```typescript
// Disable retry for this request
await sdk.assets.list({}, {
  retry: {
    enabled: false
  }
});

// Increase retries for critical request
await sdk.contracts.create(params, {
  retry: {
    enabled: true,
    maxRetries: 5,
    retryDelay: 2000
  }
});
```

### Chunk Upload Retry

File chunks are automatically retried with exponential backoff:

```typescript
// Automatic retry in uploadChunk()
const eTag = await uploadChunk({
  url: presignedUrl,
  data: chunkBuffer
});

// Retries: 3 attempts
// Delays: 1s, 2s, 4s (exponential)
```

## Type Guards

Utility functions to check error types.

### isUraniumError()

Check if error is an SDK error:

```typescript
import { isUraniumError } from "@uranium/sdk";

try {
  await sdk.assets.list();
} catch (error) {
  if (isUraniumError(error)) {
    // TypeScript knows this is UraniumError
    console.error("SDK error:", error.code);
    console.error("Context:", error.context);
  } else {
    // Some other error (network, JavaScript, etc.)
    console.error("Unknown error:", error);
  }
}
```

### isRetryableError()

Check if error should be retried:

```typescript
import { isRetryableError } from "@uranium/sdk";

try {
  await sdk.contracts.create({ ... });
} catch (error) {
  if (isRetryableError(error)) {
    console.log("This error can be retried");
    // Implement manual retry logic
    await retryWithBackoff(() => sdk.contracts.create({ ... }));
  } else {
    console.log("This error should not be retried");
    // Show error to user
  }
}
```

### Instance Checks

```typescript
import {
  ValidationError,
  UploadError,
  AuthenticationError,
  NetworkError
} from "@uranium/sdk";

try {
  await sdk.upload.upload(file, options);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation failed");
  } else if (error instanceof UploadError) {
    console.log("Upload failed");
  } else if (error instanceof AuthenticationError) {
    console.log("Authentication failed");
  } else if (error instanceof NetworkError) {
    console.log("Network error");
  }
}
```

## Error Handling Patterns

### Basic Try-Catch

```typescript
try {
  const collections = await sdk.contracts.list();
  console.log("Collections:", collections);
} catch (error) {
  console.error("Failed to fetch collections:", error);
}
```

### Specific Error Handling

```typescript
import { AuthenticationError, NetworkError } from "@uranium/sdk";

try {
  const user = await sdk.account.getMe("device-id");
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Redirect to login
    window.location.href = "/login";
  } else if (error instanceof NetworkError && error.retryable) {
    // Retry automatically
    console.log("Retrying...");
  } else {
    // Generic error
    console.error("Error:", error);
  }
}
```

### Error Code Switch

```typescript
try {
  await sdk.contracts.create({ ... });
} catch (error) {
  if (isUraniumError(error)) {
    switch (error.code) {
      case "AUTH_INVALID":
        console.error("Invalid API key");
        break;
      case "VALIDATION_ERROR":
        console.error("Invalid input:", error.context);
        break;
      case "QUOTA_EXCEEDED":
        console.error("Collection limit reached");
        break;
      default:
        console.error("Unknown error:", error.message);
    }
  }
}
```

### Async Error Boundary

```typescript
async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("Error caught:", error);
    return fallback;
  }
}

// Usage
const collections = await safeExecute(
  () => sdk.contracts.list(),
  [] // Fallback to empty array
);
```

### Retry Helper

```typescript
async function retryOperation<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error("Max retries exceeded");
}

// Usage
const asset = await retryOperation(
  () => sdk.upload.upload(file, options),
  3,
  2000
);
```

## React Error Handling

### Error Helper Functions

```typescript
import { getErrorMessage, isErrorRetryable } from "@uranium/react";

function MyComponent() {
  const [error, setError] = useState<Error | null>(null);

  const handleUpload = async () => {
    try {
      await sdk.upload.upload(file, options);
    } catch (err) {
      setError(err as Error);

      // Get user-friendly message
      const message = getErrorMessage(err);
      console.error(message);

      // Check if retryable
      if (isErrorRetryable(err)) {
        console.log("Can retry this error");
      }
    }
  };

  return (
    <div>
      {error && (
        <div className="error">
          {getErrorMessage(error)}
        </div>
      )}
    </div>
  );
}
```

### Error States in Hooks

```typescript
import { useUploadAsset } from "@uranium/react";

function UploadComponent() {
  const { uploadAsset, isError, error } = useUploadAsset();

  if (isError && error) {
    return (
      <div className="error">
        <h3>Upload Failed</h3>
        <p>{error.message}</p>
        <button onClick={() => uploadAsset(/* retry */)}>
          Retry
        </button>
      </div>
    );
  }

  return <div>Upload form...</div>;
}
```

### Error Boundary Component

```typescript
import { Component, ReactNode } from "react";
import { isUraniumError } from "@uranium/sdk";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SDKErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (isUraniumError(error)) {
      console.error("SDK Error:", error.code, error.message);
    } else {
      console.error("Unknown Error:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Toast Notifications

```typescript
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@uranium/react";

function UploadComponent() {
  const handleUpload = async () => {
    try {
      await sdk.upload.upload(file, options);
      toast.success("Upload successful!");
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    }
  };

  return <button onClick={handleUpload}>Upload</button>;
}
```

## Best Practices

### 1. Always Use Type Guards

```typescript
// ✅ Good - Type-safe error handling
if (error instanceof ValidationError) {
  console.error("Validation failed:", error.context);
}

// ❌ Bad - No type safety
if (error.code === "VALIDATION_ERROR") {
  console.error(error);  // error might not have .code
}
```

### 2. Provide Context for Users

```typescript
// ✅ Good - User-friendly message
try {
  await sdk.upload.upload(file, options);
} catch (error) {
  if (error instanceof UploadError && error.code === "FILE_TOO_LARGE") {
    showError("File is too large. Maximum size is 100 MB.");
  }
}

// ❌ Bad - Technical message
catch (error) {
  showError(error.message);  // "FILE_TOO_LARGE" - confusing for users
}
```

### 3. Enable Retry for Production

```typescript
// ✅ Good - Automatic retry enabled
const sdk = new UraniumSDK({
  apiKey: "your-api-key",
  retry: { enabled: true, maxRetries: 3 }
});

// ❌ Bad - No retry, users see transient failures
const sdk = new UraniumSDK({
  apiKey: "your-api-key"
  // retry defaults to disabled
});
```

### 4. Log Errors with Context

```typescript
// ✅ Good - Include all context
try {
  await sdk.contracts.create(params);
} catch (error) {
  console.error("Failed to create collection:", {
    error,
    params,
    timestamp: new Date().toISOString(),
    userId: currentUser.id
  });
}

// ❌ Bad - No context
catch (error) {
  console.error(error);
}
```

### 5. Handle Rate Limits Gracefully

```typescript
// ✅ Good - Wait and retry
try {
  await sdk.contracts.create(params);
} catch (error) {
  if (error instanceof LimitExceededError) {
    const waitMs = error.resetAt
      ? error.resetAt.getTime() - Date.now()
      : 60000;
    await new Promise(resolve => setTimeout(resolve, waitMs));
    await sdk.contracts.create(params);  // Retry
  }
}

// ❌ Bad - Fail immediately
catch (error) {
  throw error;
}
```

### 6. Use React Query Error Handling

```typescript
// ✅ Good - Centralized error handling
const { data, error } = useQuery({
  queryKey: ["assets"],
  queryFn: () => sdk.assets.list(),
  retry: (failureCount, error) => {
    return isRetryableError(error) && failureCount < 3;
  },
  onError: (error) => {
    toast.error(getErrorMessage(error));
  }
});

// ❌ Bad - Manual error handling everywhere
const [data, setData] = useState();
const [error, setError] = useState();
useEffect(() => {
  sdk.assets.list()
    .then(setData)
    .catch(setError);
}, []);
```

### 7. Test Error Scenarios

```typescript
// ✅ Good - Test all error paths
describe("Upload", () => {
  it("should handle file too large", async () => {
    const largeFile = new File([new Array(101 * 1024 * 1024)], "large.png");

    await expect(
      sdk.upload.upload(largeFile, options)
    ).rejects.toThrow(UploadError);
  });

  it("should handle invalid API key", async () => {
    const invalidSdk = new UraniumSDK({ apiKey: "invalid" });

    await expect(
      invalidSdk.account.getMe("device-id")
    ).rejects.toThrow(AuthenticationError);
  });
});
```

## Related Documentation

- [Upload Guide](./upload-guide.md)
- [API Reference](./api-reference.md)
- [Architecture Overview](./architecture.md)
