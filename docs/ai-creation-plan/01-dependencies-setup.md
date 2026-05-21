# Round 1 — 依赖安装 + 基础类型 + Store

## 目标
安装 3D 相关依赖，创建类型定义和 Zustand Store，**不触碰任何现有文件**。
本轮完成后 `npm run build` 和 `npm run lint` 必须通过。

---

## 上下文摘要（执行前必读）

| 项目 | 值 |
|------|-----|
| 框架 | Next.js 16.2.1 (App Router)，Turbopack |
| React | 19.2.4 |
| 包管理 | npm |
| 路径别名 | `@/` → `./src/` |
| 状态管理 | Zustand 5.x（已有 `useAuthStore`, `useAuthModal`） |
| 样式 | Tailwind CSS v4，设计 token 定义在 `src/app/globals.css` |
| 代码规范 | ESLint `--max-warnings=0`；lint-guards 5 项检查 |
| TypeScript | strict 模式 |

**关键色彩 token（必须用，不要硬编码颜色）：**
- `cinnabar` (#b84a39) — 主色
- `gold` (#c9a84c) — 金色强调
- `rice` (#f5f0e8) — 主背景
- `rice-warm` (#ede7d9) — 卡片背景
- `ink` (#1a1a14) — 主文字

---

## Step 1：安装依赖

```bash
npm install three@^0.170.0 @react-three/fiber@^9.0.0 @react-three/drei@^10.0.0
npm install --save-dev @types/three@^0.170.0
```

**版本约束说明：**
- `@react-three/fiber@^9.x` 支持 React 19
- `@react-three/drei@^10.x` 对应 fiber 9.x
- `three@^0.170.x` 稳定版，TS 类型完整

---

## Step 2：创建类型文件

**文件路径：** `src/types/create.ts`

```typescript
/**
 * 3D 文创预览系统 — 类型定义
 * 所有创作相关类型集中于此，避免分散。
 */

// ── 文创产品 ──────────────────────────────────────────────────────────────

export type ProductId =
  | 'frame'       // 画框/屏风（平面，最简单）
  | 'scarf'       // 丝巾/方巾（平面+微悬垂感）
  | 'phone-case'  // 手机壳（扁平矩形体）
  | 'fan'         // 扇面（半圆扇形）
  | 'tea-cup'     // 茶杯/陶瓷（旋转体）
  | 'tshirt'      // T恤展开图（平面）

export interface ProductConfig {
  id: ProductId
  name: string           // 中文名
  nameEn: string         // 英文名（用于标签）
  icon: string           // Material Symbol icon name
  description: string    // 简短描述
  /** 是否在 MVP 阶段显示（false = 即将推出） */
  available: boolean
}

// ── 纹样预设 ──────────────────────────────────────────────────────────────

export type PatternCategory =
  | '楚文化'
  | '丝绸工艺'
  | '漆器纹样'
  | '织锦图案'
  | '印染工艺'
  | '当代创意'

export interface PatternPreset {
  id: string
  name: string
  category: PatternCategory
  /** 程序化生成纹理的配置参数 */
  generatorConfig: PatternGeneratorConfig
  /** 推荐底色（hex） */
  suggestedBaseColor: string
  /** 纹样色板（hex[]，2-4色） */
  palette: string[]
}

export interface PatternGeneratorConfig {
  type: 'geometric' | 'floral' | 'wave' | 'cloud' | 'dragon' | 'phoenix'
  primaryColor: string    // hex
  secondaryColor: string  // hex
  backgroundColor: string // hex（透明时为 'transparent'）
  lineWidth: number       // 1-8
  density: number         // 1-10
  /** 附加风格修饰符 */
  style?: 'bold' | 'delicate' | 'minimal'
}

// ── 参数调节 ──────────────────────────────────────────────────────────────

export type TilingMode = 'single' | 'repeat' | 'mirror'

export type CameraPreset = 'front' | 'side' | 'top' | 'free'

export interface TextureParams {
  scale: number      // 10-300，默认 100（等比缩放%）
  rotation: number   // 0-360，默认 0（度）
  offsetX: number    // -50 to 50，默认 0（%）
  offsetY: number    // -50 to 50，默认 0（%）
  opacity: number    // 0-100，默认 85
  tiling: TilingMode
}

export interface MaterialParams {
  baseColor: string    // hex，产品底色
  roughness: number    // 0-100，默认 60（材质粗糙度）
  metalness: number    // 0-100，默认 0（金属感）
}

// ── 完整创作状态快照（用于导出/保存） ─────────────────────────────────────

export interface CreationSnapshot {
  productId: ProductId
  patternId: string
  textureParams: TextureParams
  materialParams: MaterialParams
  createdAt: string
}

// ── 常量 ──────────────────────────────────────────────────────────────────

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
  roughness: 60,
  metalness: 0,
}
```

---

## Step 3：创建程序化纹理数据

**文件路径：** `src/lib/textures/patternPresets.ts`

```typescript
/**
 * 纹样预设数据
 * 使用项目 mock 数据 (src/data/mock/patterns.ts) 中的配色，
 * 确保风格一致性。
 *
 * 注意：纹样的实际图案由 generatePattern.ts 程序化生成，
 * 这里只定义配置参数。
 */
import type { PatternPreset } from '@/types/create'

export const PATTERN_PRESETS: PatternPreset[] = [
  {
    id: 'phoenix-cloud',
    name: '凤鸟云纹',
    category: '楚文化',
    generatorConfig: {
      type: 'phoenix',
      primaryColor: '#c9a84c',
      secondaryColor: '#b84a39',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 5,
      style: 'bold',
    },
    suggestedBaseColor: '#2a1f0e',
    palette: ['#c9a84c', '#b84a39', '#2a1f0e'],
  },
  {
    id: 'geometric-weave',
    name: '西兰卡普几何',
    category: '织锦图案',
    generatorConfig: {
      type: 'geometric',
      primaryColor: '#1e3a8a',
      secondaryColor: '#ffffff',
      backgroundColor: 'transparent',
      lineWidth: 3,
      density: 8,
      style: 'bold',
    },
    suggestedBaseColor: '#1e3a8a',
    palette: ['#1e3a8a', '#ffffff', '#c9a84c'],
  },
  {
    id: 'flowing-cloud',
    name: '汉代流云纹',
    category: '漆器纹样',
    generatorConfig: {
      type: 'cloud',
      primaryColor: '#c9a84c',
      secondaryColor: '#f5f0e8',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 4,
      style: 'delicate',
    },
    suggestedBaseColor: '#1a1a14',
    palette: ['#c9a84c', '#f5f0e8', '#1a1a14'],
  },
  {
    id: 'peony-embroidery',
    name: '刺绣牡丹',
    category: '丝绸工艺',
    generatorConfig: {
      type: 'floral',
      primaryColor: '#b84a39',
      secondaryColor: '#c9a84c',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 5,
      style: 'delicate',
    },
    suggestedBaseColor: '#f5f0e8',
    palette: ['#b84a39', '#c9a84c', '#f5f0e8'],
  },
  {
    id: 'indigo-print',
    name: '天门蓝印花',
    category: '印染工艺',
    generatorConfig: {
      type: 'floral',
      primaryColor: '#1e3a8a',
      secondaryColor: '#ffffff',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 6,
      style: 'minimal',
    },
    suggestedBaseColor: '#1e3a8a',
    palette: ['#1e3a8a', '#ffffff'],
  },
  {
    id: 'lacquer-beast',
    name: '楚漆神兽纹',
    category: '漆器纹样',
    generatorConfig: {
      type: 'dragon',
      primaryColor: '#c9a84c',
      secondaryColor: '#b84a39',
      backgroundColor: 'transparent',
      lineWidth: 3,
      density: 3,
      style: 'bold',
    },
    suggestedBaseColor: '#1a1a14',
    palette: ['#c9a84c', '#b84a39', '#1a1a14'],
  },
  {
    id: 'wave-pattern',
    name: '水波纹',
    category: '当代创意',
    generatorConfig: {
      type: 'wave',
      primaryColor: '#4a6b8a',
      secondaryColor: '#c9a84c',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 7,
      style: 'delicate',
    },
    suggestedBaseColor: '#f5f0e8',
    palette: ['#4a6b8a', '#c9a84c'],
  },
  {
    id: 'diamond-grid',
    name: '万字回纹',
    category: '楚文化',
    generatorConfig: {
      type: 'geometric',
      primaryColor: '#b84a39',
      secondaryColor: '#c9a84c',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 9,
      style: 'minimal',
    },
    suggestedBaseColor: '#f5f0e8',
    palette: ['#b84a39', '#c9a84c', '#f5f0e8'],
  },
]

/** 按分类聚合 */
export function getPatternsByCategory(category: string): PatternPreset[] {
  return PATTERN_PRESETS.filter(p => p.category === category)
}

/** 所有分类列表 */
export const PATTERN_CATEGORIES = [
  '全部',
  '楚文化',
  '丝绸工艺',
  '漆器纹样',
  '织锦图案',
  '印染工艺',
  '当代创意',
] as const
```

---

## Step 4：创建产品配置数据

**文件路径：** `src/lib/textures/productConfigs.ts`

```typescript
/**
 * 文创产品配置
 * 定义所有可选产品的元数据，产品的 3D 几何体在 Round 2 中实现。
 */
import type { ProductConfig } from '@/types/create'

export const PRODUCT_CONFIGS: ProductConfig[] = [
  {
    id: 'frame',
    name: '画框',
    nameEn: 'Frame',
    icon: 'crop_square',
    description: '展示传统纹样之美',
    available: true,
  },
  {
    id: 'scarf',
    name: '丝巾',
    nameEn: 'Scarf',
    icon: 'style',
    description: '精致典雅的纹样丝巾',
    available: true,
  },
  {
    id: 'phone-case',
    name: '手机壳',
    nameEn: 'Phone Case',
    icon: 'smartphone',
    description: '将传统带入日常',
    available: true,
  },
  {
    id: 'fan',
    name: '折扇',
    nameEn: 'Fan',
    icon: 'flare',
    description: '楚风雅韵折扇',
    available: true,
  },
  {
    id: 'tea-cup',
    name: '茶杯',
    nameEn: 'Tea Cup',
    icon: 'coffee',
    description: '陶瓷茶盏',
    available: true,
  },
  {
    id: 'tshirt',
    name: 'T恤',
    nameEn: 'T-Shirt',
    icon: 'checkroom',
    description: '纹样潮流服饰',
    available: true,
  },
]
```

---

## Step 5：创建 Zustand Store

**文件路径：** `src/stores/useCreateStore.ts`

```typescript
/**
 * 创作中心状态管理
 * 遵循现有 useAuthStore 的 Zustand 5.x 模式
 */
import { create } from 'zustand'
import {
  type ProductId,
  type PatternPreset,
  type TextureParams,
  type MaterialParams,
  type CameraPreset,
  DEFAULT_TEXTURE_PARAMS,
  DEFAULT_MATERIAL_PARAMS,
} from '@/types/create'
import { PATTERN_PRESETS } from '@/lib/textures/patternPresets'

interface CreateState {
  // ── 产品 ────────────────────────────────────────────────
  selectedProduct: ProductId
  setProduct: (product: ProductId) => void

  // ── 纹样 ────────────────────────────────────────────────
  selectedPattern: PatternPreset | null
  setPattern: (pattern: PatternPreset | null) => void

  // ── 参数 ────────────────────────────────────────────────
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

  // ── 视角 ────────────────────────────────────────────────
  cameraPreset: CameraPreset
  setCameraPreset: (preset: CameraPreset) => void

  // ── 纹样分类筛选 ─────────────────────────────────────────
  activeCategory: string
  setActiveCategory: (category: string) => void

  // ── 导出状态 ─────────────────────────────────────────────
  isExporting: boolean
  setIsExporting: (v: boolean) => void
}

export const useCreateStore = create<CreateState>((set) => ({
  // 默认选画框（最简单），默认选第一个纹样
  selectedProduct: 'frame',
  setProduct: (product) =>
    set({
      selectedProduct: product,
      // 切换产品时重置参数
      textureParams: DEFAULT_TEXTURE_PARAMS,
      materialParams: DEFAULT_MATERIAL_PARAMS,
    }),

  selectedPattern: PATTERN_PRESETS[0] ?? null,
  setPattern: (pattern) =>
    set((state) => ({
      selectedPattern: pattern,
      // 应用纹样推荐底色
      materialParams: pattern
        ? { ...state.materialParams, baseColor: pattern.suggestedBaseColor }
        : state.materialParams,
    })),

  textureParams: DEFAULT_TEXTURE_PARAMS,
  setTextureParam: (key, value) =>
    set((state) => ({
      textureParams: { ...state.textureParams, [key]: value },
    })),
  resetTextureParams: () => set({ textureParams: DEFAULT_TEXTURE_PARAMS }),

  materialParams: {
    ...DEFAULT_MATERIAL_PARAMS,
    baseColor: PATTERN_PRESETS[0]?.suggestedBaseColor ?? DEFAULT_MATERIAL_PARAMS.baseColor,
  },
  setMaterialParam: (key, value) =>
    set((state) => ({
      materialParams: { ...state.materialParams, [key]: value },
    })),

  cameraPreset: 'front',
  setCameraPreset: (preset) => set({ cameraPreset: preset }),

  activeCategory: '全部',
  setActiveCategory: (category) => set({ activeCategory: category }),

  isExporting: false,
  setIsExporting: (v) => set({ isExporting: v }),
}))
```

---

## Step 6：创建目录结构（空文件占位）

执行以下命令创建后续轮次需要的目录：

```bash
# 使用 mkdir 创建目录（Windows）
mkdir "src\components\create"
mkdir "src\components\create\models"
mkdir "src\lib\textures"
```

---

## 验证步骤

```bash
npm run build
npm run lint
```

期望输出：
- build: 无 TS 错误
- lint: `lint-guards: OK`，无 ESLint 警告

---

## 本轮产出文件清单

| 文件 | 状态 |
|------|------|
| `src/types/create.ts` | 新建 |
| `src/lib/textures/patternPresets.ts` | 新建 |
| `src/lib/textures/productConfigs.ts` | 新建 |
| `src/stores/useCreateStore.ts` | 新建 |
| `src/components/create/` | 新建目录 |
| `src/components/create/models/` | 新建目录 |

**不修改任何现有文件。**

---

**下一步：执行 Round 2 (`02-3d-viewport-models.md`)**
