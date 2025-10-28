/**
 * @uranium/react - React hooks and components for Uranium SDK
 *
 * This package provides React hooks and components for integrating
 * the Uranium SDK into React applications using React Query.
 */

// Version
export const REACT_SDK_VERSION = "0.1.0"
export { REACT_SDK_VERSION as version }

export type {
  UploadAssetParams,
  UseAccountResult,
  UseAssetsParams,
  UseAssetsResult,
  UseContractsResult,
  UseCreateCollectionResult,
  UseUploadAssetResult,
} from "./hooks"
// Hooks
export * from "./hooks"
export type { UraniumProviderProps } from "./provider"
// Provider and Context
export { UraniumProvider, useUranium } from "./provider"
export type { QueryKey } from "./utils"
// Utilities
export * from "./utils"
