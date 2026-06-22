'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { Map as MaplibreMapInstance } from 'maplibre-gl'
import { adcodeToFeatureId } from '@/lib/map/sources/hubeiGeoJson'
import { findHubeiRegion } from '@/data/map/hubei'
import hubeiGeoData from '@/data/map/hubei-regions-geo.json'

interface Props {
  map: MaplibreMapInstance | null
  selectedRegionId: string
}

/**
 * 地市面图层：监听 selectedRegionId 变化，通过 feature-state 切换选中态
 * 避免每次选中都整张 setData 重灌，减少飞行中的画面抖动
 */
export function MapRegionsLayer({ map, selectedRegionId }: Props) {
  const prevRegionIdRef = useRef<string | null>(null)

  // regionId -> adcode 映射，用于 setFeatureState 定位要素
  const regionIdToAdcode = useMemo(() => {
    const result = new Map<string, number>()
    const features = (hubeiGeoData as { features: Array<{ properties?: { name?: string; adcode?: number; regionId?: string } }> }).features
    for (const feature of features) {
      const props = feature.properties
      if (!props?.name || props.adcode == null) continue
      result.set(props.name, props.adcode)
    }
    return result
  }, [])

  useEffect(() => {
    if (!map) return
    const prevId = prevRegionIdRef.current
    if (prevId === selectedRegionId) return

    const prevRegion = prevId ? findHubeiRegion(prevId) : null
    const newRegion = findHubeiRegion(selectedRegionId)

    // 清除旧选中
    if (prevRegion) {
      const adcode = regionIdToAdcode.get(prevRegion.name)
      if (adcode != null) {
        map.setFeatureState(
          { source: 'hubei-regions', id: adcodeToFeatureId(adcode) },
          { selected: false },
        )
      }
    }

    // 设置新选中
    if (newRegion) {
      const adcode = regionIdToAdcode.get(newRegion.name)
      if (adcode != null) {
        map.setFeatureState(
          { source: 'hubei-regions', id: adcodeToFeatureId(adcode) },
          { selected: true },
        )
      }
    }
    prevRegionIdRef.current = selectedRegionId
  }, [map, selectedRegionId, regionIdToAdcode])

  return null
}
