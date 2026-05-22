'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import {
  HUBEI_MAP_LABEL_THRESHOLDS,
  HUBEI_MAP_STORAGE_KEY,
  findHubeiPlace,
  findHubeiRegion,
  hubeiRegions,
  projectHubeiPoint,
} from '@/data/map/hubei'
import { analyzePatternDraft } from '@/lib/map/patternAnalysis'
import type { DemoMapBinding, DemoPatternDraft, MapPatternOption, PatternAnalysisResult } from '@/types'
import { MapCanvas } from './MapCanvas'
import { MapControls } from './MapControls'
import { MapInfoPanel } from './MapInfoPanel'
import { MapLegend } from './MapLegend'
import { MapPlaceDetail } from './MapPlaceDetail'
import { MapSidebar } from './MapSidebar'
import { DEFAULT_VIEW } from './mapDemoTypes'
import type { DemoMode, DisplayBinding, DraftForm, DragState } from './mapDemoTypes'
import {
  clampZoom,
  createEmptyDraft,
  createId,
  draftToPatternOption,
  ensurePlaceId,
  getFirstPlaceId,
  parseStoredState,
} from './utils/mapDemoUtils'
import { readImageForDemo } from './utils/imageProcessing'

interface HubeiMapClientProps {
  initialPatterns: MapPatternOption[]
}

