# 跨界创作工坊 — 纹样深度再创作系统

## 项目概述

将现有的 `/workshop` 静态 mockup（164 行纯占位代码）升级为**纹样深度再创作平台**——
用户从真实 Supabase 纹样库中选择纹样素材，通过 Canvas 2D 绘制引擎进行
色彩调节、元素重组、对称变换、图层叠加等操作，生成全新的纹样设计稿。

**与 `/create`（AI 创作中心）的核心区别：**

| 维度 | `/create` AI 创作中心 | `/workshop` 跨界工坊 |
|------|---------------------|---------------------|
| 核心能力 | 3D 产品预览 + 纹样贴图 | 2D 纹样深度再创作 + Canvas 绘制 |
| 纹样来源 | 程序化生成（generatorConfig） | **真实 Supabase 纹样图片** |
| 交互方式 | 参数滑块控制贴图属性 | 画布直接绘制 + 工具箱 |
| 产出物 | 3D 产品效果图 (PNG) | 新纹样设计稿 (PNG/SVG) |
| 技术栈 | React Three Fiber + Three.js | **Canvas 2D API + 图层系统** |

**核心用户流程：**
```
浏览真实纹样库 → 选择纹样素材 → 加载到画布 →
调色/变换/对称/叠加 → 实时预览 → 导出高清设计稿
```

---

## 当前状态深度诊断

### 现有代码 Bug 清单（共 10 个）

| # | 类型 | 位置 | 描述 | 严重度 |
|---|------|------|------|--------|
| B1 | **lint违规** | L55 | `style={{ backgroundColor: '#8B4513' }}` — inline style 违反 lint-guards | 🔴 构建阻断 |
| B2 | **非法色值** | L36 | `bg-[#fbfbf8]` — 硬编码 hex 颜色，应用 `bg-rice` | 🟡 规范违反 |
| B3 | **非法色值** | L44 | `bg-[#f4f1ea]` — 同上，应用 `bg-rice-warm` | 🟡 规范违反 |
| B4 | **非项目色** | L73 | `bg-slate-200`, `hover:bg-slate-300` — 使用通用 Tailwind 色非项目 token | 🟡 规范违反 |
| B5 | **无效类名** | L54 | `bg-gradient-radial` — Tailwind 无此类名，需自定义或替换 | 🔴 渲染失败 |
| B6 | **假数据** | L11-19 | 分类 `'敦煌艺术', '故宫典藏'` 与湖北纹案无关 | 🟡 内容错误 |
| B7 | **假数据** | L13-19 | 纹样列表硬编码，无真实数据源 | 🔴 核心缺陷 |
| B8 | **假选中** | L14 | `selected: true` 硬编码，无状态管理 | 🔴 交互失效 |
| B9 | **非法输入** | L111 | `border-none` 移除了 focus 可见边框，影响无障碍 | 🟡 可访问性 |
| B10 | **无响应式** | L99 | `w-96` 固定侧栏，移动端溢出 | 🟡 适配缺陷 |

### 功能缺失清单

| # | 缺失功能 | 现状 |
|---|---------|------|
| F1 | 真实纹样加载 | 占位色块，无 Supabase 数据 |
| F2 | Canvas 绘制引擎 | 中央区域仅一个着色 div |
| F3 | 纹样选中/切换 | 点击无反应 |
| F4 | 参数实际绑定 | 滑块值不影响任何渲染 |
| F5 | 搜索功能 | 搜索框为装饰性 |
| F6 | 导出功能 | 按钮仅有 TODO 注释 |
| F7 | 图层系统 | 无 |
| F8 | 历史记录 (Undo/Redo) | 无 |
| F9 | 对称工具 | 无 |
| F10 | 色彩调节 | 无 |

---

## 技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| Canvas 2D API | 原生 | 核心绘制引擎，图层合成 |
| Supabase Client | 已有 (`@supabase/ssr`) | 真实纹样数据获取 |
| TanStack Query | 已有 (`^5.96`) | 客户端数据缓存与加载状态 |
| Zustand | 已有 (`^5.0`) | 工坊状态管理 |
| Motion | 已有 (`^12.38`) | 面板动画过渡 |
| Tailwind CSS v4 | 已有 | 样式系统 |

