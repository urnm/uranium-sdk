import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ContractEntity, CreateUserContractRequestDto } from "@uranium/sdk"
import { useUranium } from "../provider"
import { contractsQueryKeys } from "../utils"
import { getErrorMessage } from "../utils/error-messages"

export interface UseCreateCollectionResult {
  createCollection: (
    params: CreateUserContractRequestDto,
  ) => Promise<ContractEntity>
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: Error | null
  data: ContractEntity | undefined
  reset: () => void
}

/**
 * Hook to create a new NFT collection (contract)
 * Automatically invalidates contracts query on success
 *
 * @example
 * ```tsx
 * function CreateCollectionForm() {
 *   const { createCollection, isLoading, error } = useCreateCollection();
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     try {
 *       const collection = await createCollection({
 *         name: "My NFT Collection",
 *         symbol: "MNFT",
 *         type: "ERC721"
 *       });
 *       console.log("Created:", collection);
 *     } catch (err) {
 *       console.error("Failed:", err);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div>Error: {error.message}</div>}
 *       <button type="submit" disabled={isLoading}>
 *         {isLoading ? "Creating..." : "Create Collection"}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useCreateCollection(): UseCreateCollectionResult {
  const sdk = useUranium()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (params: CreateUserContractRequestDto) => {
      try {
        return await sdk.contracts.create(params)
      } catch (error) {
        // Transform error to user-friendly message
        const message = getErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      // Invalidate contracts query to refetch the list
      queryClient.invalidateQueries({ queryKey: contractsQueryKeys.all })
    },
  })

  return {
    createCollection: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}
