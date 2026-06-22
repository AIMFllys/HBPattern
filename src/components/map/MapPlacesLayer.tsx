'use client'

import { useEffect, useRef } from 'react'
import type { Map as MaplibreMapInstance, GeoJSONSource } from 'maplibre-gl'
import maplibregl from 'maplibre-gl'
import { buildHubeiPlacesGeoJSON } from '@/lib/map/sources/hubeiPlaces'
import type { HubeiRegion, HubeiKeyPlace } from '@/types'

interface Props {
  map: MaplibreMapInstance | null
  selectedRegion: HubeiRegion
  selectedPlace: HubeiKeyPlace | null
  onSelectPlace: (regionId: string, placeId: string) => void
}

type MapLayerMouseEvent = maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }

/**
 * 关键地点图层：监听 selectedRegion 变化，更新 hubei-places source data
 * 并处理点击事件
 */
export function MapPlacesLayer({ map, selectedRegion, selectedPlace, onSelectPlace }: Props) {
  const onSelectPlaceRef = useRef(onSelectPlace)

  useEffect(() => {
    onSelectPlaceRef.current = onSelectPlace
  }, [onSelectPlace])

  // 更新地点数据 + 选中态
  useEffect(() => {
    if (!map) return
    const source = map.getSource('hubei-places') as GeoJSONSource | undefined
    if (!source) return
    const zoom = map.getZoom()
    const geojson = buildHubeiPlacesGeoJSON(selectedRegion, zoom)
    const features = geojson.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        selected:
          feature.properties.regionId === selectedRegion.id &&
          feature.properties.placeId === selectedPlace?.id,
      },
    }))
    source.setData({ ...geojson, features })
  }, [map, selectedRegion, selectedPlace])

  // 点击事件
  useEffect(() => {
    if (!map) return
    const handler = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) return
      const regionId = feature.properties?.regionId as string | undefined
      const placeId = feature.properties?.placeId as string | undefined
      if (regionId && placeId) onSelectPlaceRef.current(regionId, placeId)
    }
    map.on('click', 'hubei-places-square', handler)
    map.on('click', 'hubei-places-label', handler)
    return () => {
      map.off('click', 'hubei-places-square', handler)
      map.off('click', 'hubei-places-label', handler)
    }
  }, [map])

  return null
}
