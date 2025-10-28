/**
 * Query key factories for @uranium/react
 *
 * Provides type-safe, hierarchical query keys for React Query cache management.
 * Based on the pattern from Raycast hooks implementation.
 *
 * @example
 * ```ts
 * // Get all account queries
 * queryClient.invalidateQueries({ queryKey: accountQueryKeys.all })
 *
 * // Get specific account detail
 * queryClient.invalidateQueries({ queryKey: accountQueryKeys.detail() })
 * ```
 */

/**
 * Query keys for account-related queries
 *
 * Hierarchy:
 * - all: ['account']
 * - detail: ['account', 'me']
 */
export const accountQueryKeys = {
  all: ["account"] as const,
  detail: () => [...accountQueryKeys.all, "me"] as const,
} as const

/**
 * Query keys for contracts (collections) queries
 *
 * Hierarchy:
 * - all: ['contracts']
 * - lists: ['contracts', 'list']
 * - list(filters): ['contracts', 'list', filters]
 */
export const contractsQueryKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractsQueryKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...contractsQueryKeys.lists(), filters] as const,
} as const

/**
 * Query keys for assets (NFTs) queries
 *
 * Hierarchy:
 * - all: ['assets']
 * - lists: ['assets', 'list']
 * - list(filters): ['assets', 'list', filters]
 * - detail: ['assets', 'detail']
 * - detail(id): ['assets', 'detail', id]
 */
export const assetsQueryKeys = {
  all: ["assets"] as const,
  lists: () => [...assetsQueryKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...assetsQueryKeys.lists(), filters] as const,
  details: () => [...assetsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...assetsQueryKeys.details(), id] as const,
} as const

/**
 * Type helper to extract query key type from factory
 *
 * @example
 * ```ts
 * type AccountKey = QueryKey<typeof accountQueryKeys.all>
 * // ['account']
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic type utility requires any for proper type inference across different function signatures
export type QueryKey<T> = T extends (...args: any[]) => infer R
  ? R
  : T extends readonly unknown[]
    ? T
    : never
