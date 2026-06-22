import { create } from 'zustand'
import * as THREE from 'three'
import {
  DEFAULT_MATERIAL_PARAMS,
  DEFAULT_TEXTURE_PARAMS,
  type CameraPreset,
  type MaterialParams,
  type PatternPreset,
  type ProductId,
  type TextureParams,
} from '@/types/create'
import { PATTERN_CATEGORIES, PATTERN_PRESETS, type PatternCategoryFilter } from '@/lib/textures/patternPresets'

interface CreateState {
  selectedProduct: ProductId
  setProduct: (product: ProductId) => void

  selectedPattern: PatternPreset | null
  setPattern: (pattern: PatternPreset | null) => void

  textureParams: TextureParams
  setTextureParam: <K extends keyof TextureParams>(
    key: K,
    value: TextureParams[K]
  ) => void
  resetTextureParams: () => void

  materialParams: MaterialParams
  setMaterialParam: <K extends keyof MaterialParams>(
    key: K,
    value: MaterialParams[K]
  ) => void
  resetMaterialParams: () => void

  cameraPreset: CameraPreset
  setCameraPreset: (preset: CameraPreset) => void

  activeCategory: PatternCategoryFilter
  setActiveCategory: (category: PatternCategoryFilter) => void

  isExporting: boolean
  setIsExporting: (value: boolean) => void

  threeScene: THREE.Scene | null
  setThreeScene: (scene: THREE.Scene | null) => void
}

const defaultPattern = PATTERN_PRESETS[0] ?? null

const initialMaterialParams: MaterialParams = {
  ...DEFAULT_MATERIAL_PARAMS,
  baseColor: defaultPattern?.suggestedBaseColor ?? DEFAULT_MATERIAL_PARAMS.baseColor,
}

export const useCreateStore = create<CreateState>((set) => ({
  selectedProduct: 'frame',
  setProduct: product =>
    set(state => ({
      selectedProduct: product,
      textureParams: DEFAULT_TEXTURE_PARAMS,
      materialParams: {
        ...DEFAULT_MATERIAL_PARAMS,
        baseColor: state.materialParams.baseColor,
      },
      cameraPreset: 'front',
    })),

  selectedPattern: defaultPattern,
  setPattern: pattern =>
    set({
      selectedPattern: pattern,
    }),

  textureParams: DEFAULT_TEXTURE_PARAMS,
  setTextureParam: (key, value) =>
    set(state => ({
      textureParams: { ...state.textureParams, [key]: value },
    })),
  resetTextureParams: () => set({ textureParams: DEFAULT_TEXTURE_PARAMS }),

  materialParams: initialMaterialParams,
  setMaterialParam: (key, value) =>
    set(state => ({
      materialParams: { ...state.materialParams, [key]: value },
    })),
  resetMaterialParams: () =>
    set({
      materialParams: { ...DEFAULT_MATERIAL_PARAMS },
    }),

  cameraPreset: 'front',
  setCameraPreset: preset => set({ cameraPreset: preset }),

  activeCategory: PATTERN_CATEGORIES[0],
  setActiveCategory: category => set({ activeCategory: category }),

  isExporting: false,
  setIsExporting: value => set({ isExporting: value }),

  threeScene: null,
  setThreeScene: scene => set({ threeScene: scene }),
}))
