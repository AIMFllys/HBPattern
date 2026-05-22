import { create } from 'zustand'
import { createPatternPlaceholderDataUrl } from '@/lib/patternPlaceholder'
import type { PatternListItem } from '@/types/pattern'
import type {
  ColorAdjustParams,
  LayerTransform,
  SerializableLayer,
  SymmetryConfig,
  WorkshopLayer,
  WorkshopTool,
} from '@/types/workshop'
import {
  DEFAULT_COLOR_ADJUST,
  DEFAULT_LAYER_TRANSFORM,
  DEFAULT_SYMMETRY,
} from '@/types/workshop'

interface WorkshopState {
  canvasSize: { width: number; height: number }
  setCanvasSize: (size: { width: number; height: number }) => void

  zoom: number
  setZoom: (zoom: number) => void
  panOffset: { x: number; y: number }
  setPanOffset: (offset: { x: number; y: number }) => void
  resetViewport: () => void

  layers: WorkshopLayer[]
  activeLayerId: string | null
  addLayer: (layer: Omit<WorkshopLayer, 'id' | 'createdAt'> & { id?: string }) => string
  addPatternLayer: (pattern: PatternListItem, options?: { activateOnly?: boolean }) => string | null
  addColorLayer: (color?: string) => string
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<WorkshopLayer>) => void
  replaceLayers: (layers: SerializableLayer[], activeLayerId?: string | null) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  setActiveLayer: (id: string | null) => void
  updateActiveLayerTransform: (updates: Partial<LayerTransform>) => void
  updateActiveLayerColorAdjust: (updates: Partial<ColorAdjustParams>) => void

  selectedSourcePattern: PatternListItem | null
  setSelectedSourcePattern: (pattern: PatternListItem | null) => void

  activeTool: WorkshopTool
  setActiveTool: (tool: WorkshopTool) => void

  symmetry: SymmetryConfig
  setSymmetry: (config: Partial<SymmetryConfig>) => void

  isExporting: boolean
  setIsExporting: (value: boolean) => void

  patternSearchQuery: string
  setPatternSearchQuery: (query: string) => void
  patternFilterEra: string | null
  setPatternFilterEra: (era: string | null) => void

  resetWorkshop: () => void
}

