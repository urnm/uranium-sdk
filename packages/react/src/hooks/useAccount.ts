import { useQuery } from "@tanstack/react-query"
import { DeviceManager, type UserEntity } from "@uranium/sdk"
import { useUranium } from "../provider"
import { accountQueryKeys } from "../utils"
import { getErrorMessage } from "../utils/error-messages"

// Constants from Uranium platform
const SMART_CONTRACTS_USER_LIMIT = 10
const SMART_CONTRACTS_ADMIN_LIMIT = 20

// Generate device ID once per application instance (persistent across sessions)
const DEVICE_ID = DeviceManager.getDeviceId()

export interface UseAccountResult {
  user: UserEntity | undefined
  isAdmin: boolean
  userId: string | undefined
  smartContractsLimit: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Hook to fetch current user account information
 * Uses React Query for caching and automatic refetching
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, isAdmin, smartContractsLimit, isLoading } = useAccount();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h1>{user?.nickname}</h1>
 *       <p>Limit: {smartContractsLimit} collections</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccount(): UseAccountResult {
  const sdk = useUranium()

  const query = useQuery({
    queryKey: accountQueryKeys.detail(),
    queryFn: async () => {
      try {
        return await sdk.account.getMe(DEVICE_ID)
      } catch (error) {
        // Transform error to user-friendly message
        const message = getErrorMessage(error)
        throw new Error(message)
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const user = query.data
  const isAdmin = user?.role === "ADMIN"
  const smartContractsLimit = isAdmin
    ? SMART_CONTRACTS_ADMIN_LIMIT
    : SMART_CONTRACTS_USER_LIMIT

  return {
    user,
    isAdmin,
    userId: user?.userId,
    smartContractsLimit,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
