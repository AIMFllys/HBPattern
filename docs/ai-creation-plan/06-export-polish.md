# Round 6 — 导出功能 + 交互优化 + 收尾打磨

## 目标
实现截图导出、收藏/保存到 localStorage、交互细节打磨、性能优化、移动端基本适配。
本轮是收尾轮次，完成后系统达到**可交付状态**。

---

## 上下文摘要（执行前必读）

| 项目 | 值 |
|------|------|
| Round 5 产出 | 完整页面已集成，所有组件可交互 |
| 导出能力 | Canvas3D 已配置 `preserveDrawingBuffer: true` |
| 认证 | `useAuthStore` + `useAuthModal` + `requireAuth()` 模式 |
| 状态快照 | `CreationSnapshot` 类型已定义（productId, patternId, textureParams, materialParams, createdAt） |
| 动画库 | `motion/react` (Framer Motion) 已安装，`src/lib/motion.ts` 有预设 |
| 设计 token | cinnabar / gold / rice / ink 色系 |

---

## Step 1：创建导出按钮组件

**文件路径：** `src/components/create/ExportButton.tsx`

```typescript
'use client'

/**
 * ExportButton — 3D 视口截图导出
 *
 * 技术原理：
 * 1. 获取 R3F Canvas 的 WebGL renderer
 * 2. 强制渲染一帧（确保当前状态是最新的）
 * 3. 通过 canvas.toDataURL('image/png') 获取图片数据
 * 4. 创建临时 <a> 标签触发下载
 *
 * 前置条件：
 * Canvas3D 中 gl 配置了 preserveDrawingBuffer: true
 */
import { useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Icon } from '@/components/icons/Icon'
import { useCreateStore } from '@/stores/useCreateStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAuthModal } from '@/stores/useAuthModal'
import { PRODUCT_CONFIGS } from '@/lib/textures/productConfigs'

/**
 * 内部 Hook：获取 Canvas DOM 元素
 * 必须在 R3F Canvas 内部使用
 */
export function useCanvasExport() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  const exportPNG = useCallback(
    (filename: string) => {
      // 强制渲染当前帧
      gl.render(scene, camera)

      // 获取 Canvas 数据
      const dataUrl = gl.domElement.toDataURL('image/png')

      // 触发下载
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [gl, scene, camera]
  )

  return { exportPNG }
}

/**
 * ExportButton — 放在 Canvas 外部的导出按钮
 * 通过 ref 回调调用 Canvas 内部的导出方法
 */

interface ExportTriggerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function ExportTrigger({ canvasRef }: ExportTriggerProps) {
  const isExporting = useCreateStore((s) => s.isExporting)
  const setIsExporting = useCreateStore((s) => s.setIsExporting)
  const selectedProduct = useCreateStore((s) => s.selectedProduct)
  const selectedPattern = useCreateStore((s) => s.selectedPattern)
  const user = useAuthStore((s) => s.user)
  const { openModal } = useAuthModal()

  const handleExport = useCallback(() => {
    if (!user) {
      openModal('登录后即可导出高清设计稿')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    setIsExporting(true)

    // 生成文件名
    const product = PRODUCT_CONFIGS.find((p) => p.id === selectedProduct)
    const patternName = selectedPattern?.name ?? '无纹样'
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `湖北纹案_${product?.name ?? selectedProduct}_${patternName}_${timestamp}.png`

    try {
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      // 延迟恢复，给用户视觉反馈
      setTimeout(() => setIsExporting(false), 1000)
    }
  }, [canvasRef, selectedProduct, selectedPattern, user, openModal, setIsExporting])

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                  shadow-lg active:scale-95 ${
        isExporting
          ? 'bg-ink-light text-white cursor-wait'
          : 'bg-cinnabar text-white shadow-cinnabar/20 hover:bg-cinnabar-deep'
      }`}
    >
      <Icon name={isExporting ? 'hourglass_empty' : 'download'} size={16} />
      {isExporting ? '导出中…' : '导出 PNG'}
    </button>
  )
}
```

---

## Step 2：Canvas3D 导出集成

更新 `Canvas3D.tsx`，暴露 Canvas DOM ref 供导出使用：

```diff
+ import { forwardRef, useImperativeHandle } from 'react'

