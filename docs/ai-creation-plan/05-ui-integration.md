# Round 5 — 完整页面集成 + 产品选择器 + 参数面板

## 目标
将所有 3D 组件、纹样面板、参数面板、产品选择器集成为完整的创作中心页面，
替换现有 mockup，实现完整的用户交互流程。

**本轮完成后：** `/create` 页面成为完整可交互的 3D 文创预览系统。

---

## 上下文摘要（执行前必读）

| 项目 | 值 |
|------|------|
| 现有 create page | 180 行 mockup，三栏布局（左工具栏+中间3D区+右侧纹样面板+底部参数栏） |
| workshop page | 164 行 mockup，与 create 功能高度重叠 |
| Round 2-4 组件 | Canvas3D, ProductModel, PatternPanel, TexturedMaterial, ColorPicker |
| Store | useCreateStore（全部状态和 action） |
| 已有布局组件 | SiteHeader（支持 logoIcon/siteName/primaryColor props） |
| 已有 UI | ParameterSlider（label/value/onChange/min/max/unit/primaryColor/className） |
| 产品配置 | PRODUCT_CONFIGS 6 个产品，含 id/name/nameEn/icon/description/available |
| 认证模式 | requireAuth(message, action) 使用 useAuthStore + useAuthModal |
| create/layout.tsx | metadata 已设（title: 'AI 创作中心'），passthrough layout |

---

## Step 1：创建产品选择器组件

**文件路径：** `src/components/create/ProductSelector.tsx`

```typescript
'use client'

/**
 * ProductSelector — 文创产品类型选择器
 *
 * 设计：水平滚动的卡片列表，响应式布局。
 * 选中产品高亮 + 底部指示条，切换时触发 store 更新 → 3D 模型切换。
 *
 * 位置：页面顶部（Canvas3D 上方）或左侧工具栏
 */
import { memo, useCallback } from 'react'
import { Icon } from '@/components/icons/Icon'
import { useCreateStore } from '@/stores/useCreateStore'
import { PRODUCT_CONFIGS } from '@/lib/textures/productConfigs'
import type { ProductId } from '@/types/create'

export const ProductSelector = memo(function ProductSelector() {
  const selectedProduct = useCreateStore((s) => s.selectedProduct)
  const setProduct = useCreateStore((s) => s.setProduct)

  const handleSelect = useCallback(
    (id: ProductId) => {
      if (id !== selectedProduct) {
        setProduct(id)
      }
    },
    [selectedProduct, setProduct]
  )

  return (
    <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto custom-scrollbar bg-rice-warm/50 border-b border-rice-deep">
      <span className="text-xs font-bold text-ink-faint uppercase tracking-wider px-2 flex-shrink-0">
        载体
      </span>
      {PRODUCT_CONFIGS.map((product) => {
        const isActive = selectedProduct === product.id
        return (
          <button
            key={product.id}
            id={`product-${product.id}`}
            type="button"
            onClick={() => handleSelect(product.id)}
            disabled={!product.available}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                        whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? 'bg-cinnabar text-white shadow-sm'
                : product.available
                  ? 'text-ink-light hover:bg-rice-warm hover:text-ink-medium'
                  : 'text-ink-faint opacity-50 cursor-not-allowed'
            }`}
            title={product.description}
          >
            <Icon name={product.icon} size={16} />
            {product.name}
          </button>
        )
      })}
    </div>
  )
})
```

---

## Step 2：创建参数面板组件

**文件路径：** `src/components/create/ParameterPanel.tsx`

```typescript
'use client'

/**
 * ParameterPanel — 参数调节面板
 *
 * 整合纹理参数 + 材质参数 + 视角控制 + 操作按钮。
 * 位于 3D 视口下方，水平排列。
 *
 * 复用现有 ParameterSlider 组件，保持视觉一致性。
 */
import { memo, useCallback } from 'react'
import ParameterSlider from '@/components/ui/ParameterSlider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Icon } from '@/components/icons/Icon'
import { useCreateStore } from '@/stores/useCreateStore'
import type { TilingMode, CameraPreset } from '@/types/create'

const TILING_OPTIONS: { value: TilingMode; label: string; icon: string }[] = [
  { value: 'single', label: '单次', icon: 'crop_free' },
  { value: 'repeat', label: '重复', icon: 'grid_on' },
  { value: 'mirror', label: '镜像', icon: 'flip' },
]

