# Contributing to Uranium SDK

Thank you for your interest in contributing to Uranium SDK! This document provides guidelines and information for developers who want to contribute to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Building the Project](#building-the-project)
- [Testing](#testing)
- [Bundle Size Management](#bundle-size-management)
- [Code Style](#code-style)
- [Architecture Overview](#architecture-overview)
- [Maintaining CHANGELOG](#maintaining-changelog)
- [Pull Request Process](#pull-request-process)
- [Key Conventions](#key-conventions)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** v1.3.1 or later ([Installation guide](https://bun.sh/docs/installation))
- **Node.js** v18+ (for compatibility checks)
- **TypeScript** 5.3+ (installed via Bun)
- **Git** for version control

### Installation Steps

1. **Clone the repository:**

```bash
git clone <repository-url>
cd uranium-sdk
```

2. **Install dependencies:**

```bash
bun install
```

This will install all dependencies for the monorepo and set up workspace links between packages.

3. **Build all packages:**

```bash
bun run build
```

This compiles TypeScript and generates both ESM and CJS bundles for all packages.

4. **Verify installation:**

```bash
# Run tests
bun test

# Check linting
bun run lint

# Check formatting
bun run format:check
```

If all commands succeed, you're ready to develop!

## Project Structure

The Uranium SDK is a monorepo using Bun workspaces. Here's the complete structure:

```
uranium-sdk/
├── packages/
│   ├── configs/                    # @uranium/configs
│   │   └── tsconfig.json          # Base TypeScript configuration
│   │
│   ├── types/                      # @uranium/types
│   │   ├── src/
│   │   │   ├── errors.ts          # Base error classes
│   │   │   └── index.ts           # Exports
│   │   ├── dist/                  # Build output
│   │   └── package.json           # Package manifest
│   │
│   ├── core/                       # @uranium/sdk
│   │   ├── src/
│   │   │   ├── client/            # API routers and HTTP client
│   │   │   │   ├── base.ts        # Axios client setup
│   │   │   │   ├── account.ts     # Account router
│   │   │   │   ├── contracts.ts   # Contracts router
│   │   │   │   ├── assets.ts      # Assets router
│   │   │   │   ├── device.ts      # Device ID management
│   │   │   │   ├── retry.ts       # Retry logic
│   │   │   │   └── utils.ts       # Utilities
│   │   │   ├── upload/            # Upload system
│   │   │   │   ├── chunk-uploader.ts    # Low-level chunk upload
│   │   │   │   ├── upload-manager.ts    # High-level manager
│   │   │   │   └── utils.ts             # Upload utilities
│   │   │   ├── validation/        # Validation layer
│   │   │   │   ├── schemas.ts     # Zod schemas
│   │   │   │   └── utils.ts       # Validation helpers
│   │   │   ├── types/             # Type definitions
│   │   │   │   ├── config.ts      # SDK configuration
│   │   │   │   ├── entities.ts    # API entities
│   │   │   │   ├── enums.ts       # Enumerations
│   │   │   │   ├── api-types.ts   # API request/response types
│   │   │   │   ├── metadata.ts    # NFT metadata utilities
│   │   │   │   ├── pagination.ts  # Pagination utilities
│   │   │   │   └── errors.ts      # SDK-specific errors
│   │   │   ├── test-utils/        # Testing utilities
│   │   │   │   ├── mocks.ts       # Mock factories
│   │   │   │   └── README.md      # Test utils documentation
│   │   │   └── index.ts           # Main SDK class
│   │   ├── dist/                  # Build output (ESM + CJS + .d.ts)
│   │   └── package.json
│   │
│   └── react/                      # @uranium/react
│       ├── src/
│       │   ├── provider.tsx       # React Context provider
│       │   ├── hooks/             # React Query hooks
│       │   │   ├── useAccount.ts
│       │   │   ├── useContracts.ts
│       │   │   ├── useAssets.ts
│       │   │   ├── useCreateCollection.ts
│       │   │   └── useUploadAsset.ts
│       │   ├── utils/             # Utilities
│       │   │   ├── query-keys.ts  # Query key factory
│       │   │   └── error-messages.ts # Error helpers
│       │   └── index.ts           # Exports
│       ├── dist/                  # Build output
│       └── package.json
│
├── turbo.json                      # Turbo pipeline configuration
├── package.json                    # Root workspace config
├── bun.lock                        # Lockfile
├── biome.json                      # Code quality config
├── README.md                       # Project README
├── CONTRIBUTING.md                 # This file
├── USAGE_EXAMPLES.md               # Usage documentation
├── PROGRESS.md                     # Development history
└── REVIEW_REPORT.md                # Quality metrics
```

### Package Purposes

1. **@uranium/configs** - Shared TypeScript configuration
   - Base `tsconfig.json` extended by all packages
   - Ensures consistent compiler settings

2. **@uranium/types** - Shared type definitions
   - Base error classes (`UraniumError`, `ValidationError`, etc.)
   - Type guards (`isUraniumError`, `isRetryableError`)
   - No dependencies (pure types)

3. **@uranium/sdk** - Core SDK
   - API client with routers (account, contracts, assets)
   - Upload system with progress tracking
   - Validation layer with Zod schemas
   - Retry logic with exponential backoff
   - Device ID management
   - Dependencies: `@uranium/types`, `axios`, `zod`

4. **@uranium/react** - React integration
   - React Context provider
   - React Query hooks
   - Query key factory
   - Error message helpers
   - Dependencies: `@uranium/sdk`, `@tanstack/react-query`
   - Peer dependencies: `react`, `react-dom`

### Dependency Graph

```
@uranium/configs
       ↑
       │ (build dependency)
       │
@uranium/types ←─────┐
       ↑             │
       │             │ (dependencies)
       │             │
@uranium/sdk ←───────┤
       ↑             │
       │             │
@uranium/react ──────┘
```

## Building the Project

### Build All Packages

```bash
# Build everything (recommended)
bun run build

# Clean and rebuild
bun run clean
bun run build
```

This uses Turbo to build packages in the correct order based on dependencies.

### Build Individual Packages

```bash
# Navigate to package
cd packages/core

# Build this package only
bun run build

# Build scripts breakdown:
# 1. clean - Remove old dist folder
# 2. build:types - Generate .d.ts files with tsc
# 3. build:js - Bundle ESM and CJS with Bun
```

### Build Output

Each package generates:
- **ESM bundle** - `dist/index.js` (ES modules)
- **CJS bundle** - `dist/index.cjs` (CommonJS)
- **Type declarations** - `dist/index.d.ts` + `dist/**/*.d.ts`
- **Source maps** - `dist/**/*.d.ts.map`

### Watch Mode for Development

```bash
# Watch mode for a specific package
cd packages/core
bun run dev

# Or use Turbo to watch all packages
bun run dev
```

## Testing

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

# Run specific test file
bun test packages/core/src/client/base.test.ts
```

### Test Coverage Requirements

We aim for high test coverage:
- **Overall target:** 95%+ line coverage
- **Current coverage:** 97.56% lines, 95.49% functions
- **Critical files:** 100% coverage required

**Coverage by package:**
- `@uranium/sdk`: 93.49% coverage (334 tests)
- `@uranium/react`: Full hook coverage (406 tests)

### Writing Tests

**Use test utilities to reduce boilerplate:**

```typescript
import { describe, test, expect } from "bun:test";
import {
  createMockAxiosClient,
  createMockResponse,
  mockData
} from "../test-utils/mocks";

describe("MyRouter", () => {
  test("should fetch data", async () => {
    // Create mock client
    const mockClient = createMockAxiosClient({
      get: () => Promise.resolve({
        data: createMockResponse("ok", mockData.user())
      })
    });

    // Test your code
    const result = await myFunction(mockClient);
    expect(result).toBeDefined();
  });
});
```

**Test structure conventions:**
- One test file per source file (e.g., `base.ts` → `base.test.ts`)
- Group related tests in `describe` blocks
- Use descriptive test names: `should <expected behavior> when <condition>`
- Test happy path, edge cases, and error scenarios

### Mock Data Factories

Available in `packages/core/src/test-utils/mocks.ts`:

```typescript
// User entity
const user = mockData.user({ role: "ADMIN" });

// Contract entity
const contract = mockData.contract({ ercType: "ERC721" });

// Asset entity
const asset = mockData.asset({ status: AssetSVCStatus.NFT_ALL_BLOCK_CONFIRMED });

// Paginated response
const response = mockData.paginatedResponse([asset1, asset2], 1, 10, 50);
```

## Bundle Size Management

Bundle size matters for both browser and Node.js environments. Smaller bundles mean faster load times and better performance.

### Automatic Updates

Bundle sizes are automatically tracked and updated after each build through a postbuild hook. The sizes are recorded in the main README.md file.

**Process:**

1. Run `bun run build` to compile all packages
2. The postbuild hook automatically updates bundle sizes in README.md
3. Check `git diff` to see the changes
4. If sizes changed, commit them along with your code changes

### Verification

After building, verify the changes:

```bash
# Build the project
bun run build

# Check what changed
git diff README.md

# Look for the "Bundle Sizes" section
```

### When to Commit

If your changes affect bundle sizes (adding features, dependencies, or optimizations):
- Always commit the updated README.md with bundle sizes
- Include size changes in your PR description
- Explain why sizes increased (if applicable)

Large size increases may require justification during code review.

## Code Style

### TypeScript Configuration

- **Strict mode enabled** - All strict TypeScript checks
- **No implicit any** - Explicit types required
- **Module resolution:** `bundler` (for Bun)
- **Target:** `ES2022`
- **JSX:** `react-jsx` (React package only)

### Linting and Formatting

We use [Biome](https://biomejs.dev/) for both linting and formatting:

```bash
# Check code style
bun run lint

# Auto-fix issues
bun run lint:fix

# Format code
bun run format

# Check formatting without writing
bun run format:check
```

**Configuration:** See `biome.json` in the root directory.

### Code Style Rules

1. **Use arrow functions for exports:**
   ```typescript
   // ✅ Good
   export const myFunction = (param: string): string => {
     return param.toUpperCase();
   };

   // ❌ Avoid
   export function myFunction(param: string): string {
     return param.toUpperCase();
   }
   ```

2. **Explicit return types:**
   ```typescript
   // ✅ Good
   export const fetchUser = async (id: string): Promise<UserEntity> => {
     // ...
   };

   // ❌ Avoid (implicit return type)
   export const fetchUser = async (id: string) => {
     // ...
   };
   ```

3. **Use custom error classes:**
   ```typescript
   // ✅ Good
   throw new ValidationError("Invalid parameter", "VALIDATION_ERROR");

   // ❌ Avoid generic errors
   throw new Error("Invalid parameter");
   ```

4. **Always validate inputs:**
   ```typescript
   // ✅ Good
   export const create = async (params: CreateParams) => {
     validateSchema(createSchema, params, "Invalid parameters");
     // ... API call
   };

   // ❌ Avoid skipping validation
   export const create = async (params: CreateParams) => {
     // ... direct API call
   };
   ```

5. **Prefer `throw` over `Promise.reject`:**
   ```typescript
   // ✅ Good
   throw new NetworkError("Request failed");

   // ❌ Avoid
   return Promise.reject(new NetworkError("Request failed"));
   ```

## Architecture Overview

### Router Pattern

The SDK uses a router-based architecture inspired by the MCP server:

```typescript
// Each router handles a specific API domain
const accountRouter = (client: AxiosInstance) => ({
  getMe: async (deviceId: string) => { /* ... */ }
});

const contractsRouter = (client: AxiosInstance) => ({
  list: async () => { /* ... */ },
  create: async (params) => { /* ... */ }
});

// Routers are combined in the SDK class
class UraniumSDK {
  account = accountRouter(this.client);
  contracts = contractsRouter(this.client);
  assets = assetsRouter(this.client);
}
```

**Benefits:**
- Clear separation of concerns
- Easy to test individual routers
- Modular and extensible
- Type-safe with TypeScript

### Error Handling

**Error hierarchy:**
```
Error (built-in)
  └─ UraniumError (@uranium/types)
      ├─ AuthenticationError (401, 403)
      ├─ ValidationError (400, validation failures)
      ├─ NetworkError (network issues, timeouts)
      ├─ NotFoundError (404)
      └─ SDK-specific errors (@uranium/sdk)
          ├─ UploadError (upload failures)
          ├─ MintingError (minting failures)
          ├─ BlockchainError (blockchain issues)
          └─ LimitExceededError (rate limits)
```

**Error properties:**
```typescript
class UraniumError extends Error {
  name: string;           // Error class name
  message: string;        // Human-readable message
  code: string;           // Machine-readable code
  statusCode?: number;    // HTTP status code (if applicable)
  isRetryable: boolean;   // Whether error can be retried
  details?: unknown;      // Additional context
}
```

**Creating errors:**
```typescript
// Validation error with field details
throw new ValidationError(
  "Invalid parameters",
  "VALIDATION_ERROR",
  400,
  false,
  { fields: { name: ["Too short"] } }
);

// Network error with retry
throw new NetworkError(
  "Request timeout",
  "TIMEOUT_ERROR",
  true, // retryable
  undefined,
  { timeout: 20000 }
);
```

### Validation Approach

All API inputs are validated using Zod schemas before making requests:

```typescript
// 1. Define Zod schema
const createContractSchema = z.object({
  name: z.string().min(3).max(30).regex(/^[a-zA-Z0-9._\-\[\]]+$/),
  symbol: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  type: z.enum(["ERC721", "ERC1155"])
});

// 2. Validate in router
export const create = async (params: CreateContractParams) => {
  // Throws ValidationError if invalid
  validateSchema(createContractSchema, params, "Invalid contract parameters");

  // Proceed with API call
  const response = await client.post("/contracts/create", params);
  return response.data;
};
```

**Benefits:**
- Catch errors before API calls
- Provide detailed error messages
- Type-safe with TypeScript inference
- Consistent validation across SDK

### React Query Integration

React hooks use React Query for state management:

```typescript
// Query hook example
export const useContracts = () => {
  const sdk = useUranium();

  return useQuery({
    queryKey: contractQueryKeys.all(),
    queryFn: async () => {
      try {
        return await sdk.contracts.list();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error.message.includes("authentication")) return false;
      return failureCount < 3;
    }
  });
};
```

**Key features:**
- Automatic caching with stale time
- Error transformation for user-friendly messages
- Smart retry logic (skip auth errors)
- Consistent query keys for invalidation

## Maintaining CHANGELOG

We follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format for tracking changes.

### Adding Changes

Always add your changes to the `[Unreleased]` section at the top of CHANGELOG.md:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Updated feature description

### Fixed
- Bug fix description
```

### Categories

Use these standard categories:

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features that will be removed soon
- **Removed** - Features that were removed
- **Fixed** - Bug fixes
- **Security** - Security-related changes

### During Release

When a new version is released, the maintainers will:
1. Move `[Unreleased]` changes to a new version section
2. Add version comparison links at the bottom of the file

**Example version links:**
```markdown
[1.1.0]: https://github.com/username/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/username/repo/releases/tag/v1.0.0
```

### Guidelines

- Write entries from the user's perspective
- Be concise but descriptive
- Include PR/issue numbers if relevant: `(#123)`
- Don't include internal refactoring unless it affects users
- Group related changes together

**Example:**

```markdown
## [Unreleased]

### Added
- Support for ERC1155 multi-token collections (#145)
- Progress tracking for asset uploads (#147)

### Changed
- Improved error messages for validation failures (#146)

### Fixed
- Device ID persistence in browser environments (#148)
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass:**
   ```bash
   bun test
   ```

2. **Check code quality:**
   ```bash
   bun run lint
   bun run format
   ```

3. **Build successfully:**
   ```bash
   bun run build
   ```

4. **Update documentation if needed:**
   - Update `USAGE_EXAMPLES.md` for new features
   - Add JSDoc comments to public APIs
   - Update README.md if API changes

### Commit Message Convention

Use clear, descriptive commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(core): add retry logic with exponential backoff

Implements configurable retry mechanism for failed requests.
Includes tests and documentation.

Closes #123
```

```
fix(react): correct useAccount deviceId persistence

DeviceId now uses DeviceManager for persistent storage
instead of generating new ID on each request.
```

### PR Checklist

- [ ] Code follows style guidelines (Biome passes)
- [ ] Tests added for new features
- [ ] All tests passing (512/512)
- [ ] Test coverage maintained (>95%)
- [ ] Documentation updated
- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] Backward compatibility preserved (or breaking changes documented)
- [ ] CHANGELOG.md updated in [Unreleased] section for user-facing changes
- [ ] Bundle sizes automatically updated (check git diff after build)

### Review Process

1. Submit PR with clear description
2. Ensure CI checks pass (if configured)
3. Address review feedback
4. Maintain test coverage
5. Squash commits if requested
6. Wait for approval from maintainers

## Key Conventions

### Arrow Functions for Exports

All exported functions use arrow syntax:

```typescript
// ✅ Correct
export const fetchData = async (id: string): Promise<Data> => {
  return await api.get(`/data/${id}`);
};

// ❌ Incorrect
export async function fetchData(id: string): Promise<Data> {
  return await api.get(`/data/${id}`);
}
```

### Error Types

Use specific error classes for different scenarios:

```typescript
// Authentication/authorization
throw new AuthenticationError("Invalid API key");

// Input validation
throw new ValidationError("Invalid parameters", "VALIDATION_ERROR", 400, false, {
  fields: { name: ["Required"] }
});

// Network issues
throw new NetworkError("Request failed", "NETWORK_ERROR", true);

// Resource not found
throw new NotFoundError("Collection not found");
```

### Query Keys (React)

Use the query key factory for consistency:

```typescript
// Define query keys
export const contractQueryKeys = {
  all: () => ["uranium", "contracts"] as const,
  detail: (id: string) => ["uranium", "contracts", id] as const
};

// Use in hooks
useQuery({
  queryKey: contractQueryKeys.all(),
  queryFn: () => sdk.contracts.list()
});

// Invalidate after mutations
queryClient.invalidateQueries({
  queryKey: contractQueryKeys.all()
});
```

### Validation Schemas

Define Zod schemas for all API inputs:

```typescript
// Schema definition
const mySchema = z.object({
  field: z.string().min(3).max(100)
});

// Validation in router
validateSchema(mySchema, input, "Invalid input");
```

### Device ID Management

Use `DeviceManager` for persistent device IDs:

```typescript
import { DeviceManager } from "./client/device";

// Get or create device ID (persists in localStorage)
const deviceId = DeviceManager.getDeviceId();

// Generate new ID (doesn't save)
const newId = DeviceManager.generateDeviceId();

// Clear saved ID
DeviceManager.clearDeviceId();
```

## Troubleshooting

### Build Issues

**Problem:** TypeScript compilation errors

```bash
# Clean and rebuild
bun run clean
rm -rf node_modules
bun install
bun run build
```

**Problem:** Declaration files not generated

```bash
# Check tsconfig.json
cat packages/core/tsconfig.json

# Ensure these settings exist:
# "declaration": true
# "declarationMap": true
# "composite": true
```

### Test Issues

**Problem:** Tests failing with import errors

```bash
# Ensure packages are built
bun run build

# Re-run tests
bun test
```

**Problem:** Flaky timing tests

Use behavior assertions instead of exact timings:

```typescript
// ❌ Flaky
expect(elapsed).toBe(1000); // Exact timing

// ✅ Stable
expect(elapsed).toBeGreaterThan(900); // Range
expect(attempts).toBe(3); // Behavior
```

### Dependency Issues

**Problem:** Workspace dependencies not resolving

```bash
# Clear all node_modules
rm -rf node_modules packages/*/node_modules

# Reinstall
bun install
```

**Problem:** Type errors with workspace packages

```bash
# Rebuild all packages
bun run build

# TypeScript will find .d.ts files in dist/
```

## Getting Help

- Check [existing documentation](./USAGE_EXAMPLES.md)
- Review [architecture decisions](./PROGRESS.md)
- Look at [test examples](./packages/core/src/test-utils/README.md)
- Open an issue for questions or bugs

## Resources

- **Bun Documentation:** https://bun.sh/docs
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Zod Documentation:** https://zod.dev
- **React Query Documentation:** https://tanstack.com/query/latest
- **Biome Documentation:** https://biomejs.dev

---

Thank you for contributing to Uranium SDK! Your efforts help make this project better for everyone.
