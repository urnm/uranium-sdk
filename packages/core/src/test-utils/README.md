# Test Utilities

This directory contains reusable test utilities to reduce code duplication across test files.

## Usage

Import the utilities at the top of your test file:

```typescript
import { createMockAxiosClient, createMockResponse, mockData } from "../test-utils/mocks";
```

## Available Utilities

### `createMockAxiosClient(config)`

Creates a mock AxiosInstance with configurable HTTP methods.

**Example:**
```typescript
const mockClient = createMockAxiosClient({
  post: () => Promise.resolve({ data: mockResponse }),
  get: () => Promise.resolve({ data: mockListResponse })
});
```

### `createMockResponse(status, data, errorCode?)`

Creates a mock API response with the standard structure used by the Uranium API.

**Example:**
```typescript
// Success response
const response = createMockResponse("ok", { userId: "123", name: "Test" });
// { status: "ok", ok: { userId: "123", name: "Test" }, data: { userId: "123", name: "Test" } }

// Error response
const errorResponse = createMockResponse("error", undefined, "USER_NOT_FOUND");
// { status: "error", errorCode: "USER_NOT_FOUND" }
```

### `createMockAxiosResponse(data, status?, statusText?)`

Creates a complete Axios response object.

**Example:**
```typescript
const axiosResponse = createMockAxiosResponse({ userId: "123" }, 200);
```

### `createMockError(status, message)`

Creates a basic AxiosError with a status code and message.

**Example:**
```typescript
const error = createMockError(401, "Unauthorized");
```

### `createMockAxiosError(status, errorCode, message, responseData?)`

Creates a detailed AxiosError with errorCode and response data.

**Example:**
```typescript
const error = createMockAxiosError(400, "INVALID_INPUT", "Invalid data provided");
const error = createMockAxiosError(401, "AUTH_REQUIRED", "Authentication required", { userId: null });
```

### `createNetworkError(message)`

Creates a network error (no response) to simulate connection failures.

**Example:**
```typescript
const error = createNetworkError("Network timeout");
```

### `mockData` Factory Functions

Provides factory functions for common test data:

#### `mockData.user(overrides?)`

Creates mock user data with sensible defaults.

**Example:**
```typescript
const user = mockData.user();
const customUser = mockData.user({ nickname: "CustomName", role: "ADMIN" });
```

#### `mockData.contract(overrides?)`

Creates mock contract data with sensible defaults.

**Example:**
```typescript
const contract = mockData.contract();
const customContract = mockData.contract({ name: "NewContract", type: "ERC1155" });
```

#### `mockData.asset(overrides?)`

Creates mock asset data with sensible defaults.

**Example:**
```typescript
const asset = mockData.asset();
const customAsset = mockData.asset({ title: "My Custom NFT" });
```

#### `mockData.pagination(overrides?)`

Creates mock pagination metadata.

**Example:**
```typescript
const meta = mockData.pagination();
const customMeta = mockData.pagination({ page: 2, pageSize: 20 });
```

## Before and After Examples

### Before (with duplication):

```typescript
test("should successfully get user information", async () => {
  const mockUserData = {
    userId: "user123",
    enablePushNotifications: true,
    role: "USER" as const,
    nickname: "TestUser",
    phoneNumber: "+1234567890",
    publicKey: "0xabc123",
    verificationId: "verify123",
  };

  const mockResponse: GetCurrentUserResponseDto = {
    status: "ok",
    ok: mockUserData,
  };

  const mockClient = {
    post: mock(() => Promise.resolve({ data: mockResponse })),
  } as unknown as AxiosInstance;

  const router = accountRouter(mockClient);
  const result = await router.getMe("device123");

  expect(result).toEqual(mockUserData);
});
```

### After (with utilities):

```typescript
test("should successfully get user information", async () => {
  const mockUserData = mockData.user();
  const mockResponse: GetCurrentUserResponseDto = createMockResponse("ok", mockUserData);

  const mockClient = createMockAxiosClient({
    post: () => Promise.resolve({ data: mockResponse }),
  });

  const router = accountRouter(mockClient);
  const result = await router.getMe("device123");

  expect(result).toEqual(mockUserData);
});
```

## Benefits

1. **Reduced Code Duplication**: Eliminate 15+ repeated mock patterns
2. **Consistency**: Ensure all tests use the same mock structure
3. **Maintainability**: Update mock logic in one place
4. **Type Safety**: Full TypeScript support with proper types
5. **Readability**: Tests are more concise and focused on what's being tested

## Files Updated

The following test files have been updated to use these utilities:

- `src/client/account.test.ts`
- `src/client/contracts.test.ts`
- `src/client/assets.test.ts`

Other test files can be gradually updated to use these utilities as needed.
