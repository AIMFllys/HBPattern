import type { Feature, FeatureCollection, Geometry } from 'geojson'
import hubeiGeoData from '@/data/map/hubei-regions-geo.json'
import { hubeiRegions } from '@/data/map/hubei'
import type { HubeiRegion } from '@/types'

export interface HubeiRegionFeatureProps {
  id: string
  name: string
  adcode: number
  selected: boolean
  regionId: string
}

/**
 * 将 DataV GeoJSON 转为带 regionId 的 FeatureCollection
 * 选中态由调用方通过 setData 更新
 */
export function buildHubeiRegionsGeoJSON(selectedRegionId: string): FeatureCollection<Geometry, HubeiRegionFeatureProps> {
  const nameToRegion = new Map<string, HubeiRegion>()
  for (const region of hubeiRegions) {
    nameToRegion.set(region.name, region)
  }

  const features = (hubeiGeoData as FeatureCollection).features.flatMap(feature => {
    const name = feature.properties?.name as string | undefined
    if (!name) return []
    const region = nameToRegion.get(name)
    if (!region) return []

    return [{
      ...feature,
      id: adcodeToFeatureId(feature.properties?.adcode as number),
      properties: {
        id: region.id,
        regionId: region.id,
        name,
        adcode: feature.properties?.adcode as number,
        selected: region.id === selectedRegionId,
      },
    }] as Feature<Geometry, HubeiRegionFeatureProps>[]
  })

  return { type: 'FeatureCollection', features }
}

export function adcodeToFeatureId(adcode: number): number {
  return adcode
}

export const hubeiGeoJSONSource = hubeiGeoData