export default function HubeiMapClient({ initialPatterns }: HubeiMapClientProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_VIEW.zoom)
  const [pan, setPan] = useState(DEFAULT_VIEW.pan)
  const [selectedRegionId, setSelectedRegionId] = useState('wuhan')
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [mode, setMode] = useState<DemoMode>('bind')
  const [patternQuery, setPatternQuery] = useState('')
  const [selectedPatternId, setSelectedPatternId] = useState(initialPatterns[0]?.id ?? '')
  const [bindingRegionId, setBindingRegionId] = useState('wuhan')
  const [bindingPlaceId, setBindingPlaceId] = useState(getFirstPlaceId('wuhan'))
  const [bindingNote, setBindingNote] = useState('')
  const [bindings, setBindings] = useState<DemoMapBinding[]>([])
  const [drafts, setDrafts] = useState<DemoPatternDraft[]>([])
  const [draftForm, setDraftForm] = useState<DraftForm>(createEmptyDraft())
  const [imageError, setImageError] = useState('')
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = parseStoredState(window.localStorage.getItem(HUBEI_MAP_STORAGE_KEY))
      setBindings(stored.bindings)
      setDrafts(stored.drafts)
      setStorageReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    window.localStorage.setItem(HUBEI_MAP_STORAGE_KEY, JSON.stringify({ bindings, drafts }))
  }, [bindings, drafts, storageReady])

  const selectedRegion = findHubeiRegion(selectedRegionId) ?? hubeiRegions[0]
  const selectedPlace = selectedPlaceId ? (findHubeiPlace(selectedRegion.id, selectedPlaceId) ?? null) : null
  const bindingRegion = findHubeiRegion(bindingRegionId) ?? hubeiRegions[0]
  const draftRegion = findHubeiRegion(draftForm.regionId) ?? hubeiRegions[0]

  const projectedRegions = useMemo(
    () => hubeiRegions.map(region => ({ region, projected: projectHubeiPoint(region.point) })),
    [],
  )

  const totalPlaces = useMemo(
    () => hubeiRegions.reduce((sum, region) => sum + region.keyPlaces.length, 0),
    [],
  )

  const demoPatternOptions = useMemo(() => drafts.map(draftToPatternOption), [drafts])
  const allPatternOptions = useMemo(
    () => [...initialPatterns, ...demoPatternOptions],
    [demoPatternOptions, initialPatterns],
  )

  const effectiveSelectedPatternId = selectedPatternId || allPatternOptions[0]?.id || ''
  const selectedPattern = allPatternOptions.find(pattern => pattern.id === effectiveSelectedPatternId) ?? null
  const filteredPatterns = useMemo(() => {
    const q = patternQuery.trim().toLowerCase()
    if (!q) return allPatternOptions.slice(0, 8)
    return allPatternOptions
      .filter(pattern => {
        return [pattern.name, pattern.description, pattern.era, pattern.regionName, pattern.techniqueName]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(q))
      })
      .slice(0, 8)
  }, [allPatternOptions, patternQuery])

  const displayBindings = useMemo<DisplayBinding[]>(() => {
    return bindings
      .map(binding => {
        const region = findHubeiRegion(binding.regionId)
        const place = findHubeiPlace(binding.regionId, binding.placeId)
        const pattern = allPatternOptions.find(item => item.id === binding.patternId && item.source === binding.patternSource)
        if (!region || !place || !pattern) return null
        return { binding, pattern, region, place }
      })
      .filter((item): item is DisplayBinding => Boolean(item))
  }, [allPatternOptions, bindings])

  const draftAnalysis = useMemo<PatternAnalysisResult>(
    () => analyzePatternDraft(draftForm, bindings),
    [bindings, draftForm],
  )

  function updateZoom(nextZoom: number) {
    setZoom(clampZoom(nextZoom))
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.12 : 0.12
    updateZoom(zoom + delta)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
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

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function resetView() {
    setZoom(DEFAULT_VIEW.zoom)
    setPan(DEFAULT_VIEW.pan)
    syncSelectedLocation('wuhan', null)
  }

  function syncSelectedLocation(regionId: string, placeId: string | null) {
    setSelectedRegionId(regionId)
    setSelectedPlaceId(placeId)
    setBindingRegionId(regionId)
    setBindingPlaceId(placeId ?? getFirstPlaceId(regionId))
    setDraftForm(current => ({
      ...current,
      regionId,
      placeId: placeId ?? getFirstPlaceId(regionId),
    }))
  }

  function selectRegion(regionId: string) {
    syncSelectedLocation(regionId, null)
  }

  function selectPlace(regionId: string, placeId: string) {
    syncSelectedLocation(regionId, placeId)
  }

  function focusRegion(regionId: string) {
    const region = findHubeiRegion(regionId)
    if (!region) return
    const point = projectHubeiPoint(region.point)
    syncSelectedLocation(regionId, null)
    setZoom(1.55)
    setPan({ x: 50 - point.x, y: 50 - point.y })
  }

  function updateBindingRegion(regionId: string) {
    const placeId = getFirstPlaceId(regionId)
    setBindingRegionId(regionId)
    setBindingPlaceId(placeId)
  }

  function updateDraftRegion(regionId: string) {
    setDraftForm(current => ({
      ...current,
      regionId,
      placeId: getFirstPlaceId(regionId),
    }))
  }

  function updateDraftForm(patch: Partial<DraftForm>) {
    setDraftForm(current => ({ ...current, ...patch }))
  }

  function createDraftFromQuery() {
    setDraftForm(current => ({ ...current, name: patternQuery }))
    setMode('create')
  }

  function addBinding() {
    if (!selectedPattern) return
    const placeId = ensurePlaceId(bindingRegionId, bindingPlaceId)
    const next: DemoMapBinding = {
      id: createId('binding'),
      patternId: selectedPattern.id,
      patternSource: selectedPattern.source,
      regionId: bindingRegionId,
      placeId,
      note: bindingNote.trim(),
      createdAt: new Date().toISOString(),
    }
    setBindings(current => [next, ...current])
    setBindingNote('')
    selectPlace(bindingRegionId, placeId)
    setZoom(current => Math.max(current, 1.25))
  }

  function saveDraftAndBind() {
    const name = draftForm.name.trim()
    if (!name) return
    const placeId = ensurePlaceId(draftForm.regionId, draftForm.placeId)
    const id = createId('demo-pattern')
    const now = new Date().toISOString()
    const draft: DemoPatternDraft = {
      ...draftForm,
      id,
      name,
      placeId,
      description: draftForm.description.trim(),
      era: draftForm.era.trim(),
      technique: draftForm.technique.trim(),
      createdAt: now,
    }
    const binding: DemoMapBinding = {
      id: createId('binding'),
      patternId: id,
      patternSource: 'demo',
      regionId: draft.regionId,
      placeId: draft.placeId,
      note: '由地图页本地 Demo 新建',
      createdAt: now,
    }
    setDrafts(current => [draft, ...current])
    setBindings(current => [binding, ...current])
    setSelectedPatternId(id)
    setPatternQuery('')
    setDraftForm(createEmptyDraft(draft.regionId, draft.placeId))
    setMode('bind')
    selectPlace(draft.regionId, draft.placeId)
    setZoom(current => Math.max(current, 1.45))
  }

  function removeBinding(bindingId: string) {
    setBindings(current => current.filter(binding => binding.id !== bindingId))
  }

  async function handleDraftImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError('请选择图片文件')
      return
    }
    setImageError('')
    try {
      const { dataUrl, palette } = await readImageForDemo(file)
      updateDraftForm({ imageDataUrl: dataUrl, colorPalette: palette })
    } catch {
      setImageError('图片读取失败，请换一张图片重试')
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] flex-col overflow-hidden bg-[#f8f4eb] lg:flex-row">
      <MapSidebar
        selectedRegion={selectedRegion}
        totalPlaces={totalPlaces}
        bindingCount={bindings.length}
        mode={mode}
        patternQuery={patternQuery}
        filteredPatterns={filteredPatterns}
        selectedPattern={selectedPattern}
        bindingRegionId={bindingRegionId}
        bindingPlaceId={bindingPlaceId}
        bindingRegion={bindingRegion}
        bindingNote={bindingNote}
        draftForm={draftForm}
        draftRegion={draftRegion}
        imageError={imageError}
        storageReady={storageReady}
        displayBindings={displayBindings}
        draftAnalysis={draftAnalysis}
        resetView={resetView}
        focusRegion={focusRegion}
        setMode={setMode}
        setPatternQuery={setPatternQuery}
        setSelectedPatternId={setSelectedPatternId}
        createDraftFromQuery={createDraftFromQuery}
        updateBindingRegion={updateBindingRegion}
        setBindingPlaceId={setBindingPlaceId}
        setBindingNote={setBindingNote}
        addBinding={addBinding}
        updateDraftRegion={updateDraftRegion}
        updateDraftForm={updateDraftForm}
        handleDraftImage={(file) => void handleDraftImage(file)}
        saveDraftAndBind={saveDraftAndBind}
        removeBinding={removeBinding}
      />

      <section className="relative min-h-[760px] flex-1 overflow-hidden bg-[#fdf9ee]">
        <MapCanvas
          viewportRef={viewportRef}
          zoom={zoom}
          pan={pan}
          selectedRegion={selectedRegion}
          selectedPlace={selectedPlace}
          displayBindings={displayBindings}
          projectedRegions={projectedRegions}
          handleWheel={handleWheel}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          selectRegion={selectRegion}
          selectPlace={selectPlace}
        />

        <div className="pointer-events-none absolute left-5 top-5 max-w-[22rem]">
          <div className="pointer-events-auto border-l-4 border-gold bg-white/88 p-4 shadow-xl backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gold">当前视图</p>
            <h2 className="mt-1 font-serif text-xl font-black text-ink">湖北省行政区域 Demo</h2>
            <p className="mt-1 text-xs leading-5 text-ink-light">
              城市标签在 {Math.round(HUBEI_MAP_LABEL_THRESHOLDS.city * 100)}% 后显示，地点标签在 {Math.round(HUBEI_MAP_LABEL_THRESHOLDS.place * 100)}% 后显示。
            </p>
          </div>
        </div>

        <MapControls zoom={zoom} updateZoom={updateZoom} resetView={resetView} />
        <MapInfoPanel
          selectedRegion={selectedRegion}
          selectedPlace={selectedPlace}
          displayBindings={displayBindings}
          selectPlace={selectPlace}
        />
        <MapPlaceDetail selectedPlace={selectedPlace} />
        <MapLegend />
      </section>
    </main>
  )
}
