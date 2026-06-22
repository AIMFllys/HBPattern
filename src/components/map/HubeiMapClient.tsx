'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import type { Map as MaplibreMapInstance } from 'maplibre-gl'
import {
  findHubeiPlace,
  findHubeiRegion,
  hubeiRegions,
  HUBEI_MAP_STORAGE_KEY,
} from '@/data/map/hubei'
import { analyzePatternDraft } from '@/lib/map/patternAnalysis'
import { createGalleryMapBindings } from '@/lib/map/patternGeo'
import type { DemoMapBinding, DemoPatternDraft, MapPatternOption, PatternAnalysisResult } from '@/types'
import { Icon } from '@/components/icons/Icon'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { MapBindingsLayer } from './MapBindingsLayer'
import { MapControls } from './MapControls'
import { MapInfoPanel } from './MapInfoPanel'
import { MapLegend } from './MapLegend'
import { MapPlacesLayer } from './MapPlacesLayer'
import { MapPlaceDetail } from './MapPlaceDetail'
import { MapRegionsLayer } from './MapRegionsLayer'
import { MapSidebar } from './MapSidebar'
import type { DisplayBinding, DraftForm } from './mapDemoTypes'
import { createInitialMapDemoState, mapDemoReducer } from './useMapDemoState'
import { useMapLibre } from './useMapLibre'
import {
  createId,
  draftToPatternOption,
  ensurePlaceId,
  parseStoredState,
} from './utils/mapDemoUtils'
import { readImageForDemo } from './utils/imageProcessing'

const MapLibreMap = dynamic(() => import('./MapLibreMap'), { ssr: false }) as React.ComponentType<
  React.ComponentProps<typeof import('./MapLibreMap')['default']>
>

interface HubeiMapClientProps {
  initialPatterns: MapPatternOption[]
}

