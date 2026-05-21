import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetcher'

interface ToggleLikeResult {
  liked: boolean
  likeCount: number
}

export function useToggleLike(patternId: string) {
  const queryClient = useQueryClient()

  return useMutation<ToggleLikeResult, Error>({
    mutationFn: () => apiFetch<ToggleLikeResult>(`/api/patterns/${patternId}/like`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pattern', patternId] })
    },
  })
}
