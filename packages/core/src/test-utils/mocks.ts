/**
 * Test utilities for creating mock objects and reducing code duplication in tests
 */

import { mock } from "bun:test"
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"
import { AxiosError } from "axios"

/**
 * Configuration for creating a mock Axios client
 */
export interface MockAxiosClientConfig {
  get?: (...args: any[]) => Promise<any>
  post?: (...args: any[]) => Promise<any>
  put?: (...args: any[]) => Promise<any>
  patch?: (...args: any[]) => Promise<any>
  delete?: (...args: any[]) => Promise<any>
  request?: (...args: any[]) => Promise<any>
}

/**
 * Creates a mock AxiosInstance with configurable methods
 *
 * @example
 * ```typescript
 * const mockClient = createMockAxiosClient({
 *   post: () => Promise.resolve({ data: mockResponse }),
 *   get: () => Promise.resolve({ data: mockListResponse })
 * });
 * ```
 */
export function createMockAxiosClient(
  config: MockAxiosClientConfig = {},
): AxiosInstance {
  const mockInstance = {
    get: mock(config.get || (() => Promise.resolve({ data: {} }))),
    post: mock(config.post || (() => Promise.resolve({ data: {} }))),
    put: mock(config.put || (() => Promise.resolve({ data: {} }))),
    patch: mock(config.patch || (() => Promise.resolve({ data: {} }))),
    delete: mock(config.delete || (() => Promise.resolve({ data: {} }))),
    request: mock(config.request || (() => Promise.resolve({ data: {} }))),
    defaults: {
      baseURL: "",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
      },
    },
    interceptors: {
      request: {
        use: mock(() => {}),
        eject: mock(() => {}),
        clear: mock(() => {}),
      },
      response: {
        use: mock(() => {}),
        eject: mock(() => {}),
        clear: mock(() => {}),
      },
    },
  } as unknown as AxiosInstance

  return mockInstance
}

/**
 * Creates a mock API response with the standard structure
 *
 * @example
 * ```typescript
 * const response = createMockResponse("ok", { userId: "123", name: "Test" });
 * // { status: "ok", ok: { userId: "123", name: "Test" } }
 * ```
 */
export function createMockResponse<T>(
  status: "ok" | "error",
  data?: T,
  errorCode?: string,
): any {
  if (status === "ok") {
    return {
      status: "ok",
      ok: data,
      data: data,
    }
  }

  return {
    status: "error",
    errorCode: errorCode || "UNKNOWN_ERROR",
  }
}

/**
 * Creates a mock Axios response object
 *
 * @example
 * ```typescript
 * const axiosResponse = createMockAxiosResponse({ userId: "123" }, 200);
 * ```
 */
export function createMockAxiosResponse<T>(
  data: T,
  status: number = 200,
  statusText: string = "OK",
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText,
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  }
}

/**
 * Creates a basic AxiosError with a status code and message
 *
 * @example
 * ```typescript
 * const error = createMockError(401, "Unauthorized");
 * ```
 */
export function createMockError(
  status: number,
  message: string = "Error",
): AxiosError {
  const error = new AxiosError(message)
  error.response = {
    status,
    data: null,
    statusText: message,
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  }
  error.isAxiosError = true
  return error
}

/**
 * Creates a detailed AxiosError with errorCode and response data
 *
 * @example
 * ```typescript
 * const error = createMockAxiosError(400, "INVALID_INPUT", "Invalid data provided");
 * const error = createMockAxiosError(401, "AUTH_REQUIRED", "Authentication required", { userId: null });
 * ```
 */
export function createMockAxiosError(
  status: number,
  errorCode: string,
  message: string = "Error",
  responseData?: Record<string, any>,
): AxiosError {
  const error = new AxiosError(message)
  error.response = {
    status,
    data: {
      errorCode,
      message,
      ...responseData,
    },
    statusText: message,
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  }
  error.code = errorCode
  error.isAxiosError = true
  return error
}

/**
 * Creates a network error (no response)
 *
 * @example
 * ```typescript
 * const error = createNetworkError("Network timeout");
 * ```
 */
export function createNetworkError(
  message: string = "Network Error",
): AxiosError {
  const error = new AxiosError(message)
  error.isAxiosError = true
  // No response property - simulates network failure
  return error
}

/**
 * Creates a complete axios module mock with the create method
 * Use this for mocking the axios module globally in tests
 *
 * @example
 * ```typescript
 * import { createMockAxiosModule } from '../test-utils/mocks'
 * mock.module('axios', createMockAxiosModule)
 * ```
 */
export function createMockAxiosModule() {
  const createMockInstance = () => createMockAxiosClient()

  return {
    default: {
      create: mock(createMockInstance),
      get: mock(() => Promise.resolve({ data: {} })),
      post: mock(() => Promise.resolve({ data: {} })),
      put: mock(() => Promise.resolve({ data: {} })),
      patch: mock(() => Promise.resolve({ data: {} })),
      delete: mock(() => Promise.resolve({ data: {} })),
      request: mock(() => Promise.resolve({ data: {} })),
      isCancel: mock((error: any) => error?.code === "ERR_CANCELED"),
      CancelToken: {
        source: mock(() => ({
          token: {},
          cancel: mock(() => {}),
        })),
      },
    },
  }
}

/**
 * Common mock data factories for testing
 */
export const mockData = {
  /**
   * Creates mock user data
   */
  user: (overrides: Record<string, any> = {}) => ({
    userId: "user123",
    enablePushNotifications: true,
    role: "USER" as const,
    nickname: "TestUser",
    phoneNumber: "+1234567890",
    publicKey: "0xabc123",
    verificationId: "verify123",
    ...overrides,
  }),

  /**
   * Creates mock contract data
   */
  contract: (overrides: Record<string, any> = {}) => ({
    id: "contract1",
    userId: "user123",
    address: "0xabc123",
    name: "MyContract",
    symbol: "MYC",
    type: "ERC721" as const,
    status: "active" as const,
    ercType: "ERC721" as const,
    createdAt: { seconds: 1234567890, nanos: 0 },
    lastTokenId: 5,
    count: 5,
    ...overrides,
  }),

  /**
   * Creates mock asset data
   */
  asset: (overrides: Record<string, any> = {}) => ({
    id: "asset1",
    title: "My NFT",
    slug: "my-nft",
    contractId: "contract1",
    fileId: "file1",
    createdAt: { seconds: 1234567890, nanos: 0 },
    currentEditions: 1,
    lockedEditions: 0,
    isFinal: true,
    isUranium: true,
    inTransfer: false,
    isEncrypted: false,
    sourceMimeType: "image/png",
    collectionName: "MyCollection",
    status: "NFT_CONFIRMED" as const,
    statusIndex: 1,
    editions: 1,
    ercContractType: "ERC721" as const,
    appName: "Uranium",
    appVersion: "1.0",
    authorName: "Author",
    source: "upload" as const,
    sourceUrl: "https://example.com/source",
    mediaType: "image" as const,
    mediaSize: 1024,
    creatorAddress: "0xabc",
    creatorName: "Creator",
    currentOwnerAddress: "0xdef",
    isHasSecret: false,
    slugHash: "hash123",
    isListed: false,
    ...overrides,
  }),

  /**
   * Creates mock pagination metadata
   */
  pagination: (overrides: Record<string, any> = {}) => ({
    total: 1,
    page: 1,
    pageSize: 10,
    countPages: 1,
    ...overrides,
  }),
}
