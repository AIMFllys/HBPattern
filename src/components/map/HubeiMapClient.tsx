'use client'

import { useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import {
  HUBEI_MAP_LABEL_THRESHOLDS,
  HUBEI_OUTLINE_PATH,
  findHubeiPlace,
  findHubeiRegion,
  hubeiRegions,
  projectHubeiPoint,
} from '@/data/map/hubei'

const MIN_ZOOM = 0.62
const MAX_ZOOM = 2.6
const DEFAULT_VIEW = { zoom: 0.92, pan: { x: 0, y: 0 } }

type DragState = {
  pointerId: number
  x: number
  y: number
}

function clampZoom(value: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2))))
}

function formatZoom(zoom: number) {
  return `${Math.round(zoom * 100)}%`
}

export default function HubeiMapClient() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_VIEW.zoom)
  const [pan, setPan] = useState(DEFAULT_VIEW.pan)
  const [selectedRegionId, setSelectedRegionId] = useState('wuhan')
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)

  const selectedRegion = findHubeiRegion(selectedRegionId) ?? hubeiRegions[0]
  const selectedPlace = selectedPlaceId ? findHubeiPlace(selectedRegion.id, selectedPlaceId) : null

  const projectedRegions = useMemo(
    () => hubeiRegions.map(region => ({ region, projected: projectHubeiPoint(region.point) })),
    [],
  )

  const totalPlaces = useMemo(
    () => hubeiRegions.reduce((sum, region) => sum + region.keyPlaces.length, 0),
    [],
  )

  function updateZoom(nextZoom: number) {
    setZoom(clampZoom(nextZoom))
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.12 : 0.12
    updateZoom(zoom + delta)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!drag || drag.pointerId !== event.pointerId || !rect) return

    const dx = ((event.clientX - drag.x) / rect.width) * 100
    const dy = ((event.clientY - drag.y) / rect.height) * 100
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY }
    setPan(current => ({
      x: current.x + dx / zoom,
      y: current.y + dy / zoom,
    }))
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function resetView() {
    setZoom(DEFAULT_VIEW.zoom)
    setPan(DEFAULT_VIEW.pan)
    setSelectedRegionId('wuhan')
    setSelectedPlaceId(null)
  }

  function selectRegion(regionId: string) {
    setSelectedRegionId(regionId)
    setSelectedPlaceId(null)
  }

  function focusRegion(regionId: string) {
    const region = findHubeiRegion(regionId)
    if (!region) return
    const point = projectHubeiPoint(region.point)
    setSelectedRegionId(regionId)
    setSelectedPlaceId(null)
    setZoom(1.55)
    setPan({ x: 50 - point.x, y: 50 - point.y })
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] flex-col overflow-hidden bg-[#f8f4eb] lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-rice-deep bg-rice/95 lg:h-[calc(100vh-73px)] lg:w-80 lg:border-b-0 lg:border-r">
        <div className="space-y-5 overflow-y-auto p-5">
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">Demo 地理数据</p>
            <h1 className="font-serif text-2xl font-black leading-tight text-ink">湖北纹样地理溯源</h1>
            <p className="mt-2 text-sm leading-6 text-ink-light">
              本地矢量轮廓 + 17 个区域点位。滚轮缩放、拖动画布，放大后逐级显示关键地点。
            </p>
          </section>

          <section className="grid grid-cols-3 gap-2">
            <MetricCard label="区域" value={hubeiRegions.length} />
            <MetricCard label="地点" value={totalPlaces} />
            <MetricCard label="缩放" value={formatZoom(zoom)} />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">区域索引</h2>
              <button
                type="button"
                onClick={resetView}
                className="inline-flex items-center gap-1 rounded border border-rice-deep bg-white px-2 py-1 text-xs font-bold text-ink-light transition hover:border-gold hover:text-ink"
              >
                <Icon name="center_focus_strong" size={15} />
                重置
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {hubeiRegions.map(region => {
                const isSelected = selectedRegion.id === region.id
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => focusRegion(region.id)}
                    className={`rounded border px-3 py-2 text-left transition ${
                      isSelected
                        ? 'border-cinnabar bg-cinnabar text-white shadow-sm'
                        : 'border-rice-deep bg-white text-ink-medium hover:border-gold hover:bg-gold/10'
                    }`}
                  >
                    <span className="block text-sm font-bold leading-none">{region.shortName}</span>
                    <span className={`mt-1 block text-[10px] ${isSelected ? 'text-white/75' : 'text-ink-faint'}`}>
                      {region.stats.ichProjects} 项非遗线索
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </aside>

      <section className="relative min-h-[720px] flex-1 overflow-hidden bg-[#fdf9ee]">
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

          <svg className="absolute inset-0 h-full w-full" viewBox="-8 -8 116 116" aria-hidden="true">
            <defs>
              <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.8" stdDeviation="2.4" floodColor="#6b3a1f" floodOpacity="0.22" />
              </filter>
              <linearGradient id="provinceFill" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#fbf2da" />
                <stop offset="52%" stopColor="#e8d8ac" />
                <stop offset="100%" stopColor="#d9b86b" />
              </linearGradient>
            </defs>

            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              <path
                d={HUBEI_OUTLINE_PATH}
                fill="url(#provinceFill)"
                stroke="#8c2f22"
                strokeWidth={0.42 / zoom}
                filter="url(#mapShadow)"
                className="transition-[stroke-width] duration-200"
              />
              <path
                d={HUBEI_OUTLINE_PATH}
                fill="none"
                stroke="#fff7df"
                strokeWidth={0.15 / zoom}
                strokeDasharray={`${1.1 / zoom} ${1.4 / zoom}`}
                opacity={0.9}
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
                        setSelectedPlaceId(place.id)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedPlaceId(place.id)
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
            </g>
          </svg>
        </div>

        <div className="pointer-events-none absolute left-5 top-5 max-w-[22rem]">
          <div className="pointer-events-auto border-l-4 border-gold bg-white/88 p-4 shadow-xl backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gold">当前视图</p>
            <h2 className="mt-1 font-serif text-xl font-black text-ink">湖北省行政区域 Demo</h2>
            <p className="mt-1 text-xs leading-5 text-ink-light">
              城市标签在 {Math.round(HUBEI_MAP_LABEL_THRESHOLDS.city * 100)}% 后显示，地点标签在 {Math.round(HUBEI_MAP_LABEL_THRESHOLDS.place * 100)}% 后显示。
            </p>
          </div>
        </div>

        <div className="absolute right-5 top-5 flex flex-col overflow-hidden border border-rice-deep bg-white shadow-lg">
          <button type="button" onClick={() => updateZoom(zoom + 0.16)} className="p-2 text-ink transition hover:bg-gold/15" aria-label="放大地图">
            <Icon name="add" size={20} />
          </button>
          <div className="h-px bg-rice-deep" />
          <button type="button" onClick={() => updateZoom(zoom - 0.16)} className="p-2 text-ink transition hover:bg-gold/15" aria-label="缩小地图">
            <Icon name="remove" size={20} />
          </button>
          <div className="h-px bg-rice-deep" />
          <button type="button" onClick={resetView} className="p-2 text-ink transition hover:bg-gold/15" aria-label="重置地图视图">
            <Icon name="my_location" size={20} />
          </button>
        </div>

        <div className="absolute bottom-5 left-5 w-[min(26rem,calc(100%-2.5rem))] border border-rice-deep bg-white/92 p-5 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cinnabar">地区洞察</p>
              <h2 className="mt-1 font-serif text-2xl font-black leading-tight text-ink">
                {selectedRegion.name}
                <span className="ml-2 text-sm font-semibold text-ink-light">{selectedRegion.namePinyin}</span>
              </h2>
            </div>
            <span className="rounded-full border border-rice-deep px-2 py-1 text-[10px] font-bold text-ink-light">
              {selectedRegion.type === 'autonomous_prefecture' ? '自治州' : selectedRegion.type === 'forest_district' ? '林区' : selectedRegion.type === 'sub_prefecture' ? '省直管' : '地级市'}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-ink-medium">{selectedRegion.culturalIntro}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedRegion.patternKeywords.map(keyword => (
              <span key={keyword} className="rounded-full bg-rice-warm px-2.5 py-1 text-[11px] font-bold text-ink-medium">
                {keyword}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-rice-deep py-3">
            <MiniStat label="Demo 纹样" value={selectedRegion.stats.demoPatternCount} />
            <MiniStat label="非遗线索" value={selectedRegion.stats.ichProjects} />
            <MiniStat label="关键地点" value={selectedRegion.keyPlaces.length} />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.18em] text-ink-faint">关键地点</h3>
              <span className="text-[11px] text-ink-faint">放大至 145% 可见地图标签</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {selectedRegion.keyPlaces.map(place => {
                const isSelected = selectedPlace?.id === place.id
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => setSelectedPlaceId(place.id)}
                    className={`min-h-20 border p-2 text-left transition ${
                      isSelected
                        ? 'border-cinnabar bg-cinnabar text-white'
                        : 'border-rice-deep bg-rice-warm text-ink-medium hover:border-gold hover:bg-gold/10'
                    }`}
                  >
                    <span className="block text-xs font-black">{place.name}</span>
                    <span className={`mt-1 line-clamp-2 block text-[10px] leading-4 ${isSelected ? 'text-white/80' : 'text-ink-faint'}`}>
                      {place.summary}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {selectedPlace && (
          <div className="absolute bottom-5 right-5 hidden w-72 border border-gold/60 bg-[#1a1a14]/92 p-4 text-rice shadow-2xl backdrop-blur lg:block">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="location_on" size={18} className="text-gold" />
              <h3 className="font-serif text-lg font-black">{selectedPlace.name}</h3>
            </div>
            <p className="text-xs leading-5 text-rice/78">{selectedPlace.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedPlace.patternKeywords.map(keyword => (
                <span key={keyword} className="rounded-full border border-rice/20 px-2 py-0.5 text-[10px] text-rice/85">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 border border-rice-deep bg-white/92 px-3 py-2.5 text-[10px] font-bold text-ink-medium shadow-lg backdrop-blur lg:bottom-auto lg:top-36">
          <LegendItem color="bg-cinnabar" label="当前选中区域" />
          <LegendItem color="bg-gold" label="城市中心点" />
          <LegendItem color="bg-ink" label="关键地点" />
        </div>
      </section>
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-rice-deep bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] text-ink-faint">{label}</p>
      <p className="text-lg font-black text-ink">{value}</p>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 ${color}`} />
      <span>{label}</span>
    </div>
  )
}

function MapText({
  x,
  y,
  size,
  weight,
  className,
  children,
}: {
  x: number
  y: number
  size: number
  weight: number
  className: string
  children: string
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      paintOrder="stroke"
      stroke="#fffaf0"
      strokeWidth={size * 0.2}
      className={`select-none font-serif ${className}`}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </text>
  )
}
