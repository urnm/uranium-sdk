import { describe, expect, test } from "bun:test"
import {
  calculatePaginationMeta,
  createEmptyPaginatedResponse,
  DEFAULT_PAGINATION,
  getNextPage,
  getPageRange,
  getPreviousPage,
  hasNextPage,
  hasPreviousPage,
  MAX_PAGE_SIZE,
  normalizePaginationParams,
  type PaginationMeta,
  type PaginationParams,
  validatePaginationParams,
} from "./pagination"

describe("Pagination Utilities", () => {
  describe("validatePaginationParams", () => {
    describe("page validation", () => {
      test("should pass validation with valid page number", () => {
        const params: PaginationParams = { page: 1 }
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should pass validation with large page number", () => {
        const params: PaginationParams = { page: 1000 }
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should pass validation when page is undefined", () => {
        const params: PaginationParams = {}
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should throw error when page is zero", () => {
        const params: PaginationParams = { page: 0 }
        expect(() => validatePaginationParams(params)).toThrow(
          "Page must be a positive integer",
        )
      })

      test("should throw error when page is negative", () => {
        const params: PaginationParams = { page: -1 }
        expect(() => validatePaginationParams(params)).toThrow(
          "Page must be a positive integer",
        )
      })

      test("should throw error when page is a decimal", () => {
        const params: PaginationParams = { page: 1.5 }
        expect(() => validatePaginationParams(params)).toThrow(
          "Page must be a positive integer",
        )
      })

      test("should throw error when page is not an integer", () => {
        const params: PaginationParams = { page: 2.9 }
        expect(() => validatePaginationParams(params)).toThrow(
          "Page must be a positive integer",
        )
      })
    })

    describe("pageSize validation", () => {
      test("should pass validation with valid pageSize", () => {
        const params: PaginationParams = { pageSize: 20 }
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should pass validation with pageSize of 1", () => {
        const params: PaginationParams = { pageSize: 1 }
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should pass validation with pageSize at maximum (100)", () => {
        const params: PaginationParams = { pageSize: MAX_PAGE_SIZE }
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should pass validation when pageSize is undefined", () => {
        const params: PaginationParams = {}
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should throw error when pageSize is zero", () => {
        const params: PaginationParams = { pageSize: 0 }
        expect(() => validatePaginationParams(params)).toThrow(
          "PageSize must be a positive integer",
        )
      })

      test("should throw error when pageSize is negative", () => {
        const params: PaginationParams = { pageSize: -5 }
        expect(() => validatePaginationParams(params)).toThrow(
          "PageSize must be a positive integer",
        )
      })

      test("should throw error when pageSize is a decimal", () => {
        const params: PaginationParams = { pageSize: 10.5 }
        expect(() => validatePaginationParams(params)).toThrow(
          "PageSize must be a positive integer",
        )
      })

      test("should throw error when pageSize exceeds maximum", () => {
        const params: PaginationParams = { pageSize: 101 }
        expect(() => validatePaginationParams(params)).toThrow(
          `PageSize must not exceed ${MAX_PAGE_SIZE}`,
        )
      })

      test("should throw error when pageSize is much larger than maximum", () => {
        const params: PaginationParams = { pageSize: 500 }
        expect(() => validatePaginationParams(params)).toThrow(
          `PageSize must not exceed ${MAX_PAGE_SIZE}`,
        )
      })
    })

    describe("order validation", () => {
      test("should pass validation with asc order", () => {
        const params: PaginationParams = { order: "asc" }
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should pass validation with desc order", () => {
        const params: PaginationParams = { order: "desc" }
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should pass validation when order is undefined", () => {
        const params: PaginationParams = {}
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should throw error when order is invalid", () => {
        // @ts-expect-error - testing invalid order
        const params: PaginationParams = { order: "invalid" }
        expect(() => validatePaginationParams(params)).toThrow(
          'Order must be either "asc" or "desc"',
        )
      })

      test("should throw error when order is uppercase ASC", () => {
        // @ts-expect-error - testing invalid order
        const params: PaginationParams = { order: "ASC" }
        expect(() => validatePaginationParams(params)).toThrow(
          'Order must be either "asc" or "desc"',
        )
      })

      test("should throw error when order is uppercase DESC", () => {
        // @ts-expect-error - testing invalid order
        const params: PaginationParams = { order: "DESC" }
        expect(() => validatePaginationParams(params)).toThrow(
          'Order must be either "asc" or "desc"',
        )
      })
    })

    describe("combined validation", () => {
      test("should pass validation with all valid parameters", () => {
        const params: PaginationParams = {
          page: 5,
          pageSize: 50,
          sortBy: "title",
          order: "asc",
        }
        expect(() => validatePaginationParams(params)).not.toThrow()
      })

      test("should throw error when multiple parameters are invalid", () => {
        const params: PaginationParams = { page: -1, pageSize: 200 }
        expect(() => validatePaginationParams(params)).toThrow()
      })
    })
  })

  describe("normalizePaginationParams", () => {
    describe("default values", () => {
      test("should apply all defaults when params is undefined", () => {
        const result = normalizePaginationParams()
        expect(result).toEqual(DEFAULT_PAGINATION)
      })

      test("should apply all defaults when params is empty object", () => {
        const result = normalizePaginationParams({})
        expect(result).toEqual(DEFAULT_PAGINATION)
      })

      test("should apply default page when not provided", () => {
        const result = normalizePaginationParams({ pageSize: 10 })
        expect(result.page).toBe(DEFAULT_PAGINATION.page)
      })

      test("should apply default pageSize when not provided", () => {
        const result = normalizePaginationParams({ page: 2 })
        expect(result.pageSize).toBe(DEFAULT_PAGINATION.pageSize)
      })

      test("should apply default sortBy when not provided", () => {
        const result = normalizePaginationParams({ page: 1 })
        expect(result.sortBy).toBe(DEFAULT_PAGINATION.sortBy)
      })

      test("should apply default order when not provided", () => {
        const result = normalizePaginationParams({ page: 1 })
        expect(result.order).toBe(DEFAULT_PAGINATION.order)
      })
    })

    describe("custom values", () => {
      test("should use provided page value", () => {
        const result = normalizePaginationParams({ page: 5 })
        expect(result.page).toBe(5)
      })

      test("should use provided pageSize value", () => {
        const result = normalizePaginationParams({ pageSize: 30 })
        expect(result.pageSize).toBe(30)
      })

      test("should use provided sortBy value", () => {
        const result = normalizePaginationParams({ sortBy: "title" })
        expect(result.sortBy).toBe("title")
      })

      test("should use provided order value", () => {
        const result = normalizePaginationParams({ order: "asc" })
        expect(result.order).toBe("asc")
      })

      test("should preserve all custom values", () => {
        const result = normalizePaginationParams({
          page: 3,
          pageSize: 50,
          sortBy: "updatedAt",
          order: "asc",
        })
        expect(result).toEqual({
          page: 3,
          pageSize: 50,
          sortBy: "updatedAt",
          order: "asc",
        })
      })
    })

    describe("pageSize capping", () => {
      test("should cap pageSize at MAX_PAGE_SIZE", () => {
        const result = normalizePaginationParams({ pageSize: 150 })
        expect(result.pageSize).toBe(MAX_PAGE_SIZE)
      })

      test("should cap pageSize at MAX_PAGE_SIZE for very large values", () => {
        const result = normalizePaginationParams({ pageSize: 1000 })
        expect(result.pageSize).toBe(MAX_PAGE_SIZE)
      })

      test("should not cap pageSize when at maximum", () => {
        const result = normalizePaginationParams({ pageSize: MAX_PAGE_SIZE })
        expect(result.pageSize).toBe(MAX_PAGE_SIZE)
      })

      test("should not cap pageSize when below maximum", () => {
        const result = normalizePaginationParams({ pageSize: 50 })
        expect(result.pageSize).toBe(50)
      })
    })
  })

  describe("calculatePaginationMeta", () => {
    describe("countPages calculation", () => {
      test("should calculate countPages correctly for exact division", () => {
        const params = {
          page: 1,
          pageSize: 20,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(100, params)
        expect(result.countPages).toBe(5)
      })

      test("should calculate countPages correctly with remainder", () => {
        const params = {
          page: 1,
          pageSize: 20,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(95, params)
        expect(result.countPages).toBe(5)
      })

      test("should calculate countPages as 1 when total is less than pageSize", () => {
        const params = {
          page: 1,
          pageSize: 20,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(15, params)
        expect(result.countPages).toBe(1)
      })

      test("should calculate countPages as 0 when total is zero", () => {
        const params = {
          page: 1,
          pageSize: 20,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(0, params)
        expect(result.countPages).toBe(0)
      })

      test("should calculate countPages correctly for pageSize of 1", () => {
        const params = {
          page: 1,
          pageSize: 1,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(50, params)
        expect(result.countPages).toBe(50)
      })

      test("should calculate countPages correctly for large total", () => {
        const params = {
          page: 1,
          pageSize: 100,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(10000, params)
        expect(result.countPages).toBe(100)
      })
    })

    describe("metadata properties", () => {
      test("should include total in metadata", () => {
        const params = {
          page: 2,
          pageSize: 20,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(100, params)
        expect(result.total).toBe(100)
      })

      test("should include page in metadata", () => {
        const params = {
          page: 3,
          pageSize: 20,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(100, params)
        expect(result.page).toBe(3)
      })

      test("should include pageSize in metadata", () => {
        const params = {
          page: 1,
          pageSize: 50,
          sortBy: "createdAt",
          order: "desc" as const,
        }
        const result = calculatePaginationMeta(100, params)
        expect(result.pageSize).toBe(50)
      })

      test("should return complete metadata object", () => {
        const params = {
          page: 2,
          pageSize: 25,
          sortBy: "title",
          order: "asc" as const,
        }
        const result = calculatePaginationMeta(75, params)
        expect(result).toEqual({
          total: 75,
          page: 2,
          pageSize: 25,
          countPages: 3,
        })
      })
    })
  })

  describe("hasNextPage", () => {
    test("should return true when on first page with multiple pages", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 1,
        pageSize: 20,
        countPages: 5,
      }
      expect(hasNextPage(meta)).toBe(true)
    })

    test("should return true when on middle page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 3,
        pageSize: 20,
        countPages: 5,
      }
      expect(hasNextPage(meta)).toBe(true)
    })

    test("should return false when on last page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 5,
        pageSize: 20,
        countPages: 5,
      }
      expect(hasNextPage(meta)).toBe(false)
    })

    test("should return false when on single page", () => {
      const meta: PaginationMeta = {
        total: 10,
        page: 1,
        pageSize: 20,
        countPages: 1,
      }
      expect(hasNextPage(meta)).toBe(false)
    })

    test("should return false when total is zero", () => {
      const meta: PaginationMeta = {
        total: 0,
        page: 1,
        pageSize: 20,
        countPages: 0,
      }
      expect(hasNextPage(meta)).toBe(false)
    })

    test("should return true when one page before last", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 4,
        pageSize: 20,
        countPages: 5,
      }
      expect(hasNextPage(meta)).toBe(true)
    })
  })

  describe("hasPreviousPage", () => {
    test("should return false when on first page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 1,
        pageSize: 20,
        countPages: 5,
      }
      expect(hasPreviousPage(meta)).toBe(false)
    })

    test("should return true when on second page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 2,
        pageSize: 20,
        countPages: 5,
      }
      expect(hasPreviousPage(meta)).toBe(true)
    })

    test("should return true when on middle page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 3,
        pageSize: 20,
        countPages: 5,
      }
      expect(hasPreviousPage(meta)).toBe(true)
    })

    test("should return true when on last page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 5,
        pageSize: 20,
        countPages: 5,
      }
      expect(hasPreviousPage(meta)).toBe(true)
    })

    test("should return false when on single page", () => {
      const meta: PaginationMeta = {
        total: 10,
        page: 1,
        pageSize: 20,
        countPages: 1,
      }
      expect(hasPreviousPage(meta)).toBe(false)
    })
  })

  describe("getNextPage", () => {
    test("should return next page number when not on last page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 3,
        pageSize: 20,
        countPages: 5,
      }
      expect(getNextPage(meta)).toBe(4)
    })

    test("should return null when on last page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 5,
        pageSize: 20,
        countPages: 5,
      }
      expect(getNextPage(meta)).toBe(null)
    })

    test("should return 2 when on first page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 1,
        pageSize: 20,
        countPages: 5,
      }
      expect(getNextPage(meta)).toBe(2)
    })

    test("should return null when on single page", () => {
      const meta: PaginationMeta = {
        total: 10,
        page: 1,
        pageSize: 20,
        countPages: 1,
      }
      expect(getNextPage(meta)).toBe(null)
    })

    test("should return null when total is zero", () => {
      const meta: PaginationMeta = {
        total: 0,
        page: 1,
        pageSize: 20,
        countPages: 0,
      }
      expect(getNextPage(meta)).toBe(null)
    })
  })

  describe("getPreviousPage", () => {
    test("should return null when on first page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 1,
        pageSize: 20,
        countPages: 5,
      }
      expect(getPreviousPage(meta)).toBe(null)
    })

    test("should return 1 when on second page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 2,
        pageSize: 20,
        countPages: 5,
      }
      expect(getPreviousPage(meta)).toBe(1)
    })

    test("should return previous page number when on middle page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 3,
        pageSize: 20,
        countPages: 5,
      }
      expect(getPreviousPage(meta)).toBe(2)
    })

    test("should return previous page number when on last page", () => {
      const meta: PaginationMeta = {
        total: 100,
        page: 5,
        pageSize: 20,
        countPages: 5,
      }
      expect(getPreviousPage(meta)).toBe(4)
    })

    test("should return null when on single page", () => {
      const meta: PaginationMeta = {
        total: 10,
        page: 1,
        pageSize: 20,
        countPages: 1,
      }
      expect(getPreviousPage(meta)).toBe(null)
    })
  })

  describe("getPageRange", () => {
    describe("normal ranges", () => {
      test("should return correct range for first page", () => {
        const meta: PaginationMeta = {
          total: 100,
          page: 1,
          pageSize: 20,
          countPages: 5,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 1, end: 20 })
      })

      test("should return correct range for middle page", () => {
        const meta: PaginationMeta = {
          total: 100,
          page: 3,
          pageSize: 20,
          countPages: 5,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 41, end: 60 })
      })

      test("should return correct range for last page with full page", () => {
        const meta: PaginationMeta = {
          total: 100,
          page: 5,
          pageSize: 20,
          countPages: 5,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 81, end: 100 })
      })

      test("should return correct range for last page with partial page", () => {
        const meta: PaginationMeta = {
          total: 95,
          page: 5,
          pageSize: 20,
          countPages: 5,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 81, end: 95 })
      })

      test("should return correct range for single page with less than pageSize items", () => {
        const meta: PaginationMeta = {
          total: 15,
          page: 1,
          pageSize: 20,
          countPages: 1,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 1, end: 15 })
      })

      test("should return correct range for single full page", () => {
        const meta: PaginationMeta = {
          total: 20,
          page: 1,
          pageSize: 20,
          countPages: 1,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 1, end: 20 })
      })
    })

    describe("edge cases", () => {
      test("should return 0, 0 when total is zero", () => {
        const meta: PaginationMeta = {
          total: 0,
          page: 1,
          pageSize: 20,
          countPages: 0,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 0, end: 0 })
      })

      test("should return correct range for pageSize of 1", () => {
        const meta: PaginationMeta = {
          total: 50,
          page: 25,
          pageSize: 1,
          countPages: 50,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 25, end: 25 })
      })

      test("should return correct range for first page with pageSize of 1", () => {
        const meta: PaginationMeta = {
          total: 50,
          page: 1,
          pageSize: 1,
          countPages: 50,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 1, end: 1 })
      })

      test("should return correct range for large page numbers", () => {
        const meta: PaginationMeta = {
          total: 10000,
          page: 100,
          pageSize: 100,
          countPages: 100,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 9901, end: 10000 })
      })

      test("should return correct range when on page beyond total", () => {
        // Edge case: page number exceeds actual data
        const meta: PaginationMeta = {
          total: 50,
          page: 10,
          pageSize: 20,
          countPages: 3,
        }
        const result = getPageRange(meta)
        expect(result).toEqual({ start: 181, end: 50 }) // start > end in this invalid scenario
      })
    })
  })

  describe("createEmptyPaginatedResponse", () => {
    test("should create empty response with empty data array", () => {
      const result = createEmptyPaginatedResponse()
      expect(result.data).toEqual([])
    })

    test("should create response with meta.total of 0", () => {
      const result = createEmptyPaginatedResponse()
      expect(result.meta?.total).toBe(0)
    })

    test("should create response with meta.page of 1", () => {
      const result = createEmptyPaginatedResponse()
      expect(result.meta?.page).toBe(1)
    })

    test("should create response with default pageSize", () => {
      const result = createEmptyPaginatedResponse()
      expect(result.meta?.pageSize).toBe(DEFAULT_PAGINATION.pageSize)
    })

    test("should create response with meta.countPages of 0", () => {
      const result = createEmptyPaginatedResponse()
      expect(result.meta?.countPages).toBe(0)
    })

    test("should create response with complete meta object", () => {
      const result = createEmptyPaginatedResponse()
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        pageSize: DEFAULT_PAGINATION.pageSize,
        countPages: 0,
      })
    })

    test("should create response with correct structure", () => {
      const result = createEmptyPaginatedResponse<string>()
      expect(result).toHaveProperty("data")
      expect(result).toHaveProperty("meta")
      expect(Array.isArray(result.data)).toBe(true)
    })

    test("should work with different type parameters", () => {
      interface TestItem {
        id: string
        name: string
      }
      const result = createEmptyPaginatedResponse<TestItem>()
      expect(result.data).toEqual([])
      expect(result.meta).toBeDefined()
    })
  })
})
