# Changelog

All notable changes to the Uranium SDK project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release of Uranium SDK
- **@uranium/sdk** - Core SDK package
  - Complete API client with account, contracts, and assets routers
  - File upload system with chunked multipart uploads
  - Progress tracking with 7-stage upload flow
  - Automatic validation using Zod schemas
  - Retry logic with configurable exponential backoff
  - Device ID management for analytics
  - Debug mode for development
  - 926 passing tests with comprehensive coverage

- **@uranium/react** - React hooks package
  - `useAccount()` hook for user information with derived state
  - `useContracts()` hook for collection listing
  - `useAssets()` hook with infinite scroll support
  - `useCreateCollection()` mutation hook
  - `useUploadAsset()` hook with progress tracking
  - React Query v5 integration
  - Automatic query invalidation
  - UraniumProvider context component

- **@uranium/types** - Shared types package
  - Base error classes (UraniumError, ValidationError, etc.)
  - Type guards for error handling
  - Shared TypeScript type definitions

### Features
- Type-safe API with full TypeScript support
- Cross-platform compatibility (Node.js and browsers)
- Dual module format (ESM and CJS)
- Comprehensive documentation
- Router-based architecture inspired by MCP servers
- Progressive enhancement (high-level and low-level APIs)

### Changed
- Improved type exports from @uranium/types to fix build issues
- Updated test suite (926 passing tests)

<!-- Version comparison links will be added when first version is released -->
