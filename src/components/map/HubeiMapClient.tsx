'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import {
  HUBEI_MAP_LABEL_THRESHOLDS,
  HUBEI_MAP_STORAGE_KEY,
  HUBEI_OUTLINE_PATH,
  findHubeiPlace,
  findHubeiRegion,
  hubeiRegions,
  projectHubeiPoint,
} from '@/data/map/hubei'
import { analyzePatternDraft } from '@/lib/map/patternAnalysis'
import type { DemoMapBinding, DemoPatternDraft, MapPatternOption, PatternAnalysisResult } from '@/types'

const MIN_ZOOM = 0.62
const MAX_ZOOM = 2.6
const DEFAULT_VIEW = { zoom: 0.92, pan: { x: 0, y: 0 } }
const DEFAULT_PALETTE = ['#b84a39', '#c9a84c', '#f5f0e8']

type DragState = {
  pointerId: number
  x: number
  y: number
}

type DemoMode = 'bind' | 'create'

type DraftForm = Omit<DemoPatternDraft, 'id' | 'createdAt'>

type MapDemoState = {
  bindings: DemoMapBinding[]
  drafts: DemoPatternDraft[]
}

type DisplayBinding = {
  binding: DemoMapBinding
  pattern: MapPatternOption
  region: NonNullable<ReturnType<typeof findHubeiRegion>>
  place: NonNullable<ReturnType<typeof findHubeiPlace>>
}

interface HubeiMapClientProps {
  initialPatterns: MapPatternOption[]
}

function clampZoom(value: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2))))
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getFirstPlaceId(regionId: string) {
  return findHubeiRegion(regionId)?.keyPlaces[0]?.id ?? ''
}

function ensurePlaceId(regionId: string, placeId: string) {
  return findHubeiPlace(regionId, placeId)?.id ?? getFirstPlaceId(regionId)
}

function createEmptyDraft(regionId = 'wuhan', placeId = getFirstPlaceId('wuhan')): DraftForm {
  return {
    name: '',
    description: '',
    era: '',
    technique: '',
    regionId,
    placeId,
    imageDataUrl: null,
    colorPalette: DEFAULT_PALETTE,
  }
}

function draftToPatternOption(draft: DemoPatternDraft): MapPatternOption {
  const region = findHubeiRegion(draft.regionId)
  return {
    id: draft.id,
    name: draft.name,
    description: draft.description || null,
    era: draft.era || null,
    regionName: region?.name ?? null,
    techniqueName: draft.technique || null,
    imageUrl: draft.imageDataUrl,
    colorPalette: draft.colorPalette.length > 0 ? draft.colorPalette : DEFAULT_PALETTE,
    source: 'demo',
  }
}

function parseStoredState(value: string | null): MapDemoState {
  if (!value) return { bindings: [], drafts: [] }
  try {
    const parsed = JSON.parse(value) as Partial<MapDemoState>
    return {
      bindings: Array.isArray(parsed.bindings) ? parsed.bindings : [],
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
    }
  } catch {
    return { bindings: [], drafts: [] }
  }
}

