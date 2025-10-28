import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type UraniumConfig, UraniumSDK } from "@uranium/sdk"
import { createContext, type ReactNode, useContext, useMemo } from "react"

// Context for SDK instance
const UraniumContext = createContext<UraniumSDK | null>(null)

export interface UraniumProviderProps {
  /**
   * Configuration for Uranium SDK
   */
  config: UraniumConfig

  /**
   * Optional custom QueryClient instance
   * If not provided, a default one will be created
   */
  queryClient?: QueryClient

  /**
   * Children components
   */
  children: ReactNode
}

/**
 * Provider component for Uranium SDK
 * Wraps your app and provides SDK instance to all hooks
 *
 * @example
 * ```tsx
 * <UraniumProvider config={{ apiKey: "your-key" }}>
 *   <App />
 * </UraniumProvider>
 * ```
 */
export function UraniumProvider({
  config,
  queryClient,
  children,
}: UraniumProviderProps) {
  // Memoize SDK instance to prevent recreation on every render
  // Recreate if any config property changes
  const sdk = useMemo(() => new UraniumSDK(config), [config])

  // Create default QueryClient if not provided
  const defaultQueryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 3,
          },
        },
      }),
    [],
  )

  const client = queryClient || defaultQueryClient

  return (
    <UraniumContext.Provider value={sdk}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </UraniumContext.Provider>
  )
}

/**
 * Hook to access Uranium SDK instance
 * Must be used inside UraniumProvider
 *
 * @throws {Error} If used outside UraniumProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const sdk = useUranium();
 *   // Use sdk.account, sdk.contracts, sdk.assets
 * }
 * ```
 */
export function useUranium(): UraniumSDK {
  const context = useContext(UraniumContext)

  if (!context) {
    throw new Error("useUranium must be used within UraniumProvider")
  }

  return context
}
