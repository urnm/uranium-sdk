/**
 * Pagination parameters for list requests
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number
  /** Number of items per page (default varies by endpoint, usually 20) */
  pageSize?: number
  /** Field to sort by (e.g., "createdAt", "title", "updatedAt") */
  sortBy?: string
  /** Sort order: ascending or descending */
  order?: "asc" | "desc"
}

/**
 * Pagination metadata returned in responses
 */
export interface PaginationMeta {
  /** Total number of items matching the query */
  total: number
  /** Current page number (1-based) */
  page: number
  /** Number of items per page */
  pageSize: number
  /** Total number of pages available */
  countPages: number
}

/**
 * Generic paginated response wrapper
 * @template T - The type of items in the data array
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[]
  /** Pagination metadata */
  meta: PaginationMeta | null
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: Required<PaginationParams> = {
  page: 1,
  pageSize: 20,
  sortBy: "createdAt",
  order: "desc",
}

/**
 * Maximum allowed page size
 */
export const MAX_PAGE_SIZE = 100

/**
 * Validates pagination parameters
 * @param params - Pagination parameters to validate
 * @throws Error if parameters are invalid
 */
export function validatePaginationParams(params: PaginationParams): void {
  if (params.page !== undefined) {
    if (!Number.isInteger(params.page) || params.page < 1) {
      throw new Error("Page must be a positive integer")
    }
  }

  if (params.pageSize !== undefined) {
    if (!Number.isInteger(params.pageSize) || params.pageSize < 1) {
      throw new Error("PageSize must be a positive integer")
    }
    if (params.pageSize > MAX_PAGE_SIZE) {
      throw new Error(`PageSize must not exceed ${MAX_PAGE_SIZE}`)
    }
  }

  if (params.order !== undefined) {
    if (params.order !== "asc" && params.order !== "desc") {
      throw new Error('Order must be either "asc" or "desc"')
    }
  }
}

/**
 * Normalizes pagination parameters with defaults
 * @param params - Partial pagination parameters
 * @returns Complete pagination parameters with defaults applied
 */
export function normalizePaginationParams(
  params?: PaginationParams,
): Required<PaginationParams> {
  return {
    page: params?.page ?? DEFAULT_PAGINATION.page,
    pageSize: Math.min(
      params?.pageSize ?? DEFAULT_PAGINATION.pageSize,
      MAX_PAGE_SIZE,
    ),
    sortBy: params?.sortBy ?? DEFAULT_PAGINATION.sortBy,
    order: params?.order ?? DEFAULT_PAGINATION.order,
  }
}

/**
 * Calculates pagination metadata from total count and parameters
 * @param total - Total number of items
 * @param params - Pagination parameters used
 * @returns Pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  params: Required<PaginationParams>,
): PaginationMeta {
  const countPages = Math.ceil(total / params.pageSize)

  return {
    total,
    page: params.page,
    pageSize: params.pageSize,
    countPages: Math.max(countPages, 0),
  }
}

/**
 * Checks if there are more pages available
 * @param meta - Pagination metadata
 * @returns True if there are more pages after the current one
 */
export function hasNextPage(meta: PaginationMeta): boolean {
  return meta.page < meta.countPages
}

/**
 * Checks if there is a previous page
 * @param meta - Pagination metadata
 * @returns True if there is a previous page
 */
export function hasPreviousPage(meta: PaginationMeta): boolean {
  return meta.page > 1
}

/**
 * Gets the page number for the next page
 * @param meta - Pagination metadata
 * @returns Next page number, or null if on last page
 */
export function getNextPage(meta: PaginationMeta): number | null {
  return hasNextPage(meta) ? meta.page + 1 : null
}

/**
 * Gets the page number for the previous page
 * @param meta - Pagination metadata
 * @returns Previous page number, or null if on first page
 */
export function getPreviousPage(meta: PaginationMeta): number | null {
  return hasPreviousPage(meta) ? meta.page - 1 : null
}

/**
 * Calculates the range of items shown on current page
 * @param meta - Pagination metadata
 * @returns Object with start and end indices (1-based)
 */
export function getPageRange(meta: PaginationMeta): {
  start: number
  end: number
} {
  if (meta.total === 0) {
    return { start: 0, end: 0 }
  }

  const start = (meta.page - 1) * meta.pageSize + 1
  const end = Math.min(meta.page * meta.pageSize, meta.total)

  return { start, end }
}

/**
 * Creates an empty paginated response
 * @template T - The type of items
 * @returns Empty paginated response
 */
export function createEmptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    data: [],
    meta: {
      total: 0,
      page: 1,
      pageSize: DEFAULT_PAGINATION.pageSize,
      countPages: 0,
    },
  }
}

/**
 * Cursor-based pagination parameters (for future use)
 * Alternative to offset-based pagination for better performance on large datasets
 */
export interface CursorPaginationParams {
  /** Cursor for the next page */
  cursor?: string
  /** Number of items to fetch */
  limit?: number
  /** Sort order */
  order?: "asc" | "desc"
}

/**
 * Cursor-based pagination metadata (for future use)
 */
export interface CursorPaginationMeta {
  /** Cursor for the next page */
  nextCursor?: string | null
  /** Cursor for the previous page */
  previousCursor?: string | null
  /** Whether there are more items */
  hasMore: boolean
}

/**
 * Generic cursor-based paginated response (for future use)
 * @template T - The type of items in the data array
 */
export interface CursorPaginatedResponse<T> {
  /** Array of items */
  data: T[]
  /** Cursor pagination metadata */
  meta: CursorPaginationMeta
}
