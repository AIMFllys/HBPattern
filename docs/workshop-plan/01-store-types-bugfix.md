# Round 1 — 类型定义 + Store + Bug 全量修复

## 目标
1. 修复 workshop 页面全部 10 个已知 Bug
2. 创建工坊专用类型定义
3. 创建 Zustand Store
4. 确保 `npm run build` 和 `npm run lint` 通过

**本轮不修改功能逻辑，仅做基础设施 + Bug 消除。**

---

## 上下文摘要（执行前必读）

| 项目 | 值 |
|------|------|
| 框架 | Next.js 16.2.1 (App Router, Turbopack) |
| React | 19.2.4 |
| 状态管理 | Zustand 5.x（已有 `useAuthStore`, `useAuthModal`, `useCreateStore`） |
| 样式 | Tailwind CSS v4，token 在 `globals.css` 的 `@theme inline` 块 |
| lint-guards | 5 项检查（禁止 dynamic Tailwind aspect、min-screen 拼写、inline Zod、mock 导入、inline footer） |
| 关键补充 | lint-guards **不检查** inline style（`style=`），但项目规范明确禁止 |
| Supabase 数据 | `hp_patterns` 表含 name, era, region, technique, image_url, thumbnail_url, color_palette, media[] |
| 查询层 | `src/lib/queries.ts` 用 Supabase client，`usePatterns` 用 React Query |
| 色彩 token | cinnabar(#b84a39), gold(#c9a84c), rice(#f5f0e8), rice-warm(#ede7d9), rice-deep(#d6ccba), ink(#1a1a14), ink-medium(#3d3d30), ink-light(#6b6b58), ink-faint(#9e9e88) |

---

## Step 1：修复全部 Bug

### Bug B1 — inline style 违规 (L55)

**文件：** `src/app/(main)/workshop/page.tsx` L55

```diff
- <div className="relative z-10 w-full h-full bg-contain bg-center bg-no-repeat drop-shadow-2xl transform hover:scale-105 transition-transform duration-700" style={{ backgroundColor: '#8B4513' }}></div>
+ <div className="relative z-10 w-full h-full bg-contain bg-center bg-no-repeat drop-shadow-2xl transform hover:scale-105 transition-transform duration-700 bg-amber-900"></div>
```

> 注：`#8B4513` (SaddleBrown) 最接近 Tailwind 的 `amber-900` (#78350f) 或 `bg-[#8B4513]`。
> 但更优方案是使用项目 token，中央画布区域后续将被 Canvas 组件替换。
> 临时修复使用 Tailwind 任意值 class：`bg-[#8B4513]`

**最终修复方案：** 中央区域改为占位提示（不需要特定颜色背景）：

```diff
- <div className="relative z-10 w-full h-full bg-contain bg-center bg-no-repeat drop-shadow-2xl transform hover:scale-105 transition-transform duration-700" style={{ backgroundColor: '#8B4513' }}></div>
+ <div className="relative z-10 w-full h-full flex items-center justify-center bg-rice-warm rounded-2xl shadow-lg border border-rice-deep">
+   <div className="text-center">
+     <Icon name="brush" size={48} className="text-gold/40 mx-auto mb-3" />
+     <p className="text-ink-faint text-sm font-bold">画布加载中…</p>
+     <p className="text-ink-faint/60 text-xs mt-1">选择右侧纹样开始创作</p>
+   </div>
+ </div>
```

---

### Bug B2 — 硬编码 hex 背景色 (L36)

```diff
- <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#fbfbf8]">
+ <div className="relative flex h-screen w-full flex-col overflow-hidden bg-rice">
```

---

### Bug B3 — 硬编码 hex 背景色 (L44)

```diff
- <div className="flex-1 relative flex flex-col items-center justify-center p-12 bg-[#f4f1ea]">
+ <div className="flex-1 relative flex flex-col items-center justify-center p-12 bg-rice-warm">
```

---

### Bug B4 — 非项目色 slate (L73)

```diff
- <button className="px-4 py-1.5 bg-slate-200 text-ink-medium text-xs font-bold rounded-lg hover:bg-slate-300 transition-all">重置</button>
+ <button className="px-4 py-1.5 bg-rice-warm text-ink-medium text-xs font-bold rounded-lg hover:bg-rice-deep transition-all">重置</button>
```

---

### Bug B5 — 无效 Tailwind 类名 bg-gradient-radial (L54)

```diff
- <div className="absolute inset-0 bg-gradient-radial from-white/60 to-transparent rounded-full blur-3xl opacity-50"></div>
+ <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.6)_0%,_transparent_70%)] rounded-full blur-3xl opacity-50"></div>
```

> 使用 Tailwind 任意值语法实现径向渐变。
> 或更简洁方案：直接移除此装饰性元素（后续被 Canvas 替换时不需要）。

**最终方案：** 移除此装饰 div（Round 5 中央区域将被 Canvas 完全替代）。

---

### Bug B6 — 错误的分类名称 (L11)

```diff
- const categories = ['楚式纹样', '敦煌艺术', '故宫典藏', '现代简约']
+ const categories = ['全部', '楚文化', '织锦工艺', '漆器纹样', '刺绣工艺', '印染工艺', '当代创意']
```

> 使用与 Supabase `hp_categories` 表一致的分类体系。
> Round 2 中将改为从 API 动态获取。

---

### Bug B7 — 硬编码假纹样列表 (L13-19)

临时修复：标注为占位数据，添加类型注释，Round 2 中替换为真实数据。

```diff
- const patternLibrary = [
-   { id: 1, name: '凤鸟云纹', selected: true },
-   ...
- ]
+ // TODO(Round 2): 替换为 Supabase 真实数据
+ const PLACEHOLDER_PATTERNS = [
+   { id: '1', name: '凤鸟云纹' },
+   { id: '2', name: '西兰卡普几何纹' },
+   { id: '3', name: '汉代流云纹' },
+   { id: '4', name: '刺绣牡丹' },
+   { id: '5', name: '天门蓝印花' },
+   { id: '6', name: '楚漆神兽纹' },
+ ]
```

---

### Bug B8 — 硬编码 selected (L14)

移除硬编码 `selected` 属性，使用 `useState` 管理选中状态：

```diff
+ const [selectedPatternId, setSelectedPatternId] = useState<string | null>('1')
  ...
- pattern.selected ? 'border-gold bg-gold/5' : ...
+ selectedPatternId === pattern.id ? 'border-gold bg-gold/5' : ...
```

---

### Bug B9 — 搜索框 border-none (L111)

```diff
- <input className="w-full pl-9 pr-4 py-2 bg-rice border-none rounded-lg text-sm focus:ring-1 focus:ring-gold/50" ...>
+ <input className="w-full pl-9 pr-4 py-2 bg-rice-warm border border-rice-deep rounded-lg text-sm focus:ring-1 focus:ring-gold/30 focus:border-gold/30" ...>
```

---

### Bug B10 — 固定侧栏无响应式 (L99)

```diff
- <aside className="w-96 bg-white border-l border-rice-deep/50 flex flex-col">
+ <aside className="w-80 lg:w-96 bg-white border-l border-rice-deep/50 flex flex-col hidden lg:flex">
```

> 移动端隐藏侧栏（Round 6 中实现底部 Sheet 方案）。

---

## Step 2：创建工坊类型定义

**文件路径：** `src/types/workshop.ts`

```typescript
/**
 * 跨界创作工坊 — 类型定义
 * Canvas 2D 绘制引擎相关类型。
 */

// ── 工具 ──────────────────────────────────────────────────────────────────

export type WorkshopTool =
  | 'select'       // 选择/移动图层
  | 'pan'          // 平移画布
  | 'zoom'         // 缩放画布
  | 'transform'    // 变换选中图层（缩放/旋转）
  | 'color'        // 调色工具
  | 'symmetry'     // 对称工具
  | 'eraser'       // 擦除（将图层区域设为透明）

// ── 图层 ──────────────────────────────────────────────────────────────────

export interface WorkshopLayer {
  id: string
  name: string
  type: 'pattern' | 'color-fill' | 'adjustment'
  visible: boolean
  locked: boolean
  opacity: number           // 0-100
  blendMode: CanvasBlendMode
  /** 纹样图层的源图片 URL (来自 Supabase hp_patterns.image_url) */
  sourceImageUrl?: string
  /** 纹样来源信息（可选，用于显示） */
  sourcePatternId?: string
  sourcePatternName?: string
  /** 变换参数 */
  transform: LayerTransform
  /** 色彩调节（仅对此图层） */
  colorAdjust: ColorAdjustParams
  /** 缓存的 ImageBitmap，运行时填充 */
  _cachedBitmap?: ImageBitmap
}

export interface LayerTransform {
  x: number           // 画布坐标偏移
  y: number
  scaleX: number      // 1.0 = 原始大小
  scaleY: number
  rotation: number    // 弧度
  flipH: boolean      // 水平翻转
  flipV: boolean      // 垂直翻转
}

// ── Canvas 混合模式 ─────────────────────────────────────────────────────

export type CanvasBlendMode =
  | 'source-over'     // 正常
  | 'multiply'        // 正片叠底
  | 'screen'          // 滤色
  | 'overlay'         // 叠加
  | 'darken'          // 变暗
  | 'lighten'         // 变亮
  | 'color-dodge'     // 颜色减淡
  | 'color-burn'      // 颜色加深
  | 'hard-light'      // 强光
  | 'soft-light'      // 柔光
  | 'difference'      // 差值
  | 'exclusion'       // 排除

// ── 色彩调节 ──────────────────────────────────────────────────────────────

export interface ColorAdjustParams {
  hue: number           // -180 ~ 180, 色相偏移
  saturation: number    // -100 ~ 100, 饱和度偏移
  brightness: number    // -100 ~ 100, 亮度偏移
  contrast: number      // -100 ~ 100, 对比度偏移
  temperature: number   // -50 ~ 50, 色温（冷暖）
  tint: string | null   // hex 染色覆盖（null = 不染色）
}

// ── 对称 ──────────────────────────────────────────────────────────────────

export type SymmetryType =
  | 'none'            // 无对称
  | 'horizontal'      // 水平轴对称
  | 'vertical'        // 垂直轴对称
  | 'both'            // 双轴对称
  | 'radial-4'        // 4 折旋转对称
  | 'radial-6'        // 6 折旋转对称（雪花/蜂巢）
  | 'radial-8'        // 8 折旋转对称

export interface SymmetryConfig {
  type: SymmetryType
  centerX: number     // 对称中心 X（0-1 归一化）
  centerY: number     // 对称中心 Y（0-1 归一化）
  showGuides: boolean // 是否显示对称辅助线
}

// ── 画布尺寸预设 ─────────────────────────────────────────────────────────

export interface CanvasPreset {
  id: string
  name: string
  width: number
  height: number
  description: string
}

// ── 历史记录 ──────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string
  timestamp: number
  description: string
  /** 操作前的图层快照 (JSON 可序列化部分) */
  layersSnapshot: SerializableLayer[]
}

/** 图层的可序列化版本（去除 _cachedBitmap） */
export type SerializableLayer = Omit<WorkshopLayer, '_cachedBitmap'>

// ── 导出配置 ──────────────────────────────────────────────────────────────

export type ExportFormat = 'png' | 'jpeg' | 'webp'

export interface ExportConfig {
  format: ExportFormat
  quality: number      // 0.1-1.0 (JPEG/WebP)
  scale: number        // 1x, 2x, 4x
  includeBackground: boolean
}

// ── 常量 ──────────────────────────────────────────────────────────────────

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
  'multiply': '正片叠底',
  'screen': '滤色',
  'overlay': '叠加',
  'darken': '变暗',
  'lighten': '变亮',
  'color-dodge': '颜色减淡',
  'color-burn': '颜色加深',
  'hard-light': '强光',
  'soft-light': '柔光',
  'difference': '差值',
  'exclusion': '排除',
}
```

---

## Step 3：创建 Zustand Store

**文件路径：** `src/stores/useWorkshopStore.ts`

```typescript
/**
 * 跨界工坊状态管理
 * 遵循现有 useAuthStore / useCreateStore 的 Zustand 5.x 模式
 */
import { create } from 'zustand'
import type {
  WorkshopTool,
  WorkshopLayer,
  ColorAdjustParams,
  SymmetryConfig,
  CanvasBlendMode,
  DEFAULT_COLOR_ADJUST,
  DEFAULT_LAYER_TRANSFORM,
  DEFAULT_SYMMETRY,
} from '@/types/workshop'
import {
  DEFAULT_COLOR_ADJUST as DEFAULT_CA,
  DEFAULT_LAYER_TRANSFORM as DEFAULT_LT,
  DEFAULT_SYMMETRY as DEFAULT_SYM,
} from '@/types/workshop'
import type { PatternListItem } from '@/types/pattern'

interface WorkshopState {
  // ── 画布 ────────────────────────────────────────────────
  canvasSize: { width: number; height: number }
  setCanvasSize: (size: { width: number; height: number }) => void
  zoom: number
  setZoom: (zoom: number) => void
  panOffset: { x: number; y: number }
  setPanOffset: (offset: { x: number; y: number }) => void

  // ── 图层 ────────────────────────────────────────────────
  layers: WorkshopLayer[]
  activeLayerId: string | null
  addLayer: (layer: Omit<WorkshopLayer, 'id'>) => void
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<WorkshopLayer>) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  setActiveLayer: (id: string | null) => void

  // ── 源纹样 ──────────────────────────────────────────────
  selectedSourcePattern: PatternListItem | null
  setSelectedSourcePattern: (p: PatternListItem | null) => void

  // ── 工具 ────────────────────────────────────────────────
  activeTool: WorkshopTool
  setActiveTool: (tool: WorkshopTool) => void

  // ── 色彩调节 ────────────────────────────────────────────
  colorAdjust: ColorAdjustParams
  setColorAdjust: <K extends keyof ColorAdjustParams>(key: K, value: ColorAdjustParams[K]) => void
  resetColorAdjust: () => void

  // ── 对称 ────────────────────────────────────────────────
  symmetry: SymmetryConfig
  setSymmetry: (config: Partial<SymmetryConfig>) => void

  // ── 导出 ────────────────────────────────────────────────
  isExporting: boolean
  setIsExporting: (v: boolean) => void

  // ── 搜索筛选 ────────────────────────────────────────────
  patternSearchQuery: string
  setPatternSearchQuery: (q: string) => void
  patternFilterEra: string | null
  setPatternFilterEra: (era: string | null) => void
}

let layerIdCounter = 0
function generateLayerId(): string {
  layerIdCounter += 1
  return `layer-${Date.now()}-${layerIdCounter}`
}

export const useWorkshopStore = create<WorkshopState>((set) => ({
  // 默认 1024×1024 方形画布
  canvasSize: { width: 1024, height: 1024 },
  setCanvasSize: (size) => set({ canvasSize: size }),

  zoom: 1.0,
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5.0, zoom)) }),

  panOffset: { x: 0, y: 0 },
  setPanOffset: (offset) => set({ panOffset: offset }),

  // 初始包含一个背景图层
  layers: [
    {
      id: 'bg-default',
      name: '背景',
      type: 'color-fill',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'source-over',
      transform: { ...DEFAULT_LT },
      colorAdjust: { ...DEFAULT_CA },
    },
  ],
  activeLayerId: 'bg-default',

  addLayer: (layerData) => {
    const id = generateLayerId()
    set((state) => ({
      layers: [...state.layers, { ...layerData, id }],
      activeLayerId: id,
    }))
  },

  removeLayer: (id) =>
    set((state) => {
      const filtered = state.layers.filter((l) => l.id !== id)
      return {
        layers: filtered,
        activeLayerId:
          state.activeLayerId === id
            ? filtered[filtered.length - 1]?.id ?? null
            : state.activeLayerId,
      }
    }),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const newLayers = [...state.layers]
      const [moved] = newLayers.splice(fromIndex, 1)
      if (moved) newLayers.splice(toIndex, 0, moved)
      return { layers: newLayers }
    }),

  setActiveLayer: (id) => set({ activeLayerId: id }),

  selectedSourcePattern: null,
  setSelectedSourcePattern: (p) => set({ selectedSourcePattern: p }),

  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  colorAdjust: { ...DEFAULT_CA },
  setColorAdjust: (key, value) =>
    set((state) => ({
      colorAdjust: { ...state.colorAdjust, [key]: value },
    })),
  resetColorAdjust: () => set({ colorAdjust: { ...DEFAULT_CA } }),

  symmetry: { ...DEFAULT_SYM },
  setSymmetry: (config) =>
    set((state) => ({
      symmetry: { ...state.symmetry, ...config },
    })),

  isExporting: false,
  setIsExporting: (v) => set({ isExporting: v }),

  patternSearchQuery: '',
  setPatternSearchQuery: (q) => set({ patternSearchQuery: q }),

  patternFilterEra: null,
  setPatternFilterEra: (era) => set({ patternFilterEra: era }),
}))
```

---

## Step 4：创建目录结构

```bash
mkdir "src\components\workshop"
mkdir "src\lib\workshop"
```

---

## 验证步骤

```bash
npm run build     # 无 TS 错误
npm run lint      # 无 ESLint 警告 + lint-guards 通过
```

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/app/(main)/workshop/page.tsx` | **修改** | 修复 B1-B10 全部 Bug |
| `src/types/workshop.ts` | 新建 | 工坊类型定义 |
| `src/stores/useWorkshopStore.ts` | 新建 | 工坊状态管理 |
| `src/components/workshop/` | 新建目录 | 后续组件目录 |
| `src/lib/workshop/` | 新建目录 | 后续工具函数目录 |

---

**下一步：执行 Round 2 (`02-pattern-data-panel.md`)**