function toHex(value: number) {
  return value.toString(16).padStart(2, '0')
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function quantize(value: number) {
  return Math.min(240, Math.round(value / 32) * 32)
}

async function readImageForDemo(file: File): Promise<{ dataUrl: string; palette: string[] }> {
  const sourceDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解析失败'))
    img.src = sourceDataUrl
  })

  const maxSize = 520
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return { dataUrl: sourceDataUrl, palette: DEFAULT_PALETTE }
  ctx.drawImage(image, 0, 0, width, height)

  const pixels = ctx.getImageData(0, 0, width, height).data
  const buckets = new Map<string, number>()
  for (let i = 0; i < pixels.length; i += 16) {
    const alpha = pixels[i + 3]
    if (alpha < 160) continue
    const r = quantize(pixels[i])
    const g = quantize(pixels[i + 1])
    const b = quantize(pixels[i + 2])
    const key = rgbToHex(r, g, b)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  const palette = Array.from(buckets.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex)
    .slice(0, 5)

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.82),
    palette: palette.length > 0 ? palette : DEFAULT_PALETTE,
  }
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
  const selectedPlace = selectedPlaceId ? findHubeiPlace(selectedRegion.id, selectedPlaceId) : null
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
      <aside className="flex w-full shrink-0 flex-col border-b border-rice-deep bg-rice/95 lg:h-[calc(100vh-73px)] lg:w-[24rem] lg:border-b-0 lg:border-r">
        <div className="space-y-5 overflow-y-auto p-5">
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">Demo 地理数据</p>
            <h1 className="font-serif text-2xl font-black leading-tight text-ink">湖北纹样地理溯源</h1>
            <p className="mt-2 text-sm leading-6 text-ink-light">
              本地矢量轮廓 + 17 个区域点位。Demo 绑定写入浏览器本地存储，不要求登录。
            </p>
          </section>

          <section className="grid grid-cols-3 gap-2">
            <MetricCard label="区域" value={hubeiRegions.length} />
            <MetricCard label="地点" value={totalPlaces} />
            <MetricCard label="绑定" value={bindings.length} />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">区域索引</h2>
              <button
                type="button"
                onClick={resetView}
                className="inline-flex items-center gap-1 border border-rice-deep bg-white px-2 py-1 text-xs font-bold text-ink-light transition hover:border-gold hover:text-ink"
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
                    className={`border px-3 py-2 text-left transition ${
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

          <section className="border border-rice-deep bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cinnabar">纹样写入 Demo</p>
                <h2 className="mt-1 text-base font-black text-ink">绑定画廊纹样到地点</h2>
              </div>
              <span className="shrink-0 bg-gold/15 px-2 py-1 text-[10px] font-bold text-ink">本地草稿</span>
            </div>

            <div className="grid grid-cols-2 border border-rice-deep">
              <button
                type="button"
                onClick={() => setMode('bind')}
                className={`py-2 text-xs font-black ${mode === 'bind' ? 'bg-ink text-rice' : 'bg-rice-warm text-ink-light hover:text-ink'}`}
              >
                绑定已有
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`py-2 text-xs font-black ${mode === 'create' ? 'bg-ink text-rice' : 'bg-rice-warm text-ink-light hover:text-ink'}`}
              >
                新建纹样
              </button>
            </div>

            {mode === 'bind' ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-ink-light">搜索画廊纹样</label>
                  <input
                    value={patternQuery}
                    onChange={(event) => setPatternQuery(event.target.value)}
                    className="w-full border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
                    placeholder="输入纹样名、地区、工艺..."
                  />
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {filteredPatterns.map(pattern => {
                    const isSelected = selectedPattern?.id === pattern.id && selectedPattern.source === pattern.source
                    return (
                      <button
                        key={`${pattern.source}-${pattern.id}`}
                        type="button"
                        onClick={() => setSelectedPatternId(pattern.id)}
                        className={`flex w-full items-center gap-3 border p-2 text-left transition ${
                          isSelected ? 'border-cinnabar bg-cinnabar/8' : 'border-rice-deep bg-rice-warm hover:border-gold'
                        }`}
                      >
                        <PatternThumb pattern={pattern} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-ink">{pattern.name}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-ink-light">
                            {pattern.regionName ?? '未标注地区'} · {pattern.techniqueName ?? '未标注工艺'}
                          </span>
                        </span>
                        <span className="text-[10px] font-bold uppercase text-ink-faint">{pattern.source === 'demo' ? 'Demo' : 'Gallery'}</span>
                      </button>
                    )
                  })}
                  {filteredPatterns.length === 0 && (
                    <div className="border border-dashed border-rice-deep bg-rice px-3 py-4 text-center">
                      <p className="text-sm font-bold text-ink">没有匹配的纹样</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftForm(current => ({ ...current, name: patternQuery }))
                          setMode('create')
                        }}
                        className="mt-2 inline-flex items-center gap-1 bg-cinnabar px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <Icon name="add" size={15} />
                        新建“{patternQuery || '未命名纹样'}”
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <SelectField label="绑定地区" value={bindingRegionId} onChange={updateBindingRegion}>
                    {hubeiRegions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
                  </SelectField>
                  <SelectField label="关键地点" value={bindingPlaceId} onChange={setBindingPlaceId}>
                    {bindingRegion.keyPlaces.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}
                  </SelectField>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-ink-light">绑定备注</label>
                  <textarea
                    value={bindingNote}
                    onChange={(event) => setBindingNote(event.target.value)}
                    rows={2}
                    maxLength={160}
                    className="w-full resize-none border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
                    placeholder="如：来自汉绣传习点的凤鸟纹样线索"
                  />
                </div>

                <button
                  type="button"
                  onClick={addBinding}
                  disabled={!selectedPattern}
                  className="flex w-full items-center justify-center gap-2 bg-cinnabar px-4 py-2.5 text-sm font-black text-white transition hover:bg-cinnabar-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="add_location_alt" size={18} />
                  写入 Demo 地图绑定
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-rice-deep bg-rice text-center transition hover:border-cinnabar">
                  {draftForm.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draftForm.imageDataUrl} alt="Demo 纹样预览" className="h-32 w-full object-cover" />
                  ) : (
                    <>
                      <Icon name="upload_file" size={34} className="text-ink-faint" />
                      <span className="mt-2 text-xs font-bold text-ink-light">上传本地 Demo 图片</span>
                      <span className="text-[10px] text-ink-faint">自动压缩预览并提取主色</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void handleDraftImage(event.target.files?.[0])}
                  />
                </label>
                {imageError && <p className="text-xs font-bold text-cinnabar">{imageError}</p>}

                <Field label="名称">
                  <input
                    value={draftForm.name}
                    onChange={(event) => updateDraftForm({ name: event.target.value })}
                    maxLength={80}
                    className="w-full border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
                    placeholder="如：汉绣凤穿牡丹"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="年代">
                    <input
                      value={draftForm.era}
                      onChange={(event) => updateDraftForm({ era: event.target.value })}
                      maxLength={40}
                      className="w-full border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
                      placeholder="清代"
                    />
                  </Field>
                  <Field label="工艺">
                    <input
                      value={draftForm.technique}
                      onChange={(event) => updateDraftForm({ technique: event.target.value })}
                      maxLength={40}
                      className="w-full border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
                      placeholder="刺绣"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SelectField label="地区" value={draftForm.regionId} onChange={updateDraftRegion}>
                    {hubeiRegions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
                  </SelectField>
                  <SelectField label="地点" value={draftForm.placeId} onChange={(placeId) => updateDraftForm({ placeId })}>
                    {draftRegion.keyPlaces.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}
                  </SelectField>
                </div>
                <Field label="说明">
                  <textarea
                    value={draftForm.description}
                    onChange={(event) => updateDraftForm({ description: event.target.value })}
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
                    placeholder="纹样的来源、寓意、采样地点或工艺特征..."
                  />
                </Field>

                <AnalysisPanel analysis={draftAnalysis} />

                <button
                  type="button"
                  onClick={saveDraftAndBind}
                  disabled={!draftForm.name.trim()}
                  className="flex w-full items-center justify-center gap-2 bg-ink px-4 py-2.5 text-sm font-black text-rice transition hover:bg-cinnabar disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="save" size={18} />
                  保存草稿并绑定地点
                </button>
              </div>
            )}
          </section>

          <section className="border border-rice-deep bg-rice-warm p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-ink">本地绑定记录</h2>
              <span className="text-[11px] text-ink-faint">{storageReady ? '已启用 localStorage' : '读取中'}</span>
            </div>
            <div className="space-y-2">
              {displayBindings.slice(0, 5).map(({ binding, pattern, region, place }) => (
                <div key={binding.id} className="flex items-start gap-2 border border-rice-deep bg-white p-2">
                  <PatternThumb pattern={pattern} small />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-ink">{pattern.name}</p>
                    <p className="mt-0.5 text-[10px] text-ink-light">{region.shortName} · {place.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBinding(binding.id)}
                    className="text-ink-faint transition hover:text-cinnabar"
                    aria-label="删除本地绑定"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
              {displayBindings.length === 0 && (
                <p className="border border-dashed border-rice-deep bg-white px-3 py-4 text-center text-xs text-ink-faint">
                  暂无本地绑定。选择画廊纹样或新建草稿后即可在地图上显示。
                </p>
              )}
            </div>
          </section>
        </div>
      </aside>

      <section className="relative min-h-[760px] flex-1 overflow-hidden bg-[#fdf9ee]">
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
                return (
                  <g key={item.binding.id}>
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
                          <clipPath id={`thumb-${item.binding.id}`}>
                            <circle cx={projected.x + offset} cy={projected.y - 2.8 / zoom} r={size * 0.58} />
                          </clipPath>
                          <image
                            href={item.pattern.imageUrl}
                            x={projected.x + offset - size * 0.58}
                            y={projected.y - 2.8 / zoom - size * 0.58}
                            width={size * 1.16}
                            height={size * 1.16}
                            clipPath={`url(#thumb-${item.binding.id})`}
                            preserveAspectRatio="xMidYMid slice"
                          />
                        </>
                      )}
                    </g>
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
            <span className="border border-rice-deep px-2 py-1 text-[10px] font-bold text-ink-light">
              {selectedRegion.type === 'autonomous_prefecture' ? '自治州' : selectedRegion.type === 'forest_district' ? '林区' : selectedRegion.type === 'sub_prefecture' ? '省直管' : '地级市'}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-ink-medium">{selectedRegion.culturalIntro}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedRegion.patternKeywords.map(keyword => (
              <span key={keyword} className="bg-rice-warm px-2.5 py-1 text-[11px] font-bold text-ink-medium">
                {keyword}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 border-y border-rice-deep py-3">
            <MiniStat label="Demo 纹样" value={selectedRegion.stats.demoPatternCount} />
            <MiniStat label="非遗线索" value={selectedRegion.stats.ichProjects} />
            <MiniStat label="关键地点" value={selectedRegion.keyPlaces.length} />
            <MiniStat label="已绑定" value={displayBindings.filter(item => item.region.id === selectedRegion.id).length} />
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
                    onClick={() => selectPlace(selectedRegion.id, place.id)}
                    className={`min-h-20 border p-2 text-left transition ${
                      isSelected
                        ? 'border-cinnabar bg-cinnabar text-white'
                        : 'border-rice-deep bg-rice-warm text-ink-medium hover:border-gold hover:bg-gold/10'
                    }`}
                  >
                    <span className="block text-xs font-black">{place.name}</span>
                    <span className={`mt-1 block text-[10px] leading-4 ${isSelected ? 'text-white/80' : 'text-ink-faint'}`}>
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
                <span key={keyword} className="border border-rice/20 px-2 py-0.5 text-[10px] text-rice/85">
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
          <LegendItem color="bg-success" label="纹样绑定" />
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

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-bold text-ink-light">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-rice-deep bg-rice px-2 py-2 text-sm outline-none transition focus:border-cinnabar"
      >
        {children}
      </select>
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-bold text-ink-light">{label}</span>
      {children}
    </label>
  )
}