const CAMERA_OPTIONS: { value: CameraPreset; label: string; icon: string }[] = [
  { value: 'front', label: '正面', icon: 'crop_portrait' },
  { value: 'side', label: '侧面', icon: 'crop_landscape' },
  { value: 'top', label: '俯视', icon: 'vertical_align_bottom' },
  { value: 'free', label: '自由', icon: '3d_rotation' },
]

export const ParameterPanel = memo(function ParameterPanel() {
  const textureParams = useCreateStore((s) => s.textureParams)
  const materialParams = useCreateStore((s) => s.materialParams)
  const cameraPreset = useCreateStore((s) => s.cameraPreset)
  const setTextureParam = useCreateStore((s) => s.setTextureParam)
  const setMaterialParam = useCreateStore((s) => s.setMaterialParam)
  const setCameraPreset = useCreateStore((s) => s.setCameraPreset)
  const resetTextureParams = useCreateStore((s) => s.resetTextureParams)

  const handleBaseColorChange = useCallback(
    (color: string) => setMaterialParam('baseColor', color),
    [setMaterialParam]
  )

  return (
    <div className="bg-white border-t border-rice-deep">
      {/* 主参数区 */}
      <div className="p-4">
        <div className="flex items-start gap-6">
          {/* 纹理参数 */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ParameterSlider
              label="缩放 SCALE"
              value={textureParams.scale}
              onChange={(v) => setTextureParam('scale', v)}
              min={10}
              max={300}
              unit="%"
            />
            <ParameterSlider
              label="旋转 ROTATION"
              value={textureParams.rotation}
              onChange={(v) => setTextureParam('rotation', v)}
              min={0}
              max={360}
              unit="°"
            />
            <ParameterSlider
              label="透明度 OPACITY"
              value={textureParams.opacity}
              onChange={(v) => setTextureParam('opacity', v)}
              min={0}
              max={100}
              unit="%"
            />
            <ParameterSlider
              label="粗糙度 ROUGH"
              value={materialParams.roughness}
              onChange={(v) => setMaterialParam('roughness', v)}
              min={0}
              max={100}
              unit="%"
            />
          </div>

          {/* 分隔线 */}
          <div className="w-px h-16 bg-rice-deep self-center" />

          {/* 平铺模式 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-faint uppercase tracking-tighter">
              平铺
            </span>
            <div className="flex gap-1">
              {TILING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTextureParam('tiling', opt.value)}
                  className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                    textureParams.tiling === opt.value
                      ? 'bg-cinnabar text-white'
                      : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
                  }`}
                  title={opt.label}
                >
                  <Icon name={opt.icon} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-16 bg-rice-deep self-center" />

          {/* 视角控制 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-faint uppercase tracking-tighter">
              视角
            </span>
            <div className="flex gap-1">
              {CAMERA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCameraPreset(opt.value)}
                  className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                    cameraPreset === opt.value
                      ? 'bg-ink text-white'
                      : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
                  }`}
                  title={opt.label}
                >
                  <Icon name={opt.icon} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-16 bg-rice-deep self-center" />

          {/* 底色选择 + 操作 */}
          <div className="flex flex-col gap-2 min-w-[160px]">
            <ColorPicker
              value={materialParams.baseColor}
              onChange={handleBaseColorChange}
              label="底色 BASE"
            />
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-rice-warm/30 border-t border-rice-deep">
        <button
          type="button"
          onClick={resetTextureParams}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-ink-light
                     hover:text-ink-medium transition-colors"
        >
          <Icon name="restart_alt" size={16} />
          重置参数
        </button>

        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <span>X偏移: {textureParams.offsetX}%</span>
          <span>Y偏移: {textureParams.offsetY}%</span>
        </div>
      </div>
    </div>
  )
})
```

---

## Step 3：创建 3D 视口工具栏（浮动控件）

**文件路径：** `src/components/create/ViewportToolbar.tsx`

```typescript
'use client'

/**
 * ViewportToolbar — 3D 视口内浮动工具栏
 *
 * 覆盖在 Canvas3D 上层，提供快捷操作。
 * 位置：3D 视口右下角，垂直排列。
 *
 * 功能：
 * - 缩放 +/-
 * - 重置视角
 * - 全屏模式（可选）
 */
import { Icon } from '@/components/icons/Icon'
import { useCreateStore } from '@/stores/useCreateStore'

export function ViewportToolbar() {
  const setCameraPreset = useCreateStore((s) => s.setCameraPreset)

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
      <button
        type="button"
        onClick={() => setCameraPreset('front')}
        className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center
                   text-ink-light hover:text-cinnabar hover:shadow-hover transition-all"
        title="重置视角"
      >
        <Icon name="center_focus_strong" size={20} />
      </button>

      <button
        type="button"
        onClick={() => setCameraPreset('free')}
        className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center
                   text-ink-light hover:text-cinnabar hover:shadow-hover transition-all"
        title="自由视角"
      >
        <Icon name="3d_rotation" size={20} />
      </button>
    </div>
  )
}
```

---

## Step 4：创建模型信息浮层

**文件路径：** `src/components/create/ModelInfo.tsx`

```typescript
'use client'

