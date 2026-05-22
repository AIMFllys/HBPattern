/**
 * 3D 文创预览系统类型定义。
 */

export type ProductId =
  | 'frame'
  | 'scarf'
  | 'phone-case'
  | 'fan'
  | 'tea-cup'
  | 'tshirt'

export interface ProductConfig {
  id: ProductId
  name: string
  nameEn: string
  icon: string
  description: string
  available: boolean
}

export type PatternCategory =
  | '楚文化'
  | '丝绸工艺'
  | '漆器纹样'
  | '织锦图案'
  | '印染工艺'
  | '当代创意'

export type PatternType =
  | 'geometric'
  | 'floral'
  | 'wave'
  | 'cloud'
  | 'dragon'
  | 'phoenix'

export type PatternStyle = 'bold' | 'delicate' | 'minimal'

export interface PatternGeneratorConfig {
  type: PatternType
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  lineWidth: number
  density: number
  style?: PatternStyle
}

export interface PatternPreset {
  id: string
  name: string
  category: PatternCategory
  generatorConfig: PatternGeneratorConfig
  suggestedBaseColor: string
  palette: string[]
}

export type TilingMode = 'single' | 'repeat' | 'mirror'

export type CameraPreset = 'front' | 'side' | 'top' | 'free'

export interface TextureParams {
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
  opacity: number
  tiling: TilingMode
}

export interface MaterialParams {
  baseColor: string
  showBaseSurface: boolean
  roughness: number
  metalness: number
}

export interface CreationSnapshot {
  productId: ProductId
  patternId: string
  textureParams: TextureParams
  materialParams: MaterialParams
  createdAt: string
}

export const DEFAULT_TEXTURE_PARAMS: TextureParams = {
  scale: 100,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  opacity: 85,
  tiling: 'repeat',
}

export const DEFAULT_MATERIAL_PARAMS: MaterialParams = {
  baseColor: '#f5f0e8',
  showBaseSurface: true,
  roughness: 60,
  metalness: 0,
}