function PatternThumb({ pattern, small = false }: { pattern: MapPatternOption; small?: boolean }) {
  const sizeClass = small ? 'size-9' : 'size-12'
  const palette = pattern.colorPalette.length > 0 ? pattern.colorPalette : DEFAULT_PALETTE
  return (
    <span
      className={`block shrink-0 overflow-hidden border border-rice-deep bg-cover bg-center ${sizeClass}`}
      style={{
        backgroundColor: palette[0],
        backgroundImage: pattern.imageUrl ? `url("${pattern.imageUrl}")` : `linear-gradient(135deg, ${palette.join(', ')})`,
      }}
    />
  )
}

function AnalysisPanel({ analysis }: { analysis: PatternAnalysisResult }) {
  return (
    <div className="border border-gold/50 bg-gold/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-black text-ink">基础分析</span>
        <span className="text-xs font-black text-cinnabar">{analysis.completenessScore}%</span>
      </div>
      <div className="h-1.5 bg-white">
        <div className="h-full bg-cinnabar" style={{ width: `${analysis.completenessScore}%` }} />
      </div>
      <p className="mt-2 text-[11px] leading-5 text-ink-medium">{analysis.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {analysis.dominantColors.map(color => (
          <span key={color} className="size-5 border border-white shadow-sm" style={{ backgroundColor: color }} title={color} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {analysis.recommendedTags.map(tag => (
          <span key={tag} className="bg-white px-2 py-0.5 text-[10px] font-bold text-ink-medium">
            {tag}
          </span>
        ))}
      </div>
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
