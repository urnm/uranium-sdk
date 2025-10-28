/**
 * Test utilities for the Uranium SDK
 *
 * This module provides reusable mock factories and utilities to reduce
 * code duplication in test files.
 */

export type { MockAxiosClientConfig } from "./mocks"
export {
  createMockAxiosClient,
  createMockAxiosError,
  createMockAxiosResponse,
  createMockError,
  createMockResponse,
  createNetworkError,
  mockData,
} from "./mocks"
