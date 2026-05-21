import { useQuery } from '@tanstack/react-query'
import { apiFetchPaginated } from '@/lib/api/fetcher'
import type { PatternListItem } from '@/types/pattern'
import type { PaginatedResponse } from '@/lib/api/response'

interface UsePatternsParams {
  page?: number
  limit?: number
  era?: string
  region?: string
  sort?: string
  q?: string
}

export function usePatterns(params: UsePatternsParams = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v != null) searchParams.set(k, String(v)) })

  return useQuery<PaginatedResponse<PatternListItem>>({
    queryKey: ['patterns', params],
    queryFn: () => apiFetchPaginated<PatternListItem>(`/api/patterns?${searchParams}`),
  })
}