**为什么不用第三方 Canvas 库（Fabric.js/Konva.js）？**
- 项目只需**有限的 Canvas 操作**（加载图片、变换、混合、导出），不需要完整矢量编辑器
- 原生 Canvas 2D API 零依赖、零打包体积
- 保持与项目"最小依赖"原则一致
- 若后续需要复杂矢量编辑，可渐进引入 Konva

---

## 轮次划分总览

| 轮次 | 文档 | 内容 | 预估复杂度 |
|------|------|------|-----------|
| **Round 1** | `01-store-types-bugfix.md` | 类型定义 + Store + **Bug 修复** | ⭐⭐ |
| **Round 2** | `02-pattern-data-panel.md` | 真实 Supabase 纹样面板 + 搜索/筛选 | ⭐⭐⭐ |
| **Round 3** | `03-canvas-engine.md` | Canvas 2D 绘制引擎 + 图层系统 | ⭐⭐⭐⭐⭐ |
| **Round 4** | `04-tools-transforms.md` | 工具箱 — 色彩/变换/对称/混合 | ⭐⭐⭐⭐ |
| **Round 5** | `05-page-integration.md` | 完整页面集成 + 参数面板 | ⭐⭐⭐ |
| **Round 6** | `06-export-history-polish.md` | 导出 + Undo/Redo + 动画 + 移动端 | ⭐⭐⭐ |

---

## 文件结构规划

```
src/
├── app/(main)/workshop/
│   ├── page.tsx                       # 主页面（重写）
│   └── layout.tsx                     # 保持 metadata
├── components/
│   └── workshop/                      # 新建目录
│       ├── WorkshopCanvas.tsx         # Canvas 2D 绘制引擎
│       ├── CanvasRenderer.ts          # Canvas 渲染核心（纯逻辑）
│       ├── LayerPanel.tsx             # 图层管理面板
│       ├── PatternAssetPanel.tsx      # 纹样素材面板（Supabase 真实数据）
│       ├── PatternAssetCard.tsx       # 素材卡片（含真实缩略图）
│       ├── ToolBar.tsx                # 左侧工具栏
│       ├── AdjustPanel.tsx            # 调色/变换参数面板
│       ├── SymmetryControls.tsx       # 对称工具控件
│       ├── ExportDialog.tsx           # 导出对话框
│       └── WorkshopMobileBar.tsx      # 移动端底部导航
├── stores/
│   └── useWorkshopStore.ts            # 工坊状态管理
├── hooks/
│   ├── queries/
│   │   └── useWorkshopPatterns.ts     # 纹样素材查询 Hook
│   └── useCanvasHistory.ts            # Undo/Redo Hook
├── lib/
│   └── workshop/                      # 新建目录
│       ├── canvasEngine.ts            # Canvas 渲染引擎核心
│       ├── layerCompositor.ts         # 图层合成器
│       ├── colorAdjust.ts             # 色彩调节算法
│       ├── symmetry.ts                # 对称变换算法
│       └── exportUtils.ts             # 导出工具函数
└── types/
    └── workshop.ts                    # 工坊相关类型
```

---

## 状态管理设计

```typescript
interface WorkshopStore {
  // ── 画布 ────────────────────────────────────────────────
  canvasSize: { width: number; height: number }
  setCanvasSize: (size: { width: number; height: number }) => void
  zoom: number          // 0.1 - 5.0, default 1.0
  setZoom: (zoom: number) => void
  panOffset: { x: number; y: number }

  // ── 图层 ────────────────────────────────────────────────
  layers: WorkshopLayer[]
  activeLayerId: string | null
  addLayer: (layer: Omit<WorkshopLayer, 'id'>) => void
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<WorkshopLayer>) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  setActiveLayer: (id: string | null) => void

  // ── 当前选中的源纹样 ──────────────────────────────────────
  selectedSourcePattern: PatternListItem | null
  setSelectedSourcePattern: (p: PatternListItem | null) => void

  // ── 工具 ────────────────────────────────────────────────
  activeTool: WorkshopTool
  setActiveTool: (tool: WorkshopTool) => void

  // ── 色彩调节 ────────────────────────────────────────────
  colorAdjust: ColorAdjustParams
  setColorAdjust: <K extends keyof ColorAdjustParams>(key: K, value: ColorAdjustParams[K]) => void
  resetColorAdjust: () => void

  // ── 对称设置 ────────────────────────────────────────────
  symmetry: SymmetryConfig
  setSymmetry: (config: Partial<SymmetryConfig>) => void

  // ── 导出 ────────────────────────────────────────────────
  isExporting: boolean
  setIsExporting: (v: boolean) => void

  // ── 纹样筛选 ────────────────────────────────────────────
  patternSearchQuery: string
  setPatternSearchQuery: (q: string) => void
  patternFilterEra: string | null
  setPatternFilterEra: (era: string | null) => void
}
```

