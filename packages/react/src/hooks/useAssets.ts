import { useInfiniteQuery } from "@tanstack/react-query"
import type {
  AssetEntity,
  FindUserAssetsRequestDto,
  PaginatedResponse,
} from "@uranium/sdk"
import { useUranium } from "../provider"
import { assetsQueryKeys } from "../utils"
import { getErrorMessage } from "../utils/error-messages"

export interface UseAssetsParams {
  contractId?: string
  pageSize?: number
  sortBy?: "createdAt" | "title" | "status"
  order?: "asc" | "desc"
  quickFilter?: string
  enabled?: boolean
}

export interface UseAssetsResult {
  assets: AssetEntity[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  refetch: () => void
}

/**
 * Hook to fetch assets with infinite scroll pagination
 *
 * @example
 * ```tsx
 * function AssetsList({ contractId }: { contractId: string }) {
 *   const { assets, hasNextPage, fetchNextPage, isLoading } = useAssets({
 *     contractId,
 *     pageSize: 20
 *   });
 *
 *   return (
 *     <>
 *       {assets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
 *       {hasNextPage && <button onClick={fetchNextPage}>Load More</button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useAssets(params: UseAssetsParams = {}): UseAssetsResult {
  const {
    contractId,
    pageSize = 20,
    sortBy = "createdAt",
    order = "desc",
    quickFilter,
    enabled = true,
  } = params

  const sdk = useUranium()

  const query = useInfiniteQuery({
    queryKey: assetsQueryKeys.list({
      contractId,
      pageSize,
      sortBy,
      order,
      quickFilter,
    }),
    queryFn: async ({
      pageParam = 1,
    }): Promise<PaginatedResponse<AssetEntity>> => {
      try {
        const requestParams: FindUserAssetsRequestDto = {
          contractId,
          page: pageParam,
          pageSize,
          sortBy,
          order,
          quickFilter,
        }

        return await sdk.assets.list(requestParams)
      } catch (error) {
        // Transform error to user-friendly message
        const message = getErrorMessage(error)
        throw new Error(message)
      }
    },
    getNextPageParam: (lastPage: PaginatedResponse<AssetEntity>) => {
      const { page, countPages } = lastPage.meta || { page: 1, countPages: 1 }
      return page < countPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Flatten all pages into a single array
  const assets = query.data?.pages.flatMap((page) => page.data) || []

  return {
    assets,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage || false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  }
}
