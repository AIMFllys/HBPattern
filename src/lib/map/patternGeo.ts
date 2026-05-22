import {
  findHubeiRegionByName,
  hubeiRegions,
  normalizeHubeiRegionName,
} from '@/data/map/hubei'
import type { DemoMapBinding, HubeiKeyPlace, MapPatternOption } from '@/types'

function scorePlace(place: HubeiKeyPlace, pattern: MapPatternOption) {
  const haystack = [
    pattern.name,
    pattern.description,
    pattern.techniqueName,
    pattern.era,
    ...place.patternKeywords,
    place.name,
  ].filter(Boolean).join(' ')

  return place.patternKeywords.reduce((score, keyword) => {
    return score + (haystack.includes(keyword) ? 2 : 0) + (pattern.name.includes(keyword) ? 3 : 0)
  }, place.category === 'workshop' ? 1 : 0)
}

export function resolvePatternRegion(pattern: MapPatternOption) {
  return (
    findHubeiRegionByName(pattern.regionName) ??
    hubeiRegions.find(region => {
      const regionName = normalizeHubeiRegionName(region.name)
      const text = `${pattern.name} ${pattern.description ?? ''} ${pattern.techniqueName ?? ''}`
      return text.includes(region.shortName) || text.includes(regionName)
    })
  )
}

export function resolvePatternPlace(pattern: MapPatternOption) {
  const region = resolvePatternRegion(pattern)
  if (!region) return null

  const place = [...region.keyPlaces].sort((a, b) => scorePlace(b, pattern) - scorePlace(a, pattern))[0]
  return place ? { region, place } : null
}

export function createGalleryMapBindings(patterns: MapPatternOption[]): DemoMapBinding[] {
  return patterns.flatMap(pattern => {
    if (pattern.source !== 'gallery') return []
    const resolved = resolvePatternPlace(pattern)
    if (!resolved) return []

    return {
      id: `gallery-${pattern.id}`,
      patternId: pattern.id,
      patternSource: 'gallery',
      regionId: resolved.region.id,
      placeId: resolved.place.id,
      note: '由画廊地区字段自动生成',
      createdAt: '',
    }
  })
}