/**
 * ModelInfo — 模型信息浮层
 *
 * 位于 3D 视口左上角，显示当前选中产品 + 纹样信息。
 * 灵感来自现有 create page mockup 的「当前模型」浮层。
 */
import { useCreateStore } from '@/stores/useCreateStore'
import { PRODUCT_CONFIGS } from '@/lib/textures/productConfigs'

export function ModelInfo() {
  const selectedProduct = useCreateStore((s) => s.selectedProduct)
  const selectedPattern = useCreateStore((s) => s.selectedPattern)

  const product = PRODUCT_CONFIGS.find((p) => p.id === selectedProduct)

  return (
    <div className="absolute top-4 left-4 z-10 bg-white/70 backdrop-blur-sm px-4 py-2.5 rounded-lg
                    border border-white/50 shadow-sm">
      <span className="text-xs uppercase tracking-widest text-ink-faint font-bold block">
        当前模型
      </span>
      <p className="text-sm font-bold text-ink">
        {product?.name ?? '未知产品'}
        {selectedPattern && (
          <span className="text-ink-light font-normal"> · {selectedPattern.name}</span>
        )}
      </p>
    </div>
  )
}
```

---

## Step 5：重构 Create 页面主组件

**文件路径：** `src/app/(main)/create/page.tsx`

> 完全重写，替换现有 180 行 mockup。

```typescript
'use client'

/**
 * AI 创作中心 — 3D 文创预览系统
 *
 * 页面布局（全屏无 Footer）：
 * ┌──────────────────────────────────────────────────┐
 * │ SiteHeader                                       │
 * ├──────────────────────────────────────────────────┤
 * │ ProductSelector（产品类型选择）                     │
 * ├────────────────────────────────┬─────────────────┤
 * │                                │                 │
 * │   Canvas3D (3D 视口)           │  PatternPanel    │
 * │   + ModelInfo (左上浮层)        │  (纹样选择面板)   │
 * │   + ViewportToolbar (右下浮层)  │                 │
 * │                                │                 │
 * ├────────────────────────────────┴─────────────────┤
 * │ ParameterPanel（参数调节 + 底色 + 导出）            │
 * └──────────────────────────────────────────────────┘
 *
 * 设计决策：
 * - 保留 SiteHeader 保持全站导航一致性
 * - 无 SiteFooter（与现有 mockup 行为一致，Requirement 8.7）
 * - 3D 视口占据最大空间，flex-1 自适应
 * - 右侧面板固定 320px (w-80)
 * - 底部参数栏固定高度
 */
import dynamic from 'next/dynamic'
import SiteHeader from '@/components/layout/SiteHeader'
import { ProductSelector } from '@/components/create/ProductSelector'
import { PatternPanel } from '@/components/create/PatternPanel'
import { ParameterPanel } from '@/components/create/ParameterPanel'
import { ViewportToolbar } from '@/components/create/ViewportToolbar'
import { ModelInfo } from '@/components/create/ModelInfo'

/**
 * Canvas3D 必须 dynamic import + ssr: false
 * R3F 依赖 WebGL/Canvas 浏览器 API，不可服务端渲染
 */
