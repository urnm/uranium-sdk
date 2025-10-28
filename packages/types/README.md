# @uranium/types

Shared TypeScript types and error classes for the Uranium SDK ecosystem.

## Installation

```bash
bun add @uranium/types
```

## Purpose

This package provides shared TypeScript type definitions and error classes used across all Uranium SDK packages (`@uranium/sdk` and `@uranium/react`). It ensures type consistency and provides a unified error handling system.

## Exports

### Error Classes

Custom error classes with additional context for better error handling:

```typescript
import {
  UraniumError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  NotFoundError,
  UploadError,
} from "@uranium/types";
```

### Type Guards

Utility functions for error type checking:

```typescript
import {
  isUraniumError,
  isRetryableError,
} from "@uranium/types";
```

## Error Hierarchy

```
Error (native)
└── UraniumError
    ├── AuthenticationError (401 errors)
    ├── ValidationError (400 errors, field validation)
    ├── NetworkError (connection issues)
    ├── NotFoundError (404 errors)
    └── UploadError (upload failures)
```

### Error Properties

#### UraniumError (Base Class)

```typescript
class UraniumError extends Error {
  code: string;              // Error code for programmatic handling
  statusCode?: number;       // HTTP status code if applicable
  context?: Record<string, unknown>; // Additional context data
}
```

#### AuthenticationError

```typescript
class AuthenticationError extends UraniumError {
  // Inherits all UraniumError properties
  // Default statusCode: 401
  // Default code: "AUTH_ERROR"
}
```

#### ValidationError

```typescript
class ValidationError extends UraniumError {
  fields?: Record<string, string[]>; // Fields that failed validation
  // Default statusCode: 400
  // Default code: "VALIDATION_ERROR"
}
```

#### NetworkError

```typescript
class NetworkError extends UraniumError {
  isRetryable: boolean;     // Whether the request can be retried
  originalError?: Error;    // Original error if available
  // Default code: "NETWORK_ERROR"
}
```

#### NotFoundError

```typescript
class NotFoundError extends UraniumError {
  resourceType?: string;    // Type of resource not found
  resourceId?: string;      // ID of the resource not found
  // Default statusCode: 404
  // Default code: "NOT_FOUND"
}
```

#### UploadError

```typescript
class UploadError extends UraniumError {
  retryAttempts?: number;   // Number of retry attempts made
  originalError?: Error;    // Original error if available
  // Default code: "UPLOAD_ERROR"
}
```

## Usage Examples

### Basic Error Handling

```typescript
import { UraniumError, isUraniumError } from "@uranium/types";

try {
  // Some SDK operation
  await sdk.account.getMe("device-id");
} catch (error) {
  if (isUraniumError(error)) {
    console.error(`Error ${error.code}: ${error.message}`);
    console.error("Status:", error.statusCode);
    console.error("Context:", error.context);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Specific Error Type Handling

```typescript
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  NetworkError,
} from "@uranium/types";

try {
  await sdk.contracts.create({ name: "Test", symbol: "TST", type: "ERC721" });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Authentication failed - check your API key");
  } else if (error instanceof ValidationError) {
    console.error("Validation errors:", error.fields);
  } else if (error instanceof NotFoundError) {
    console.error(`${error.resourceType} not found: ${error.resourceId}`);
  } else if (error instanceof NetworkError) {
    if (error.isRetryable) {
      console.error("Network error - retrying...");
    } else {
      console.error("Network error - cannot retry");
    }
  }
}
```

### Retryable Error Detection

```typescript
import { isRetryableError } from "@uranium/types";

try {
  await sdk.assets.list({ page: 1 });
} catch (error) {
  if (isRetryableError(error)) {
    console.log("Error is retryable - attempting retry...");
    // Implement retry logic
  } else {
    console.error("Error is not retryable:", error);
  }
}
```

### Creating Custom Errors

```typescript
import { UraniumError, ValidationError } from "@uranium/types";

// Custom UraniumError
throw new UraniumError(
  "Custom operation failed",
  "CUSTOM_ERROR",
  500,
  { operation: "customOp", userId: "123" }
);

// ValidationError with field details
throw new ValidationError(
  "Invalid input data",
  "VALIDATION_ERROR",
  {
    name: ["Name is required", "Name must be at least 3 characters"],
    symbol: ["Symbol is required"],
  },
  { attemptedAt: new Date().toISOString() }
);
```

### Error Reporting

```typescript
import { UraniumError, isUraniumError } from "@uranium/types";

function reportError(error: unknown) {
  if (isUraniumError(error)) {
    // Send to error tracking service
    sendToErrorTracker({
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack,
    });
  }
}
```

## Type Guard Usage

### isUraniumError

Checks if an error is an instance of UraniumError or any of its subclasses:

```typescript
import { isUraniumError } from "@uranium/types";

if (isUraniumError(error)) {
  // TypeScript now knows error has code, statusCode, context properties
  console.log(error.code);
}
```

### isRetryableError

Determines if an error can be safely retried:

```typescript
import { isRetryableError } from "@uranium/types";

if (isRetryableError(error)) {
  // Error has status 429 (rate limit), 408 (timeout), or 503 (unavailable)
  // OR error is NetworkError with isRetryable: true
  await retry();
}
```

## Notes

This package is primarily intended for internal use by other Uranium SDK packages. However, you can install it directly if you need:

- Type definitions for Uranium API entities
- Error classes for custom implementations
- Type guards for error handling

Most applications should use `@uranium/sdk` or `@uranium/react` instead, which include these types automatically.

## Build Information

- **Format**: ESM and CommonJS
- **TypeScript**: Full type declarations included
- **Target**: Node.js
- **Dependencies**: None (zero dependencies)

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Development mode with watch
bun run dev
```

## License

Apache 2.0

See [LICENSE](../../LICENSE) in the repository root for full license text.