- export default function Canvas3D() {
+ export interface Canvas3DHandle {
+   getCanvas: () => HTMLCanvasElement | null
+ }
+
+ const Canvas3D = forwardRef<Canvas3DHandle>(function Canvas3D(_, ref) {
+   const canvasContainerRef = useRef<HTMLDivElement>(null)
+
+   useImperativeHandle(ref, () => ({
+     getCanvas: () => {
+       return canvasContainerRef.current?.querySelector('canvas') ?? null
+     },
+   }))

    return (
-     <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-rice-cool">
+     <div ref={canvasContainerRef}
+          className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-rice-cool">
        ...
      </div>
    )
- }
+ })
+
+ export default Canvas3D
```

---

## Step 3：创建收藏/保存功能

**文件路径：** `src/lib/createStorage.ts`

```typescript
/**
 * 创作配置本地存储
 *
 * 保存/读取用户的创作配置到 localStorage。
 * 后续可替换为 API 持久化。
 *
 * 存储结构：
 * localStorage['hbpattern-creations'] = JSON.stringify(CreationSnapshot[])
 */
import type { CreationSnapshot, TextureParams, MaterialParams, ProductId } from '@/types/create'

const STORAGE_KEY = 'hbpattern-creations'
const MAX_SAVES = 20

/** 获取所有已保存的创作 */
export function getSavedCreations(): CreationSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CreationSnapshot[]
  } catch {
    return []
  }
}

/** 保存当前创作配置 */
export function saveCreation(
  productId: ProductId,
  patternId: string,
  textureParams: TextureParams,
  materialParams: MaterialParams
): CreationSnapshot {
  const snapshot: CreationSnapshot = {
    productId,
    patternId,
    textureParams,
    materialParams,
    createdAt: new Date().toISOString(),
  }

  const existing = getSavedCreations()

  // 添加到头部，限制最大数量
  const updated = [snapshot, ...existing].slice(0, MAX_SAVES)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return snapshot
}

