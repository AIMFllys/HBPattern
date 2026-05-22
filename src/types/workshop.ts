import type { PatternListItem } from './pattern'

export type WorkshopTool =
  | 'select'
  | 'pan'
  | 'transform'
  | 'color'
  | 'symmetry'

export type WorkshopLayerType = 'pattern' | 'color-fill'

export type CanvasBlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'

export interface LayerTransform {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  flipH: boolean
  flipV: boolean
}

export interface ColorAdjustParams {
  hue: number
  saturation: number
  brightness: number
  contrast: number
  temperature: number
  tint: string | null
}

export type SymmetryType =
  | 'none'
  | 'horizontal'
  | 'vertical'
  | 'both'
  | 'radial-4'
  | 'radial-6'
  | 'radial-8'

export interface SymmetryConfig {
  type: SymmetryType
  centerX: number
  centerY: number
  showGuides: boolean
}

export interface WorkshopLayer {
  id: string
  name: string
  type: WorkshopLayerType
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: CanvasBlendMode
  sourceImageUrl?: string
  sourcePatternId?: string
  sourcePatternName?: string
  sourcePattern?: PatternListItem
  fillColor?: string
  transform: LayerTransform
  colorAdjust: ColorAdjustParams
  loadStatus: 'idle' | 'loading' | 'loaded' | 'error'
  errorMessage?: string
  createdAt: number
}

export type SerializableLayer = Omit<WorkshopLayer, 'sourcePattern'>

export interface CanvasPreset {
  id: string
  name: string
  width: number
  height: number
  description: string
}

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg'

export interface ExportConfig {
  format: ExportFormat
  quality: number
  scale: number
  includeBackground: boolean
}

export interface HistoryEntry {
  id: string
  timestamp: number
  description: string
  layersSnapshot: SerializableLayer[]
}

export const DEFAULT_COLOR_ADJUST: ColorAdjustParams = {
  hue: 0,
  saturation: 0,
  brightness: 0,
  contrast: 0,
  temperature: 0,
  tint: null,
}

export const DEFAULT_LAYER_TRANSFORM: LayerTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  flipH: false,
  flipV: false,
}

export const DEFAULT_SYMMETRY: SymmetryConfig = {
  type: 'none',
  centerX: 0.5,
  centerY: 0.5,
  showGuides: true,
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: 'square-md', name: '方形', width: 1024, height: 1024, description: '标准纹样尺寸' },
  { id: 'square-lg', name: '大方形', width: 2048, height: 2048, description: '高清纹样' },
  { id: 'landscape', name: '横幅', width: 1920, height: 1080, description: '屏风/壁画比例' },
  { id: 'portrait', name: '竖幅', width: 1080, height: 1920, description: '挂轴/手机壁纸' },
  { id: 'scarf', name: '丝巾', width: 1200, height: 1200, description: '方巾比例' },
  { id: 'fan', name: '扇面', width: 1600, height: 800, description: '折扇展开比例' },
]

export const BLEND_MODE_LABELS: Record<CanvasBlendMode, string> = {
  'source-over': '正常',
  multiply: '正片叠底',
  screen: '滤色',
  overlay: '叠加',
  darken: '变暗',
  lighten: '变亮',
  'color-dodge': '颜色减淡',
  'color-burn': '颜色加深',
  'hard-light': '强光',
  'soft-light': '柔光',
  difference: '差值',
  exclusion: '排除',
}