const Canvas3D = dynamic(
  () => import('@/components/create/Canvas3D'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-rice-cool">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-ink-light">加载 3D 引擎…</span>
        </div>
      </div>
    ),
  }
)

export default function CreatePage() {
  return (
    <div className="min-h-screen flex flex-col bg-rice">
      {/* 顶部导航 */}
      <SiteHeader logoIcon="storm" siteName="AI 创意中心" primaryColor="cinnabar" />

      {/* 产品选择器 */}
      <ProductSelector />

      {/* 主内容区 */}
      <main className="flex flex-1 overflow-hidden">
        {/* 3D 视口 */}
        <section className="flex-1 flex flex-col relative">
          <div className="flex-1 relative">
            <Canvas3D />
            <ModelInfo />
            <ViewportToolbar />
          </div>

          {/* 参数面板 */}
          <ParameterPanel />
        </section>

        {/* 纹样面板 */}
        <PatternPanel />
      </main>
    </div>
  )
}
```

---

## Step 6：处理 Workshop 页面

> 根据需求分析，workshop 与 create 功能高度重叠（~60% 代码重复）。
> 建议合并入 create，workshop 页面改为重定向或功能引导。

**方案 A（推荐）：** Workshop 页面保持不变，后续迭代决定是否合并

```
不修改 workshop/page.tsx，仅确保 create 页面完整可用。
workshop 作为独立入口保留，待产品决策后再处理。
```

**方案 B：** Workshop 重定向到 Create

```typescript
// src/app/(main)/workshop/page.tsx
import { redirect } from 'next/navigation'
export default function WorkshopPage() {
  redirect('/create')
}
```

> 建议选择方案 A，避免影响现有 UI 和导航结构。

---

## Step 7：偏移参数交互增强

当前 offsetX/offsetY 在 ParameterPanel 底部以文字显示。
可选增强：添加 2D 拖拽区域用于直观调节偏移。

**文件路径：** `src/components/create/OffsetPad.tsx`（可选）

```typescript
'use client'

/**
 * OffsetPad — 2D 偏移拖拽控件
 *
 * 一个小的 2D 区域，拖拽圆点调节 offsetX/offsetY。
 * 比两个滑块更直观。
 */
import { useRef, useCallback, useState } from 'react'
import { useCreateStore } from '@/stores/useCreateStore'

export function OffsetPad() {
  const padRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const offsetX = useCreateStore((s) => s.textureParams.offsetX)
  const offsetY = useCreateStore((s) => s.textureParams.offsetY)
  const setTextureParam = useCreateStore((s) => s.setTextureParam)

  const handlePointerDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !padRef.current) return

      const rect = padRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100 - 50  // -50 ~ 50
      const y = -((e.clientY - rect.top) / rect.height) * 100 + 50 // -50 ~ 50

      setTextureParam('offsetX', Math.round(Math.max(-50, Math.min(50, x))))
      setTextureParam('offsetY', Math.round(Math.max(-50, Math.min(50, y))))
    },
    [isDragging, setTextureParam]
  )

  // 圆点位置（CSS 百分比）
  const dotLeft = `${((offsetX + 50) / 100) * 100}%`
  const dotTop = `${((50 - offsetY) / 100) * 100}%`

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-ink-faint uppercase tracking-tighter">
        偏移 OFFSET
      </span>
      <div
        ref={padRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        className="relative w-16 h-16 bg-rice-warm rounded border border-rice-deep cursor-crosshair
                   touch-none select-none"
      >
        {/* 十字参考线 */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-rice-deep" />
        <div className="absolute top-1/2 left-0 h-px w-full bg-rice-deep" />

        {/* 拖拽圆点 — 使用 CSS 变量避免 inline style */}
        <OffsetDot left={dotLeft} top={dotTop} isDragging={isDragging} />
      </div>
      <span className="text-xs text-ink-faint">
        {offsetX}, {offsetY}
      </span>
    </div>
  )
}

/** 偏移圆点 — 使用 ref 设置位置（合规方案） */
import { useRef as useRefForDot, useEffect } from 'react'

