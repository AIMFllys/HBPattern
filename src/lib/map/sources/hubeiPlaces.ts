import type { FeatureCollection, Geometry, Point } from 'geojson'
import { hubeiRegions } from '@/data/map/hubei'
import type { HubeiKeyPlace, HubeiRegion } from '@/types'

export interface HubeiPlaceFeatureProps {
  placeId: string
  regionId: string
  name: string
  category: HubeiKeyPlace['category']
  selected: boolean
}

/**
 * 构建关键地点 GeoJSON
 * 仅渲染选中区域 + 邻近区域的地点（避免一次塞 50 个点）
 */
export function buildHubeiPlacesGeoJSON(
  selectedRegion: HubeiRegion,
  zoom: number,
): FeatureCollection<Point, HubeiPlaceFeatureProps> {
  const visibleRegions = zoom >= 10 ? hubeiRegions : [selectedRegion]

  const features = visibleRegions.flatMap(region =>
    region.keyPlaces.map(place => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [place.point.lng, place.point.lat],
      },
      properties: {
        placeId: place.id,
        regionId: region.id,
        name: place.name,
        category: place.category,
        selected: region.id === selectedRegion.id && place.id === null,
      },
    })),
  )

  return { type: 'FeatureCollection', features } as FeatureCollection<Point, HubeiPlaceFeatureProps>
}

export type { FeatureCollection, Geometry }
