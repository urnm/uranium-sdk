import { useQuery } from "@tanstack/react-query"
import type { ContractEntity } from "@uranium/sdk"
import { useUranium } from "../provider"
import { contractsQueryKeys } from "../utils"
import { getErrorMessage } from "../utils/error-messages"

export interface UseContractsResult {
  contracts: ContractEntity[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Hook to fetch user's NFT collections (contracts)
 *
 * @example
 * ```tsx
 * function CollectionsList() {
 *   const { contracts, isLoading } = useContracts();
 *
 *   if (isLoading) return <div>Loading collections...</div>;
 *
 *   return (
 *     <ul>
 *       {contracts.map(c => <li key={c.id}>{c.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useContracts(): UseContractsResult {
  const sdk = useUranium()

  const query = useQuery({
    queryKey: contractsQueryKeys.list(),
    queryFn: async () => {
      try {
        return await sdk.contracts.list()
      } catch (error) {
        // Transform error to user-friendly message
        const message = getErrorMessage(error)
        throw new Error(message)
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    contracts: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