---

## 与现有代码的融合策略

| 复用项 | 来源 | 用法 |
|--------|------|------|
| `ParameterSlider` | `@/components/ui` | 色彩/变换参数滑块 |
| `Icon` | `@/components/icons` | 工具栏/面板图标 |
| `SiteHeader` | `@/components/layout` | 顶部导航（`primaryColor="gold"`） |
| `useAuthStore` / `useAuthModal` | `@/stores` | 登录拦截 |
| `getPatterns` | `@/lib/queries.ts` | 首屏 SSR 纹样数据 |
| `usePatterns` | `@/hooks/queries` | 客户端翻页/搜索 |
| `PatternListItem` | `@/types/pattern` | 纹样数据类型 |
| `createClient` (Supabase) | `@/lib/supabase/client` | 客户端图片 URL 加载 |
| `motion/react` | 已安装 | 面板切换动画 |
| `globals.css` token | 已有 | 所有颜色使用 cinnabar/gold/rice/ink |

**数据流：**
```
Server Component (page.tsx)
    ↓ getPatterns() → 首屏 SSR 纹样列表
Client Component (WorkshopClient)
    ↓ usePatterns() → 客户端搜索/翻页/筛选
PatternAssetPanel
    ↓ 用户选中纹样 → setSelectedSourcePattern()
WorkshopCanvas
    ↓ 加载纹样图片到 Canvas → Image → drawImage()
    ↓ 用户操作（调色/变换/对称）→ 实时重绘
ExportDialog
    ↓ canvas.toDataURL() → 下载 PNG/SVG
```

---

## 验收标准

### 功能验收
- [ ] 右侧面板显示 Supabase 真实纹样（含缩略图、名称、时代、地域）
- [ ] 支持按时代/技法筛选 + 关键词搜索 + 翻页
- [ ] 选中纹样后图片加载到中央画布
- [ ] 图层系统：添加/删除/隐藏/排序/透明度
- [ ] 色彩调节：色相/饱和度/亮度/对比度 实时预览
- [ ] 变换工具：缩放/旋转/翻转/偏移
- [ ] 对称工具：轴对称/中心对称/4/6/8 折对称
- [ ] 可导出 PNG 高清图片
- [ ] Undo/Redo 至少支持 30 步
- [ ] 移动端基本可用

### 性能验收
- [ ] 纹样列表首屏 SSR，无加载闪烁
- [ ] 画布操作响应 < 50ms（1024×1024 画布）
- [ ] 图层合成 < 100ms（5 图层内）
- [ ] 内存占用 < 150MB

### 代码质量
- [ ] 所有现有 Bug（B1-B10）已修复
- [ ] TypeScript strict 无报错
- [ ] ESLint + lint-guards 全通过
- [ ] 无 `any` / inline style / console.log
- [ ] 全部使用 `@/` 路径别名

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| Supabase 图片跨域 (CORS) | Supabase Storage 默认允许公开读，`next.config.ts` 已配置 `remotePatterns` |
| 大图片加载性能 | 使用 `thumbnail_url` 做列表展示，选中后才加载 `image_url` 原图 |
| Canvas 2D 在高 DPI 模糊 | 设置 canvas 尺寸为 CSS 尺寸 × devicePixelRatio |
| 复杂图层合成性能 | 使用 OffscreenCanvas 后台合成，结果绘制到主 canvas |
| 移动端触控手势冲突 | Pointer Events API 统一处理鼠标/触控 |

---

## 执行顺序

```
Round 1 → Round 2 → Round 3 → Round 4 → Round 5 → Round 6
   ↓         ↓         ↓         ↓         ↓         ↓
 Bug修复   真实数据    画布引擎   工具箱     集成      收尾
```

---

**下一步：执行 Round 1 (`01-store-types-bugfix.md`)**
