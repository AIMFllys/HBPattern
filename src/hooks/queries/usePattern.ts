import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetcher'
import type { PatternDetail } from '@/types/pattern'

export function usePattern(id: string | undefined) {
  return useQuery<PatternDetail>({
    queryKey: ['pattern', id],
    queryFn: () => apiFetch<PatternDetail>(`/api/patterns/${id}`),
    enabled: !!id,
  })
}
