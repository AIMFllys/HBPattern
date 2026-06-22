import type { FeatureCollection, Point } from 'geojson'
import type { DisplayBinding } from '@/components/map/mapDemoTypes'

export interface HubeiBindingFeatureProps {
  bindingId: string
  patternId: string
  patternSource: 'gallery' | 'demo'
  name: string
  color: string
  imageUrl: string | null
}

export function buildHubeiBindingsGeoJSON(
  displayBindings: DisplayBinding[],
): FeatureCollection<Point, HubeiBindingFeatureProps> {
  const features = displayBindings.map(item => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [item.place.point.lng, item.place.point.lat],
    },
    properties: {
      bindingId: item.binding.id,
      patternId: item.pattern.id,
      patternSource: item.binding.patternSource,
      name: item.pattern.name,
      color: item.pattern.colorPalette[0] ?? '#b84a39',
      imageUrl: item.pattern.imageUrl ?? null,
    },
  }))

  return { type: 'FeatureCollection', features } as FeatureCollection<Point, HubeiBindingFeatureProps>
}