function OffsetDot({
  left,
  top,
  isDragging,
}: {
  left: string
  top: string
  isDragging: boolean
}) {
  const ref = useRefForDot<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.left = left
      ref.current.style.top = top
    }
  }, [left, top])

  return (
    <div
      ref={ref}
      className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2
                  transition-shadow ${
        isDragging
          ? 'bg-cinnabar shadow-md shadow-cinnabar/30'
          : 'bg-cinnabar/70 hover:bg-cinnabar'
      }`}
    />
  )
}
```

---

## Step 8：响应式适配

### 桌面端（≥1024px）
```
标准三栏布局：3D 视口 + 右侧面板 + 底部参数
```

### 平板端（768-1023px）
```
右侧面板收窄为 w-64 (256px)
参数面板改为 2 列
```

### 移动端（<768px）
```
面板变为底部抽屉（sheet）
3D 视口全屏
底部 tab 切换：视口 / 纹样 / 参数
```

**移动端适配组件（可选）：**

在 ParameterPanel 和 PatternPanel 外层包裹响应式容器：

```typescript
// 在 CreatePage 中
<main className="flex flex-1 overflow-hidden">
  {/* 桌面端布局 */}
  <section className="flex-1 flex flex-col relative">
    <div className="flex-1 relative">
      <Canvas3D />
      <ModelInfo />
      <ViewportToolbar />
    </div>
    {/* 桌面端参数面板 */}
    <div className="hidden lg:block">
      <ParameterPanel />
    </div>
  </section>

  {/* 桌面端纹样面板 */}
  <div className="hidden lg:flex">
    <PatternPanel />
  </div>

  {/* 移动端底部 Tab（后续迭代实现） */}
</main>
```

> 移动端完整适配在 Round 6 中作为 polish 项处理。

---

## 验证步骤

```bash
npm run build
npm run lint
npm run dev
```

验证要点：

### 完整流程测试
- [ ] 打开 `/create` → 看到 SiteHeader + 产品选择器 + 3D 画框 + 右侧纹样面板 + 底部参数
- [ ] 点击「茶杯」→ 3D 模型切换为茶杯（LatheGeometry）
- [ ] 点击右侧「汉代流云纹」→ 纹理切换，底色自动更新
- [ ] 拖动「缩放」滑块 → 纹理缩放即时变化
- [ ] 拖动「旋转」滑块 → 纹理角度即时变化
- [ ] 点击平铺模式按钮（重复/镜像/单次）→ 纹理包裹方式变化
- [ ] 点击视角按钮（正面/侧面/俯视/自由）→ 相机位置切换
- [ ] 选择底色（预设色板 or 自定义）→ 模型底色更新
- [ ] 点击「重置参数」→ 所有参数恢复默认

### 导航测试
- [ ] SiteHeader 各链接正常跳转
- [ ] 从其他页面导航到 `/create` 无 SSR 错误
- [ ] 刷新 `/create` 页面正常加载

### 性能测试
- [ ] 首次加载 < 3s（含 3D 资源）
- [ ] 参数调节响应 < 100ms
- [ ] 切换产品时无明显卡顿

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/components/create/ProductSelector.tsx` | 新建 | 产品选择器 |
| `src/components/create/ParameterPanel.tsx` | 新建 | 参数调节面板 |
| `src/components/create/ViewportToolbar.tsx` | 新建 | 3D 视口浮动工具 |
| `src/components/create/ModelInfo.tsx` | 新建 | 模型信息浮层 |
| `src/components/create/OffsetPad.tsx` | 新建（可选） | 2D 偏移拖拽控件 |
| `src/app/(main)/create/page.tsx` | **重写** | 完整页面集成 |

---

## 页面布局精确规格

```
┌─ SiteHeader ─────────────────────────────── h-14 ─┐
├─ ProductSelector ────────────────────────── h-10 ─┤
├────────────────────────────────┬─────── w-80 ─────┤
│                                │ PatternPanel      │
│    Canvas3D                    │  ├── 标题+搜索     │
│    (flex-1, 自适应)             │  ├── 分类标签     │
│                                │  ├── 纹样网格     │
│    [ModelInfo]     [Toolbar]   │  └── 底部信息     │
│                                │                   │
├────────────────────────────────┴───────────────────┤
│ ParameterPanel ─────────────────────── h-auto ─────│
│  滑块区 | 平铺 | 视角 | 底色                        │
│  重置 | 偏移信息                                    │
└────────────────────────────────────────────────────┘
```

---

**下一步：执行 Round 6 (`06-export-polish.md`)**
