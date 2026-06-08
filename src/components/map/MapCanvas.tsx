import { useId } from 'react'
import type { RefObject } from 'react'
import {
  HUBEI_MAP_LABEL_THRESHOLDS,
  HUBEI_OUTLINE_PATH,
  projectHubeiPoint,
} from '@/data/map/hubei'
import { hubeiBoundaryFeatures } from '@/data/map/hubeiBoundaries'
import type { HubeiKeyPlace, HubeiRegion } from '@/types'
import { MapText } from './MapText'
import type { DisplayBinding } from './mapDemoTypes'

export function MapCanvas({
  viewportRef,
  zoom,
  pan,
  selectedRegion,
  selectedPlace,
  displayBindings,
  projectedRegions,
  handleWheel,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  selectRegion,
  selectPlace,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
  zoom: number
  pan: { x: number; y: number }
  selectedRegion: HubeiRegion
  selectedPlace: HubeiKeyPlace | null
  displayBindings: DisplayBinding[]
  projectedRegions: Array<{ region: HubeiRegion; projected: { x: number; y: number } }>
  handleWheel: (event: React.WheelEvent<HTMLDivElement>) => void
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  handlePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void
  handlePointerUp: (event: React.PointerEvent<HTMLDivElement>) => void
  selectRegion: (regionId: string) => void
  selectPlace: (regionId: string, placeId: string) => void
}) {
  const rawClipIdPrefix = useId()
  const clipIdPrefix = rawClipIdPrefix.replace(/[^a-zA-Z0-9_-]/g, '')

  return (
    <div
      ref={viewportRef}
      role="application"
      aria-label="湖北 3D 文化地图 Demo"
      tabIndex={0}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(201,168,76,0.22),transparent_30%),linear-gradient(135deg,rgba(184,74,57,0.07),transparent_42%),linear-gradient(180deg,#fffaf0,#efe4d2)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(90deg,#8c2f22_1px,transparent_1px),linear-gradient(#8c2f22_1px,transparent_1px)] [background-size:44px_44px]" />

      <svg className="absolute inset-0 h-full w-full" viewBox="-8 -8 116 116" aria-label="湖北省矢量轮廓与纹样绑定点">
        <defs>
          <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.8" stdDeviation="2.4" floodColor="#6b3a1f" floodOpacity="0.22" />
          </filter>
          <linearGradient id="provinceFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#fbf2da" />
            <stop offset="52%" stopColor="#e8d8ac" />
            <stop offset="100%" stopColor="#d9b86b" />
          </linearGradient>
          <linearGradient id="regionFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#fff5d8" />
            <stop offset="100%" stopColor="#e7c878" />
          </linearGradient>
        </defs>

        <g
          transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
          className="transition-transform duration-700 ease-out"
        >
          <path
            d={HUBEI_OUTLINE_PATH}
            fill="url(#provinceFill)"
            stroke="none"
            filter="url(#mapShadow)"
            opacity={0.36}
          />
          {hubeiBoundaryFeatures.map(feature => {
            const isSelected = feature.id === selectedRegion.id
            return (
              <path
                key={feature.id}
                d={feature.path}
                role="button"
                tabIndex={0}
                aria-label={`查看${feature.name}纹样地点`}
                fill={isSelected ? '#f1d387' : 'url(#regionFill)'}
                stroke={isSelected ? '#8c2f22' : '#a96d38'}
                strokeWidth={(isSelected ? 0.42 : 0.2) / zoom}
                opacity={isSelected ? 0.98 : 0.78}
                onClick={(event) => {
                  event.stopPropagation()
                  selectRegion(feature.id)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectRegion(feature.id)
                  }
                }}
                className="cursor-pointer transition-opacity duration-200 hover:opacity-100"
              >
                <title>{feature.name}</title>
              </path>
            )
          })}
          <path
            d={HUBEI_OUTLINE_PATH}
            fill="none"
            stroke="#8c2f22"
            strokeWidth={0.28 / zoom}
            opacity={0.72}
          />

          {zoom < HUBEI_MAP_LABEL_THRESHOLDS.province && (
            <MapText x={48} y={49} size={5.6 / zoom} weight={800} className="fill-cinnabar">
              湖北省
            </MapText>
          )}

          {projectedRegions.map(({ region, projected }) => {
            const isSelected = region.id === selectedRegion.id
            return (
              <g key={region.id}>
                <g
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation()
                    selectRegion(region.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectRegion(region.id)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx={projected.x}
                    cy={projected.y}
                    r={(isSelected ? 1.28 : 0.9) / zoom}
                    fill={isSelected ? '#b84a39' : '#c9a84c'}
                    stroke="#fffaf0"
                    strokeWidth={0.36 / zoom}
                    className="transition-all duration-200"
                  />
                  {isSelected && (
                    <circle
                      cx={projected.x}
                      cy={projected.y}
                      r={3.2 / zoom}
                      fill="none"
                      stroke="#b84a39"
                      strokeWidth={0.24 / zoom}
                      opacity={0.55}
                    />
                  )}
                </g>
                {zoom >= HUBEI_MAP_LABEL_THRESHOLDS.city && (
                  <MapText
                    x={projected.x + 1.25 / zoom}
                    y={projected.y - 1.15 / zoom}
                    size={2.1 / zoom}
                    weight={isSelected ? 800 : 650}
                    className={isSelected ? 'fill-cinnabar' : 'fill-ink'}
                  >
                    {region.shortName}
                  </MapText>
                )}
              </g>
            )
          })}

          {zoom >= HUBEI_MAP_LABEL_THRESHOLDS.place && selectedRegion.keyPlaces.map(place => {
            const projected = projectHubeiPoint(place.point)
            const isSelected = selectedPlace?.id === place.id
            return (
              <g key={place.id}>
                <g
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation()
                    selectPlace(selectedRegion.id, place.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectPlace(selectedRegion.id, place.id)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <rect
                    x={projected.x - 0.6 / zoom}
                    y={projected.y - 0.6 / zoom}
                    width={1.2 / zoom}
                    height={1.2 / zoom}
                    rx={0.18 / zoom}
                    fill={isSelected ? '#1a1a14' : '#fffaf0'}
                    stroke={isSelected ? '#c9a84c' : '#8c2f22'}
                    strokeWidth={0.18 / zoom}
                  />
                </g>
                <MapText
                  x={projected.x + 0.95 / zoom}
                  y={projected.y + 0.4 / zoom}
                  size={1.35 / zoom}
                  weight={700}
                  className={isSelected ? 'fill-ink' : 'fill-ink-medium'}
                >
                  {place.name}
                </MapText>
              </g>
            )
          })}

          {zoom >= HUBEI_MAP_LABEL_THRESHOLDS.binding && displayBindings.map((item, index) => {
            const projected = projectHubeiPoint(item.place.point)
            const offset = ((index % 3) - 1) * (1.6 / zoom)
            const size = zoom >= HUBEI_MAP_LABEL_THRESHOLDS.patternThumbnail ? 3.6 / zoom : 1.6 / zoom
            const clipId = `thumb-${clipIdPrefix}-${item.binding.id}`
            const marker = (
              <g
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  selectPlace(item.region.id, item.place.id)
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={projected.x + offset}
                  cy={projected.y - 2.8 / zoom}
                  r={size * 0.68}
                  fill={item.pattern.colorPalette[0] ?? '#b84a39'}
                  stroke="#fffaf0"
                  strokeWidth={0.28 / zoom}
                />
                {zoom >= HUBEI_MAP_LABEL_THRESHOLDS.patternThumbnail && item.pattern.imageUrl && (
                  <>
                    <clipPath id={clipId}>
                      <circle cx={projected.x + offset} cy={projected.y - 2.8 / zoom} r={size * 0.58} />
                    </clipPath>
                    <image
                      href={item.pattern.imageUrl}
                      x={projected.x + offset - size * 0.58}
                      y={projected.y - 2.8 / zoom - size * 0.58}
                      width={size * 1.16}
                      height={size * 1.16}
                      clipPath={`url(#${clipId})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                )}
              </g>
            )
            return (
              <g key={item.binding.id}>
                {item.pattern.source === 'gallery' ? (
                  <a href={`/gallery/${item.pattern.id}`} aria-label={`查看${item.pattern.name}详情`}>
                    {marker}
                  </a>
                ) : marker}
                {zoom >= HUBEI_MAP_LABEL_THRESHOLDS.patternThumbnail && (
                  <MapText
                    x={projected.x + offset + 1.55 / zoom}
                    y={projected.y - 2.2 / zoom}
                    size={1.1 / zoom}
                    weight={800}
                    className="fill-cinnabar"
                  >
                    {item.pattern.name}
                  </MapText>
                )}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
