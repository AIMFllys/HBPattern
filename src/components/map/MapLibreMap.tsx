'use client'

import { useEffect, useRef } from 'react'
import maplibregl, { Map as MaplibreMapInstance, NavigationControl, GeoJSONSource } from 'maplibre-gl'
import { createInkStyle, HUBEI_MAP_INITIAL } from '@/lib/map/style/inkStyle'
import { buildHubeiRegionsGeoJSON } from '@/lib/map/sources/hubeiGeoJson'
import { neighborProvincesGeoJSON } from '@/lib/map/sources/neighborProvinces'
import { hubeiRiversGeoJSON } from '@/lib/map/sources/hubeiRivers'

type MapInstance = MaplibreMapInstance
type MapLayerMouseEvent = maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }

export interface MapLibreMapHandle {
  map: MapInstance | null
  ready: boolean
}

interface Props {
  mapRef: React.MutableRefObject<MapInstance | null>
  selectedRegionId: string
  onMapReady?: (map: MapInstance) => void
  onRegionClick: (regionId: string) => void
}

export default function MapLibreMap({ mapRef, selectedRegionId, onMapReady, onRegionClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onMapReadyRef = useRef(onMapReady)
  const onRegionClickRef = useRef(onRegionClick)

  useEffect(() => {
    onMapReadyRef.current = onMapReady
  }, [onMapReady])
  useEffect(() => {
    onRegionClickRef.current = onRegionClick
  }, [onRegionClick])

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const map = new MaplibreMapInstance({
      container: containerRef.current,
      style: createInkStyle(),
      center: HUBEI_MAP_INITIAL.center,
      zoom: HUBEI_MAP_INITIAL.zoom,
      minZoom: HUBEI_MAP_INITIAL.minZoom,
      maxZoom: HUBEI_MAP_INITIAL.maxZoom,
      attributionControl: { compact: true },
      dragRotate: false,
      touchZoomRotate: false,
    })
    mapRef.current = map

    map.on('load', () => {
      ;(map.getSource('neighbor-provinces') as GeoJSONSource | undefined)?.setData(neighborProvincesGeoJSON)
      ;(map.getSource('hubei-rivers') as GeoJSONSource | undefined)?.setData(hubeiRiversGeoJSON)
      ;(map.getSource('hubei-regions') as GeoJSONSource | undefined)?.setData(buildHubeiRegionsGeoJSON(selectedRegionId))

      map.addControl(new NavigationControl({ visualizePitch: false }), 'top-right')

      map.on('click', 'hubei-region-fill', (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0]
        if (!feature) return
        const regionId = feature.properties?.regionId as string | undefined
        if (regionId) onRegionClickRef.current(regionId)
      })

      map.on('mousemove', 'hubei-region-fill', (event: MapLayerMouseEvent) => {
        const features = event.features
        if (features && features.length > 0) {
          map.setFeatureState(
            { source: 'hubei-regions', id: features[0].id },
            { hover: true },
          )
        }
      })
      map.on('mouseleave', 'hubei-region-fill', () => {
        map.removeFeatureState({ source: 'hubei-regions' })
      })

      map.getCanvas().style.cursor = 'pointer'

      onMapReadyRef.current?.(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="maplibre-container absolute inset-0" aria-label="湖北文化地图" role="application" />
}
