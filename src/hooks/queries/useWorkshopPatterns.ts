import { useDeferredValue } from 'react'
import { usePatterns } from '@/hooks/queries/usePatterns'
import { useWorkshopStore } from '@/stores/useWorkshopStore'

export function useWorkshopPatterns(limit = 30) {
  const searchQuery = useWorkshopStore(state => state.patternSearchQuery)
  const filterEra = useWorkshopStore(state => state.patternFilterEra)
  const deferredQuery = useDeferredValue(searchQuery)
  const trimmedQuery = deferredQuery.trim()

  return usePatterns({
    limit,
    sort: 'newest',
    q: trimmedQuery.length > 0 ? trimmedQuery : undefined,
    era: filterEra ?? undefined,
  })
}
