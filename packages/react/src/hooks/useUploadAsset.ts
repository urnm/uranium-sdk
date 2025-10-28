import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { AssetEntity, UploadOptions, UploadProgress } from "@uranium/sdk"
import { useState } from "react"
import { useUranium } from "../provider"
import { assetsQueryKeys } from "../utils"
import { getErrorMessage } from "../utils/error-messages"

export interface UploadAssetParams {
  file: File | Buffer
  options: UploadOptions
}

export interface UseUploadAssetResult {
  uploadAsset: (params: UploadAssetParams) => Promise<AssetEntity>
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: Error | null
  data: AssetEntity | undefined
  progress: UploadProgress | null
  reset: () => void
}

/**
 * Hook to upload an asset (NFT) with progress tracking
 * Automatically invalidates assets query on success
 *
 * @example
 * ```tsx
 * function UploadAssetForm() {
 *   const { uploadAsset, isLoading, progress, error } = useUploadAsset();
 *
 *   const handleUpload = async (file: File) => {
 *     try {
 *       const asset = await uploadAsset({
 *         file,
 *         options: {
 *           contractId: "collection-id",
 *           metadata: {
 *             title: "My NFT",
 *             description: "Amazing artwork"
 *           },
 *           editions: 1
 *         }
 *       });
 *       console.log("Uploaded:", asset);
 *     } catch (err) {
 *       console.error("Failed:", err);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {progress && (
 *         <div>
 *           <p>Stage: {progress.stage}</p>
 *           <p>Progress: {progress.percent}%</p>
 *         </div>
 *       )}
 *       {error && <div>Error: {error.message}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUploadAsset(): UseUploadAssetResult {
  const sdk = useUranium()
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ file, options }: UploadAssetParams) => {
      try {
        // Merge onProgress callback with user's callback if provided
        const mergedOptions = {
          ...options,
          onProgress: (p: UploadProgress) => {
            setProgress(p)
            options.onProgress?.(p)
          },
        }

        return await sdk.upload.upload(file, mergedOptions)
      } catch (error) {
        // Transform error to user-friendly message
        const message = getErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      // Invalidate assets query to refetch the list
      queryClient.invalidateQueries({ queryKey: assetsQueryKeys.all })
      setProgress(null)
    },
    onError: () => {
      setProgress(null)
    },
  })

  return {
    uploadAsset: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    progress,
    reset: () => {
      mutation.reset()
      setProgress(null)
    },
  }
}
