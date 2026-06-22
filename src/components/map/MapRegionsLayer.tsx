'use client'

import { useEffect } from 'react'
import type { Map as MaplibreMapInstance, GeoJSONSource } from 'maplibre-gl'
import { buildHubeiRegionsGeoJSON } from '@/lib/map/sources/hubeiGeoJson'

interface Props {
  map: MaplibreMapInstance | null
  selectedRegionId: string
}

/**
 * 地市面图层：监听 selectedRegionId 变化，更新 hubei-regions source data
 * 选中态通过 feature.properties.selected 写入，驱动 fill-color / line-width 表达式
 */
export function MapRegionsLayer({ map, selectedRegionId }: Props) {
  useEffect(() => {
    if (!map) return
    const source = map.getSource('hubei-regions') as GeoJSONSource | undefined
    if (!source) return
    source.setData(buildHubeiRegionsGeoJSON(selectedRegionId))
  }, [map, selectedRegionId])

  return null
}