export default function HubeiMapClient({ initialPatterns }: HubeiMapClientProps) {
  const [state, dispatch] = useReducer(
    mapDemoReducer,
    initialPatterns[0]?.id ?? '',
    createInitialMapDemoState,
  )
  const {
    selectedRegionId,
    selectedPlaceId,
    mode,
    patternQuery,
    selectedPatternId,
    bindingRegionId,
    bindingPlaceId,
    bindingNote,
    bindings,
    drafts,
    draftForm,
    imageError,
    storageReady,
  } = state

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [mapInstance, setMapInstance] = useState<MaplibreMapInstance | null>(null)
  const { mapRef, flyToRegion, resetView, zoomIn, zoomOut } = useMapLibre()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = parseStoredState(window.localStorage.getItem(HUBEI_MAP_STORAGE_KEY))
      dispatch({ type: 'hydrateStorage', stored })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(HUBEI_MAP_STORAGE_KEY, JSON.stringify({ bindings, drafts }))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [bindings, drafts, storageReady])

  const selectedRegion = findHubeiRegion(selectedRegionId) ?? hubeiRegions[0]
  const selectedPlace = selectedPlaceId ? (findHubeiPlace(selectedRegion.id, selectedPlaceId) ?? null) : null
  const bindingRegion = findHubeiRegion(bindingRegionId) ?? hubeiRegions[0]
  const draftRegion = findHubeiRegion(draftForm.regionId) ?? hubeiRegions[0]

  const totalPlaces = useMemo(
    () => hubeiRegions.reduce((sum, region) => sum + region.keyPlaces.length, 0),
    [],
  )

  const demoPatternOptions = useMemo(() => drafts.map(draftToPatternOption), [drafts])
  const allPatternOptions = useMemo(
    () => [...initialPatterns, ...demoPatternOptions],
    [demoPatternOptions, initialPatterns],
  )
  const galleryBindings = useMemo(() => createGalleryMapBindings(initialPatterns), [initialPatterns])

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
    const localPatternIds = new Set(bindings.map(binding => `${binding.patternSource}:${binding.patternId}`))
    const mergedBindings = [
      ...bindings,
      ...galleryBindings.filter(binding => !localPatternIds.has(`${binding.patternSource}:${binding.patternId}`)),
    ]

    return mergedBindings
      .map(binding => {
        const region = findHubeiRegion(binding.regionId)
        const place = findHubeiPlace(binding.regionId, binding.placeId)
        const pattern = allPatternOptions.find(item => item.id === binding.patternId && item.source === binding.patternSource)
        if (!region || !place || !pattern) return null
        return { binding, pattern, region, place }
      })
      .filter((item): item is DisplayBinding => Boolean(item))
  }, [allPatternOptions, bindings, galleryBindings])

  const draftAnalysis = useMemo<PatternAnalysisResult>(
    () => analyzePatternDraft(draftForm, bindings),
    [bindings, draftForm],
  )

  const handleMapReady = useCallback((map: MaplibreMapInstance) => {
    setMapInstance(map)
  }, [])

  const syncSelectedLocation = useCallback((regionId: string, placeId: string | null) => {
    dispatch({ type: 'syncSelectedLocation', regionId, placeId })
  }, [])

  const selectRegion = useCallback((regionId: string) => {
    syncSelectedLocation(regionId, null)
    const region = findHubeiRegion(regionId)
    if (region) {
      flyToRegion([region.point.lng, region.point.lat], 9)
    }
  }, [flyToRegion, syncSelectedLocation])

  const selectPlace = useCallback((regionId: string, placeId: string) => {
    syncSelectedLocation(regionId, placeId)
  }, [syncSelectedLocation])

  function focusRegion(regionId: string) {
    const region = findHubeiRegion(regionId)
    if (!region) return
    syncSelectedLocation(regionId, null)
    flyToRegion([region.point.lng, region.point.lat], 9)
  }

  function handleResetView() {
    resetView()
    dispatch({ type: 'resetSelection' })
  }

  function updateBindingRegion(regionId: string) {
    dispatch({ type: 'updateBindingRegion', regionId })
  }

  function updateDraftRegion(regionId: string) {
    dispatch({ type: 'updateDraftRegion', regionId })
  }

  function updateDraftForm(patch: Partial<DraftForm>) {
    dispatch({ type: 'patchDraftForm', patch })
  }

  function createDraftFromQuery() {
    dispatch({ type: 'patchDraftForm', patch: { name: patternQuery } })
    dispatch({ type: 'setMode', mode: 'create' })
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
    dispatch({ type: 'addBinding', binding: next, minZoom: 1.25 })
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
    dispatch({ type: 'addDraftAndBinding', draft, binding, minZoom: 1.45 })
  }

  function removeBinding(bindingId: string) {
    dispatch({ type: 'removeBinding', bindingId })
  }

  async function handleDraftImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      dispatch({ type: 'setImageError', message: '请选择图片文件' })
      return
    }
    dispatch({ type: 'setImageError', message: '' })
    try {
      const { dataUrl, palette } = await readImageForDemo(file)
      updateDraftForm({ imageDataUrl: dataUrl, colorPalette: palette })
    } catch {
      dispatch({ type: 'setImageError', message: '图片读取失败，请换一张图片重试' })
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] flex-col overflow-hidden bg-surface lg:flex-row transition-colors">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <MapSidebar
          selectedRegion={selectedRegion}
          totalPlaces={totalPlaces}
          bindingCount={displayBindings.length}
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
          resetView={handleResetView}
          focusRegion={focusRegion}
          setMode={(nextMode) => dispatch({ type: 'setMode', mode: nextMode })}
          setPatternQuery={(query) => dispatch({ type: 'setPatternQuery', query })}
          setSelectedPatternId={(patternId) => dispatch({ type: 'setSelectedPatternId', patternId })}
          createDraftFromQuery={createDraftFromQuery}
          updateBindingRegion={updateBindingRegion}
          setBindingPlaceId={(placeId) => dispatch({ type: 'setBindingPlaceId', placeId })}
          setBindingNote={(note) => dispatch({ type: 'setBindingNote', note })}
          addBinding={addBinding}
          updateDraftRegion={updateDraftRegion}
          updateDraftForm={updateDraftForm}
          handleDraftImage={(file) => void handleDraftImage(file)}
          saveDraftAndBind={saveDraftAndBind}
          removeBinding={removeBinding}
        />
      </div>

      <section className="relative min-h-[50vh] flex-1 overflow-hidden bg-surface-inset lg:min-h-[760px]">
        <MapLibreMap
          mapRef={mapRef}
          selectedRegionId={selectedRegionId}
          onMapReady={handleMapReady}
          onRegionClick={selectRegion}
        />

        {mapInstance && (
          <>
            <MapRegionsLayer map={mapInstance} selectedRegionId={selectedRegionId} />
            <MapPlacesLayer
              map={mapInstance}
              selectedRegion={selectedRegion}
              selectedPlace={selectedPlace}
              onSelectPlace={selectPlace}
            />
            <MapBindingsLayer
              map={mapInstance}
              displayBindings={displayBindings}
              onSelectPlace={selectPlace}
            />
          </>
        )}

        <div className="pointer-events-none absolute left-3 top-3 max-w-[14rem] sm:left-5 sm:top-5 sm:max-w-[22rem] lg:max-w-[22rem]">
          <div className="pointer-events-auto border-l-4 border-gold bg-surface-overlay p-3 shadow-xl backdrop-blur sm:p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gold">当前视图</p>
            <h2 className="mt-1 font-serif text-base font-black text-text sm:text-xl">湖北省文化地图</h2>
            <p className="mt-1 hidden text-xs leading-5 text-text-muted sm:block">
              矢量瓦片底图 · 地形晕渲 · 河流水系 · 县级边界
            </p>
          </div>
        </div>

        <MapControls zoomIn={zoomIn} zoomOut={zoomOut} resetView={handleResetView} />
        <MapInfoPanel
          selectedRegion={selectedRegion}
          selectedPlace={selectedPlace}
          displayBindings={displayBindings}
          selectPlace={selectPlace}
        />
        <MapPlaceDetail selectedPlace={selectedPlace} />
        <MapLegend />

        {/* Mobile sidebar toggle */}
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="absolute bottom-5 right-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-text shadow-modal transition-transform hover:scale-105 lg:hidden"
          aria-label="打开区域面板"
        >
          <Icon name="menu" size={22} />
        </button>
      </section>

      {/* Mobile sidebar BottomSheet */}
      <BottomSheet
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        maxHeight="85vh"
        title="湖北纹样地理溯源"
      >
        <div className="pb-4">
          <MapSidebar
            selectedRegion={selectedRegion}
            totalPlaces={totalPlaces}
            bindingCount={displayBindings.length}
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
            resetView={handleResetView}
            focusRegion={focusRegion}
            setMode={(nextMode) => dispatch({ type: 'setMode', mode: nextMode })}
            setPatternQuery={(query) => dispatch({ type: 'setPatternQuery', query })}
            setSelectedPatternId={(patternId) => dispatch({ type: 'setSelectedPatternId', patternId })}
            createDraftFromQuery={createDraftFromQuery}
            updateBindingRegion={updateBindingRegion}
            setBindingPlaceId={(placeId) => dispatch({ type: 'setBindingPlaceId', placeId })}
            setBindingNote={(note) => dispatch({ type: 'setBindingNote', note })}
            addBinding={addBinding}
            updateDraftRegion={updateDraftRegion}
            updateDraftForm={updateDraftForm}
            handleDraftImage={(file) => void handleDraftImage(file)}
            saveDraftAndBind={saveDraftAndBind}
            removeBinding={removeBinding}
          />
        </div>
      </BottomSheet>
    </main>
  )
}
