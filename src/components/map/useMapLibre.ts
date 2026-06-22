'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as MaplibreMapInstance } from 'maplibre-gl'
import { HUBEI_MAP_INITIAL } from '@/lib/map/style/inkStyle'

/**
 * 暴露 MapLibre map instance 给父组件，提供相机控制 helper
 */
export function useMapLibre() {
  const mapRef = useRef<MaplibreMapInstance | null>(null)
  const [ready, setReady] = useState(false)

  const flyToRegion = useCallback((center: [number, number], zoom = 9) => {
    const map = mapRef.current
    if (!map) return
    const currentZoom = map.getZoom()
    map.flyTo({
      center,
      zoom,
      curve: Math.abs(zoom - currentZoom) > 2 ? 1.8 : 1.42,
      duration: 1200,
      essential: true,
    })
  }, [])

  const resetView = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.flyTo({
      center: HUBEI_MAP_INITIAL.center,
      zoom: HUBEI_MAP_INITIAL.zoom,
      bearing: 0,
      pitch: 0,
      duration: 1200,
      essential: true,
    })
  }, [])

  const zoomIn = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.zoomIn({ duration: 250 })
  }, [])

  const zoomOut = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.zoomOut({ duration: 250 })
  }, [])

  const getZoom = useCallback(() => mapRef.current?.getZoom() ?? HUBEI_MAP_INITIAL.zoom, [])

  useEffect(() => {
    return () => {
      mapRef.current = null
    }
  }, [])

  return {
    mapRef,
    ready,
    setReady,
    flyToRegion,
    resetView,
    zoomIn,
    zoomOut,
    getZoom,
  }
}