const BACKGROUND_LAYER_ID = 'workshop-background'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function createLayerId(prefix = 'layer') {
  const randomPart = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-${randomPart}`
}

function createBackgroundLayer(): WorkshopLayer {
  return {
    id: BACKGROUND_LAYER_ID,
    name: '宣纸底色',
    type: 'color-fill',
    visible: true,
    locked: false,
    opacity: 100,
    blendMode: 'source-over',
    fillColor: '#ffffff',
    transform: { ...DEFAULT_LAYER_TRANSFORM },
    colorAdjust: { ...DEFAULT_COLOR_ADJUST },
    loadStatus: 'loaded',
    createdAt: Date.now(),
  }
}

function getPrimaryImageUrl(pattern: PatternListItem) {
  return pattern.media?.[0]?.url ?? createPatternPlaceholderDataUrl({
    name: pattern.name,
    subtitle: [pattern.era, pattern.region?.name].filter(Boolean).join(' · ') || '湖北纹样',
    palette: pattern.color_palette,
  })
}

function toRuntimeLayer(layer: SerializableLayer): WorkshopLayer {
  return { ...layer }
}

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  canvasSize: { width: 1024, height: 1024 },
  setCanvasSize: size => set({ canvasSize: size }),

  zoom: 1,
  setZoom: zoom => set({ zoom: clamp(zoom, 0.1, 5) }),
  panOffset: { x: 0, y: 0 },
  setPanOffset: offset => set({ panOffset: offset }),
  resetViewport: () => set({ zoom: 1, panOffset: { x: 0, y: 0 } }),

  layers: [createBackgroundLayer()],
  activeLayerId: BACKGROUND_LAYER_ID,
  addLayer: layer => {
    const id = layer.id ?? createLayerId(layer.type)
    const nextLayer: WorkshopLayer = {
      ...layer,
      id,
      createdAt: Date.now(),
    }
    set(state => ({
      layers: [...state.layers, nextLayer],
      activeLayerId: id,
    }))
    return id
  },
  addPatternLayer: (pattern, options) => {
    const imageUrl = getPrimaryImageUrl(pattern)

    if (options?.activateOnly) {
      const existing = get().layers.find(layer => layer.sourcePatternId === pattern.id)
      if (existing) {
        set({
          selectedSourcePattern: pattern,
          activeLayerId: existing.id,
        })
        return existing.id
      }
    }

    const id = createLayerId(`pattern-${pattern.id}`)
    const layer: WorkshopLayer = {
      id,
      name: pattern.name,
      type: 'pattern',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'source-over',
      sourceImageUrl: imageUrl,
      sourcePatternId: pattern.id,
      sourcePatternName: pattern.name,
      sourcePattern: pattern,
      transform: { ...DEFAULT_LAYER_TRANSFORM },
      colorAdjust: { ...DEFAULT_COLOR_ADJUST },
      loadStatus: 'idle',
      createdAt: Date.now(),
    }
    set(state => ({
      selectedSourcePattern: pattern,
      layers: [...state.layers, layer],
      activeLayerId: id,
    }))
    return id
  },
  addColorLayer: (color = '#f5f0e8') => {
    const id = createLayerId('color')
    const layer: WorkshopLayer = {
      id,
      name: '纯色底纹',
      type: 'color-fill',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'source-over',
      fillColor: color,
      transform: { ...DEFAULT_LAYER_TRANSFORM },
      colorAdjust: { ...DEFAULT_COLOR_ADJUST },
      loadStatus: 'loaded',
      createdAt: Date.now(),
    }
    set(state => ({ layers: [...state.layers, layer], activeLayerId: id }))
    return id
  },
  removeLayer: id =>
    set(state => {
      if (id === BACKGROUND_LAYER_ID) return state
      const layers = state.layers.filter(layer => layer.id !== id)
      return {
        layers,
        activeLayerId:
          state.activeLayerId === id ? layers[layers.length - 1]?.id ?? null : state.activeLayerId,
      }
    }),
  updateLayer: (id, updates) =>
    set(state => ({
      layers: state.layers.map(layer => (layer.id === id ? { ...layer, ...updates } : layer)),
    })),
  replaceLayers: (layers, activeLayerId) =>
    set({
      layers: layers.map(toRuntimeLayer),
      activeLayerId: activeLayerId ?? layers[layers.length - 1]?.id ?? null,
    }),
  reorderLayers: (fromIndex, toIndex) =>
    set(state => {
      if (fromIndex === toIndex) return state
      if (fromIndex < 0 || toIndex < 0) return state
      if (fromIndex >= state.layers.length || toIndex >= state.layers.length) return state

      const layers = [...state.layers]
      const [moved] = layers.splice(fromIndex, 1)
      if (!moved) return state
      layers.splice(toIndex, 0, moved)
      return { layers }
    }),
  setActiveLayer: id => set({ activeLayerId: id }),
  updateActiveLayerTransform: updates =>
    set(state => ({
      layers: state.layers.map(layer =>
        layer.id === state.activeLayerId && !layer.locked
          ? { ...layer, transform: { ...layer.transform, ...updates } }
          : layer
      ),
    })),
  updateActiveLayerColorAdjust: updates =>
    set(state => ({
      layers: state.layers.map(layer =>
        layer.id === state.activeLayerId && !layer.locked
          ? { ...layer, colorAdjust: { ...layer.colorAdjust, ...updates } }
          : layer
      ),
    })),

  selectedSourcePattern: null,
  setSelectedSourcePattern: pattern => set({ selectedSourcePattern: pattern }),

  activeTool: 'select',
  setActiveTool: tool => set({ activeTool: tool }),

  symmetry: { ...DEFAULT_SYMMETRY },
  setSymmetry: config => set(state => ({ symmetry: { ...state.symmetry, ...config } })),

  isExporting: false,
  setIsExporting: value => set({ isExporting: value }),

  patternSearchQuery: '',
  setPatternSearchQuery: query => set({ patternSearchQuery: query }),
  patternFilterEra: null,
  setPatternFilterEra: era => set({ patternFilterEra: era }),

  resetWorkshop: () =>
    set({
      canvasSize: { width: 1024, height: 1024 },
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      layers: [createBackgroundLayer()],
      activeLayerId: BACKGROUND_LAYER_ID,
      selectedSourcePattern: null,
      activeTool: 'select',
      symmetry: { ...DEFAULT_SYMMETRY },
      isExporting: false,
      patternSearchQuery: '',
      patternFilterEra: null,
    }),
}))
