'use client'

import { useEffect, useRef } from 'react'
import type { Map as MaplibreMapInstance, GeoJSONSource } from 'maplibre-gl'
import maplibregl from 'maplibre-gl'
import { buildHubeiBindingsGeoJSON } from '@/lib/map/sources/hubeiBindings'
import type { DisplayBinding } from './mapDemoTypes'

interface Props {
  map: MaplibreMapInstance | null
  displayBindings: DisplayBinding[]
  onSelectPlace: (regionId: string, placeId: string) => void
}

type MapLayerMouseEvent = maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }

/**
 * 纹样绑定点图层：监听 displayBindings 变化，更新 hubei-bindings source data
 */
export function MapBindingsLayer({ map, displayBindings, onSelectPlace }: Props) {
  const onSelectPlaceRef = useRef(onSelectPlace)

  useEffect(() => {
    onSelectPlaceRef.current = onSelectPlace
  }, [onSelectPlace])

  useEffect(() => {
    if (!map) return
    const source = map.getSource('hubei-bindings') as GeoJSONSource | undefined
    if (!source) return
    source.setData(buildHubeiBindingsGeoJSON(displayBindings))
  }, [map, displayBindings])

  useEffect(() => {
    if (!map) return
    const handler = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) return
      const bindingId = feature.properties?.bindingId as string | undefined
      if (!bindingId) return
      const binding = displayBindings.find(item => item.binding.id === bindingId)
      if (binding) {
        onSelectPlaceRef.current(binding.region.id, binding.place.id)
      }
    }
    map.on('click', 'hubei-bindings-circle', handler)
    return () => {
      map.off('click', 'hubei-bindings-circle', handler)
    }
  }, [map, displayBindings])

  // 鼠标指针变化
  useEffect(() => {
    if (!map) return
    const enter = () => { map.getCanvas().style.cursor = 'pointer' }
    const leave = () => { map.getCanvas().style.cursor = 'grab' }
    map.on('mouseenter', 'hubei-bindings-circle', enter)
    map.on('mouseleave', 'hubei-bindings-circle', leave)
    return () => {
      map.off('mouseenter', 'hubei-bindings-circle', enter)
      map.off('mouseleave', 'hubei-bindings-circle', leave)
    }
  }, [map])

  return null
}