/** 删除保存的创作 */
export function deleteCreation(createdAt: string): void {
  const existing = getSavedCreations()
  const updated = existing.filter((s) => s.createdAt !== createdAt)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

/** 清空所有保存 */
export function clearAllCreations(): void {
  localStorage.removeItem(STORAGE_KEY)
}
```

---

## Step 4：保存按钮集成

在 `ParameterPanel.tsx` 底部操作栏增加保存按钮：

```diff
  {/* 底部操作栏 */}
  <div className="flex items-center justify-between px-4 py-2 bg-rice-warm/30 border-t border-rice-deep">
    <button type="button" onClick={resetTextureParams} ...>
      重置参数
    </button>

-   <div className="flex items-center gap-2 text-xs text-ink-faint">
-     <span>X偏移: {textureParams.offsetX}%</span>
-     <span>Y偏移: {textureParams.offsetY}%</span>
-   </div>
+   <div className="flex items-center gap-3">
+     <SaveButton />
+     <ExportTrigger canvasRef={canvasRef} />
+   </div>
  </div>
```

**SaveButton 组件：**

```typescript
function SaveButton() {
  const user = useAuthStore((s) => s.user)
  const { openModal } = useAuthModal()
  const selectedProduct = useCreateStore((s) => s.selectedProduct)
  const selectedPattern = useCreateStore((s) => s.selectedPattern)
  const textureParams = useCreateStore((s) => s.textureParams)
  const materialParams = useCreateStore((s) => s.materialParams)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(() => {
    if (!user) {
      openModal('登录后即可保存您的创作配置')
      return
    }
    if (!selectedPattern) return

    saveCreation(selectedProduct, selectedPattern.id, textureParams, materialParams)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [user, openModal, selectedProduct, selectedPattern, textureParams, materialParams])

  return (
    <button
      type="button"
      onClick={handleSave}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all
                  border active:scale-95 ${
        saved
          ? 'border-success text-success bg-success/5'
          : 'border-cinnabar text-cinnabar hover:bg-cinnabar/5'
      }`}
    >
      <Icon name={saved ? 'check_circle' : 'bookmark'} size={16} />
      {saved ? '已保存' : '保存配置'}
    </button>
  )
}
```

---

## Step 5：动画与微交互优化

### 5.1 产品切换过渡动画

在 `ProductModel.tsx` 中添加切换过渡：

```typescript
import { animated, useSpring } from '@react-spring/three'
// 或使用 drei 的 Float 组件

// 更简单的方案：使用 opacity 和 scale 过渡
function ProductModel({ productId }: Props) {
  const [visible, setVisible] = useState(true)
  const prevProduct = useRef(productId)

  useEffect(() => {
    if (prevProduct.current !== productId) {
      setVisible(false)
      const timer = setTimeout(() => {
        prevProduct.current = productId
        setVisible(true)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [productId])

  // ... 使用 visible 控制 opacity/scale
}
```

### 5.2 面板切换动画

纹样面板和参数面板在移动端使用 `motion/react` 动画：

```typescript
import { motion, AnimatePresence } from 'motion/react'

<AnimatePresence mode="wait">
  <motion.div
    key={activePanel}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
  >
    {/* panel content */}
  </motion.div>
</AnimatePresence>
```

### 5.3 滑块拖动时 3D 视口边框发光

```css
/* globals.css 追加 */
.canvas-3d-active {
  box-shadow: 0 0 0 2px var(--color-cinnabar), 0 0 20px var(--color-cinnabar-light);
  transition: box-shadow var(--duration-fast) var(--ease-default);
}
```

---

## Step 6：性能优化

### 6.1 纹理更新节流

参数滑块拖动时避免每毫秒都重新计算纹理：

```typescript
// 在 usePatternTexture.ts 中
import { useDeferredValue } from 'react'

export function usePatternTexture() {
  const textureParams = useCreateStore((s) => s.textureParams)
  // React 19 的 useDeferredValue 自动延迟低优先级更新
  const deferredParams = useDeferredValue(textureParams)

  // 使用 deferredParams 代替 textureParams 做纹理属性更新
  // ...
}
```

### 6.2 3D 组件懒加载优化

```typescript
// Canvas3D 内部按需导入 Environment
const Environment = lazy(() =>
  import('@react-three/drei').then((mod) => ({ default: mod.Environment }))
)
```

### 6.3 移动端降级渲染

```typescript
// Canvas3D 中检测移动端
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

<Canvas
  shadows={!isMobile}
  dpr={isMobile ? [1, 1.5] : [1, 2]}
  gl={{
    antialias: !isMobile,
    // ...
  }}
>
  {!isMobile && <ContactShadows ... />}
  <Environment preset={isMobile ? 'city' : 'apartment'} />
</Canvas>
```

---

## Step 7：移动端基本适配

### 7.1 移动端底部工具栏

**文件路径：** `src/components/create/MobileToolbar.tsx`

```typescript
'use client'

/**
 * MobileToolbar — 移动端底部 Tab 切换
 *
 * 三个 Tab：
 * - 视口（默认，全屏 3D）
 * - 纹样（弹出纹样选择底部 Sheet）
 * - 参数（弹出参数调节底部 Sheet）
 */
import { useState } from 'react'
import { Icon } from '@/components/icons/Icon'

type MobileTab = 'viewport' | 'pattern' | 'params'

interface Props {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
}

export function MobileToolbar({ activeTab, onTabChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-rice-deep
                    flex items-center justify-around py-2 px-4 z-20 lg:hidden">
      <TabButton
        icon="deployed_code"
        label="视口"
        isActive={activeTab === 'viewport'}
        onClick={() => onTabChange('viewport')}
      />
      <TabButton
        icon="palette"
        label="纹样"
        isActive={activeTab === 'pattern'}
        onClick={() => onTabChange('pattern')}
      />
      <TabButton
        icon="tune"
        label="参数"
        isActive={activeTab === 'params'}
        onClick={() => onTabChange('params')}
      />
    </div>
  )
}

function TabButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: string
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
        isActive ? 'text-cinnabar' : 'text-ink-faint'
      }`}
    >
      <Icon name={icon} size={20} />
      <span className="text-xs font-bold">{label}</span>
    </button>
  )
}
```

### 7.2 页面响应式调整

在 `create/page.tsx` 中：

```typescript
// 移动端布局
<main className="flex flex-col lg:flex-row flex-1 overflow-hidden">
  <section className="flex-1 flex flex-col relative">
    <div className="flex-1 relative">
      <Canvas3D />
      <ModelInfo />
      <ViewportToolbar />
    </div>
    {/* 仅桌面显示参数面板 */}
    <div className="hidden lg:block">
      <ParameterPanel />
    </div>
  </section>

  {/* 仅桌面显示纹样面板 */}
  <div className="hidden lg:flex">
    <PatternPanel />
  </div>

  {/* 移动端底部导航 */}
  <MobileToolbar ... />
</main>
```

---

## Step 8：最终样式统一检查

### 需确认的样式一致性

| 检查项 | 标准 |
|--------|------|
| 字体 | 标题用 serif (Noto Serif SC)，正文用 sans (Noto Sans SC) |
| 主色 | cinnabar (#b84a39) 用于 CTA 和高亮 |
| 背景 | rice (#f5f0e8) 主背景，rice-warm (#ede7d9) 卡片 |
| 圆角 | sm (0.25rem), md (0.5rem), lg (1rem), xl (1.5rem) |
| 阴影 | shadow-card (轻), shadow-hover (中), shadow-modal (重) |
| 过渡 | transition-all + 默认 ease |
| Icon | Material Symbols Outlined，统一用 `<Icon>` 组件 |

---

## 验证步骤

### 完整回归测试

```bash
npm run build     # 无 TS 错误
npm run lint      # 无 ESLint 警告 + lint-guards 全通过
npm run test      # 所有测试通过
npm run dev       # 手动验证
```

### 功能验收清单

- [ ] **产品选择** — 6 种产品均可选择，3D 模型正确切换
- [ ] **3D 交互** — 鼠标旋转、缩放、平移流畅
- [ ] **纹样选择** — 8 种纹样可选，缩略图正确渲染
- [ ] **分类筛选** — 7 个分类正确过滤
- [ ] **搜索** — 名称/分类搜索正常
- [ ] **参数调节** — 缩放/旋转/透明度/粗糙度实时生效
- [ ] **平铺模式** — 单次/重复/镜像三种模式正确
- [ ] **视角切换** — 正面/侧面/俯视/自由四个预设
- [ ] **底色选择** — 预设色板 + 自定义取色器
- [ ] **导出 PNG** — 点击下载 3D 视口截图
- [ ] **保存配置** — 保存到 localStorage，刷新后可恢复
- [ ] **重置参数** — 恢复默认值
- [ ] **登录拦截** — 未登录时导出/保存弹出登录提示
- [ ] **移动端** — 底部 Tab 导航，3D 视口全屏可用

### 性能验收

- [ ] 首次加载 < 3s（3D 资源懒加载）
- [ ] 参数调节响应 < 100ms
- [ ] 内存占用 < 200MB
- [ ] 无内存泄漏（切换产品/纹样多次后检查）

### 代码质量

- [ ] TypeScript strict 模式无报错
- [ ] ESLint 无警告
- [ ] lint-guards 5 项全通过
- [ ] 无 `any` 类型
- [ ] 无 inline style（`style=` 属性）
- [ ] 无 `console.log`
- [ ] 所有导入使用 `@/` 路径别名

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/components/create/ExportButton.tsx` | 新建 | 导出 PNG 截图 |
| `src/lib/createStorage.ts` | 新建 | localStorage 持久化 |
| `src/components/create/MobileToolbar.tsx` | 新建 | 移动端底部导航 |
| `src/components/create/Canvas3D.tsx` | 修改 | 暴露 Canvas ref |
| `src/components/create/ParameterPanel.tsx` | 修改 | 集成保存/导出按钮 |
| `src/app/(main)/create/page.tsx` | 修改 | 响应式布局 + 移动端 |
| `src/hooks/usePatternTexture.ts` | 修改 | 性能优化（useDeferredValue） |
| `src/app/globals.css` | 追加 | 激活态样式 |

---

## 全轮次交付总结

```
Round 1 ✓ 依赖 + 类型 + Store
Round 2 ✓ 3D 视口 + 6 种产品几何体
Round 3 ✓ 程序化纹理 + 参数系统
Round 4 ✓ 纹样库 UI + 分类筛选
Round 5 ✓ 页面集成 + 产品选择器
Round 6 ✓ 导出 + 保存 + 动画 + 移动端
```

### 文件创建/修改总清单

| 新建文件 | 所属轮次 |
|---------|---------|
| `src/types/create.ts` | R1 |
| `src/lib/textures/patternPresets.ts` | R1 |
| `src/lib/textures/productConfigs.ts` | R1 |
| `src/stores/useCreateStore.ts` | R1 |
| `src/components/create/Canvas3D.tsx` | R2 |
| `src/components/create/ProductModel.tsx` | R2 |
| `src/components/create/models/Frame.tsx` | R2 |
| `src/components/create/models/Scarf.tsx` | R2 |
| `src/components/create/models/PhoneCase.tsx` | R2 |
| `src/components/create/models/Fan.tsx` | R2 |
| `src/components/create/models/TeaCup.tsx` | R2 |
| `src/components/create/models/TShirt.tsx` | R2 |
| `src/lib/textures/generatePattern.ts` | R3 |
| `src/hooks/usePatternTexture.ts` | R3 |
| `src/components/create/TexturedMaterial.tsx` | R3 |
| `src/lib/textures/textureCache.ts` | R3 |
| `src/components/create/PatternThumbnail.tsx` | R4 |
| `src/components/create/PatternPanel.tsx` | R4 |
| `src/components/ui/ColorPicker.tsx` | R4 |
| `src/components/create/ProductSelector.tsx` | R5 |
| `src/components/create/ParameterPanel.tsx` | R5 |
| `src/components/create/ViewportToolbar.tsx` | R5 |
| `src/components/create/ModelInfo.tsx` | R5 |
| `src/components/create/OffsetPad.tsx` | R5（可选） |
| `src/components/create/ExportButton.tsx` | R6 |
| `src/lib/createStorage.ts` | R6 |
| `src/components/create/MobileToolbar.tsx` | R6 |

| 修改文件 | 所属轮次 | 改动 |
|---------|---------|------|
| `src/app/(main)/create/page.tsx` | R2→R5→R6 | 逐步重写 |
| `src/app/globals.css` | R2→R6 | 追加 3D 容器样式 |
| `src/components/create/models/*.tsx` | R3 | 接入 TexturedMaterial |

---

## 后续迭代方向（不在本次范围内）

| 方向 | 描述 | 优先级 |
|------|------|--------|
| AI 纹样生成 | 接入 Volcengine Seedream API | P1 |
| 外部 .glb 模型 | 替换程序化几何体为精细模型 | P1 |
| 用户上传纹样 | 上传自定义图片作为纹理 | P2 |
| 服务端持久化 | 替换 localStorage 为 API 保存 | P2 |
| 社交分享 | 生成分享海报/链接 | P2 |
| 多纹理层叠 | 支持多个纹样叠加 | P3 |
| 动画录制 | 录制旋转动画为 GIF/MP4 | P3 |
| 暗色模式 | 适配全站暗色模式 | P3 |
