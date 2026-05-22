# Round 4 — 工具箱：色彩调节 + 变换 + 对称

## 目标
实现左侧工具栏 + 色彩调节面板 + 变换控制 + 对称工具。
用户可对选中图层进行：色相/饱和度/亮度调节、缩放/旋转/翻转、对称变换。

**本轮完成后：** 工坊具备完整的纹样再创作工具集。

---

## 上下文摘要

| 项目 | 值 |
|------|------|
| Round 3 产出 | CanvasEngine + WorkshopCanvas + LayerPanel |
| Store | useWorkshopStore 含 activeTool, colorAdjust, symmetry 及其 setter |
| 类型 | WorkshopTool, ColorAdjustParams, SymmetryConfig, LayerTransform 已定义 |
| 已有组件 | ParameterSlider, Icon, ColorPicker (from ai-creation-plan) |

---

## Step 1：左侧工具栏

**文件路径：** `src/components/workshop/ToolBar.tsx`

```typescript
'use client'

/**
 * ToolBar — 左侧垂直工具栏
 *
 * 工具列表（图标按钮）：
 * - 选择/移动 (select)
 * - 平移画布 (pan)
 * - 变换图层 (transform)
 * - 色彩调节 (color)
 * - 对称工具 (symmetry)
 *
 * 选中工具高亮，点击切换。
 */
import { memo } from 'react'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { WorkshopTool } from '@/types/workshop'

const TOOLS: { id: WorkshopTool; icon: string; label: string }[] = [
  { id: 'select', icon: 'near_me', label: '选择' },
  { id: 'pan', icon: 'pan_tool', label: '平移' },
  { id: 'transform', icon: 'transform', label: '变换' },
  { id: 'color', icon: 'palette', label: '调色' },
  { id: 'symmetry', icon: 'texture', label: '对称' },
]

export const ToolBar = memo(function ToolBar() {
  const activeTool = useWorkshopStore((s) => s.activeTool)
  const setActiveTool = useWorkshopStore((s) => s.setActiveTool)

  return (
    <aside className="w-14 border-r border-rice-deep flex flex-col items-center py-4 gap-2 bg-rice">
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveTool(tool.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
              isActive
                ? 'bg-gold text-white shadow-sm'
                : 'text-ink-light hover:bg-rice-warm hover:text-ink-medium'
            }`}
            title={tool.label}
          >
            <Icon name={tool.icon} size={20} />
          </button>
        )
      })}

      <div className="flex-1" />

      {/* 缩放快捷 */}
      <ZoomControls />
    </aside>
  )
})

function ZoomControls() {
  const zoom = useWorkshopStore((s) => s.zoom)
  const setZoom = useWorkshopStore((s) => s.setZoom)

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => setZoom(zoom + 0.1)}
        className="w-8 h-8 flex items-center justify-center rounded text-ink-faint hover:text-ink-medium hover:bg-rice-warm"
        title="放大"
      >
        <Icon name="add" size={18} />
      </button>
      <button
        type="button"
        onClick={() => setZoom(1.0)}
        className="text-[10px] font-bold text-ink-faint hover:text-ink-medium"
        title="重置缩放"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={() => setZoom(zoom - 0.1)}
        className="w-8 h-8 flex items-center justify-center rounded text-ink-faint hover:text-ink-medium hover:bg-rice-warm"
        title="缩小"
      >
        <Icon name="remove" size={18} />
      </button>
    </div>
  )
}
```

---

## Step 2：色彩调节面板

**文件路径：** `src/components/workshop/AdjustPanel.tsx`

```typescript
'use client'

/**
 * AdjustPanel — 色彩调节 + 变换参数面板
 *
 * 根据 activeTool 显示不同内容：
 * - color → 色彩调节滑块 (H/S/B/C/温度/染色)
 * - transform → 变换控件 (位移/缩放/旋转/翻转)
 * - symmetry → 对称模式选择
 * - 其他 → 不显示
 *
 * 位于画布下方或侧栏底部（Round 5 确定位置）。
 */
import { memo, useCallback } from 'react'
import { Icon } from '@/components/icons/Icon'
import ParameterSlider from '@/components/ui/ParameterSlider'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { SymmetryType, LayerTransform } from '@/types/workshop'

export const AdjustPanel = memo(function AdjustPanel() {
  const activeTool = useWorkshopStore((s) => s.activeTool)

  if (activeTool === 'color') return <ColorAdjustSection />
  if (activeTool === 'transform') return <TransformSection />
  if (activeTool === 'symmetry') return <SymmetrySection />

  return null
})

// ── 色彩调节 ──────────────────────────────────────────────────────────────

function ColorAdjustSection() {
  const colorAdjust = useWorkshopStore((s) => s.colorAdjust)
  const setColorAdjust = useWorkshopStore((s) => s.setColorAdjust)
  const resetColorAdjust = useWorkshopStore((s) => s.resetColorAdjust)

  return (
    <div className="bg-white border-t border-rice-deep p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="palette" size={16} className="text-gold" />
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">色彩调节</h3>
        </div>
        <button
          type="button"
          onClick={resetColorAdjust}
          className="text-xs text-ink-faint hover:text-cinnabar"
        >
          重置
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <ParameterSlider
          label="色相 HUE"
          value={colorAdjust.hue}
          onChange={(v) => setColorAdjust('hue', v)}
          min={-180}
          max={180}
          unit="°"
          primaryColor="gold"
        />
        <ParameterSlider
          label="饱和度 SAT"
          value={colorAdjust.saturation}
          onChange={(v) => setColorAdjust('saturation', v)}
          min={-100}
          max={100}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="亮度 BRI"
          value={colorAdjust.brightness}
          onChange={(v) => setColorAdjust('brightness', v)}
          min={-100}
          max={100}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="对比度 CON"
          value={colorAdjust.contrast}
          onChange={(v) => setColorAdjust('contrast', v)}
          min={-100}
          max={100}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="色温 TEMP"
          value={colorAdjust.temperature}
          onChange={(v) => setColorAdjust('temperature', v)}
          min={-50}
          max={50}
          unit=""
          primaryColor="gold"
        />
      </div>
    </div>
  )
}

// ── 变换控制 ──────────────────────────────────────────────────────────────

function TransformSection() {
  const activeLayerId = useWorkshopStore((s) => s.activeLayerId)
  const layer = useWorkshopStore((s) =>
    s.layers.find((l) => l.id === s.activeLayerId)
  )
  const updateLayer = useWorkshopStore((s) => s.updateLayer)

  if (!layer || !activeLayerId) {
    return (
      <div className="bg-white border-t border-rice-deep p-4 text-center">
        <p className="text-sm text-ink-faint">请先选中一个图层</p>
      </div>
    )
  }

  const t = layer.transform

  const updateTransform = useCallback(
    (updates: Partial<LayerTransform>) => {
      updateLayer(activeLayerId, {
        transform: { ...t, ...updates },
      })
    },
    [activeLayerId, t, updateLayer]
  )

  return (
    <div className="bg-white border-t border-rice-deep p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="transform" size={16} className="text-gold" />
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
          变换 — {layer.name}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <ParameterSlider
          label="X 偏移"
          value={Math.round(t.x)}
          onChange={(v) => updateTransform({ x: v })}
          min={-500}
          max={500}
          unit="px"
          primaryColor="gold"
        />
        <ParameterSlider
          label="Y 偏移"
          value={Math.round(t.y)}
          onChange={(v) => updateTransform({ y: v })}
          min={-500}
          max={500}
          unit="px"
          primaryColor="gold"
        />
        <ParameterSlider
          label="缩放 X"
          value={Math.round(t.scaleX * 100)}
          onChange={(v) => updateTransform({ scaleX: v / 100 })}
          min={10}
          max={300}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="缩放 Y"
          value={Math.round(t.scaleY * 100)}
          onChange={(v) => updateTransform({ scaleY: v / 100 })}
          min={10}
          max={300}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="旋转"
          value={Math.round((t.rotation * 180) / Math.PI)}
          onChange={(v) => updateTransform({ rotation: (v * Math.PI) / 180 })}
          min={0}
          max={360}
          unit="°"
          primaryColor="gold"
        />
      </div>

      {/* 翻转按钮 */}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => updateTransform({ flipH: !t.flipH })}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
            t.flipH ? 'bg-gold text-white' : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
          }`}
        >
          <Icon name="flip" size={14} />
          水平翻转
        </button>
        <button
          type="button"
          onClick={() => updateTransform({ flipV: !t.flipV })}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
            t.flipV ? 'bg-gold text-white' : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
          }`}
        >
          <Icon name="flip" size={14} className="rotate-90" />
          垂直翻转
        </button>
      </div>
    </div>
  )
}

// ── 对称工具 ──────────────────────────────────────────────────────────────

const SYMMETRY_OPTIONS: { type: SymmetryType; icon: string; label: string }[] = [
  { type: 'none', icon: 'block', label: '无' },
  { type: 'horizontal', icon: 'align_horizontal_center', label: '水平' },
  { type: 'vertical', icon: 'align_vertical_center', label: '垂直' },
  { type: 'both', icon: 'control_camera', label: '双轴' },
  { type: 'radial-4', icon: 'add', label: '4折' },
  { type: 'radial-6', icon: 'hexagon', label: '6折' },
  { type: 'radial-8', icon: 'star', label: '8折' },
]

function SymmetrySection() {
  const symmetry = useWorkshopStore((s) => s.symmetry)
  const setSymmetry = useWorkshopStore((s) => s.setSymmetry)

  return (
    <div className="bg-white border-t border-rice-deep p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="texture" size={16} className="text-gold" />
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">对称模式</h3>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {SYMMETRY_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => setSymmetry({ type: opt.type })}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition-colors ${
              symmetry.type === opt.type
                ? 'bg-gold text-white shadow-sm'
                : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
            }`}
          >
            <Icon name={opt.icon} size={18} />
            {opt.label}
          </button>
        ))}
      </div>

      {symmetry.type !== 'none' && (
        <div className="mt-3 flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-ink-light cursor-pointer">
            <input
              type="checkbox"
              checked={symmetry.showGuides}
              onChange={(e) => setSymmetry({ showGuides: e.target.checked })}
              className="accent-gold"
            />
            显示辅助线
          </label>
        </div>
      )}
    </div>
  )
}
```

---

## Step 3：色彩调节算法

**文件路径：** `src/lib/workshop/colorAdjust.ts`

```typescript
/**
 * 色彩调节算法
 *
 * 使用 Canvas ImageData 逐像素处理。
 * 所有调节基于 HSL 色彩空间变换。
 */
import type { ColorAdjustParams } from '@/types/workshop'

/**
 * 对 ImageData 应用色彩调节
 * @returns 新的 ImageData（不修改原数据）
 */
export function applyColorAdjustment(
  imageData: ImageData,
  params: ColorAdjustParams
): ImageData {
  const { hue, saturation, brightness, contrast, temperature } = params

  // 如果所有参数为默认值，直接返回（性能优化）
  if (hue === 0 && saturation === 0 && brightness === 0 && contrast === 0 && temperature === 0) {
    return imageData
  }

  const data = new Uint8ClampedArray(imageData.data)
  const length = data.length

  for (let i = 0; i < length; i += 4) {
    let r = data[i]!
    let g = data[i + 1]!
    let b = data[i + 2]!
    // alpha 保持不变

    // 1. 亮度调节
    if (brightness !== 0) {
      const factor = 1 + brightness / 100
      r = Math.round(r * factor)
      g = Math.round(g * factor)
      b = Math.round(b * factor)
    }

    // 2. 对比度调节
    if (contrast !== 0) {
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
      r = Math.round(factor * (r - 128) + 128)
      g = Math.round(factor * (g - 128) + 128)
      b = Math.round(factor * (b - 128) + 128)
    }

    // 3. HSL 调节（色相 + 饱和度）
    if (hue !== 0 || saturation !== 0) {
      const [h, s, l] = rgbToHsl(r, g, b)
      const newH = ((h + hue / 360) % 1 + 1) % 1
      const newS = Math.max(0, Math.min(1, s + saturation / 100))
      ;[r, g, b] = hslToRgb(newH, newS, l)
    }

    // 4. 色温
    if (temperature !== 0) {
      r = Math.round(r + temperature * 1.5)
      b = Math.round(b - temperature * 1.5)
    }

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  return new ImageData(data, imageData.width, imageData.height)
}

// ── HSL 转换工具 ─────────────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ]
}
```

---

## Step 4：CanvasEngine 集成色彩调节

更新 `canvasEngine.ts` 的 `renderPatternLayer` 方法，在绘制前应用色彩调节：

```diff
+ import { applyColorAdjustment } from './colorAdjust'

  private renderPatternLayer(...) {
    const bitmap = this.imageCache.get(layer.id)
    if (!bitmap) return

+   // 如果有色彩调节，先应用到临时画布
+   let source: ImageBitmap | HTMLCanvasElement = bitmap
+   if (this.hasColorAdjust(layer.colorAdjust)) {
+     source = this.applyColorAdjustToBitmap(bitmap, layer.colorAdjust)
+   }
    // ... 继续绘制
  }

+ private hasColorAdjust(ca: ColorAdjustParams): boolean {
+   return ca.hue !== 0 || ca.saturation !== 0 || ca.brightness !== 0
+     || ca.contrast !== 0 || ca.temperature !== 0
+ }

+ private applyColorAdjustToBitmap(
+   bitmap: ImageBitmap,
+   params: ColorAdjustParams
+ ): HTMLCanvasElement {
+   const tempCanvas = document.createElement('canvas')
+   tempCanvas.width = bitmap.width
+   tempCanvas.height = bitmap.height
+   const ctx = tempCanvas.getContext('2d')!
+   ctx.drawImage(bitmap, 0, 0)
+   const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
+   const adjusted = applyColorAdjustment(imageData, params)
+   ctx.putImageData(adjusted, 0, 0)
+   return tempCanvas
+ }
```

---

## 验证步骤

- [ ] 左侧工具栏显示 5 个工具按钮，选中高亮为 gold
- [ ] 点击「调色」→ 底部显示色彩调节面板（6 个滑块）
- [ ] 拖动色相滑块 → Canvas 上的纹样颜色即时变化
- [ ] 拖动饱和度/亮度/对比度 → 效果正确
- [ ] 点击「变换」→ 显示变换面板（位移/缩放/旋转/翻转）
- [ ] 拖动 X/Y 偏移 → 纹样位置移动
- [ ] 翻转按钮切换水平/垂直翻转
- [ ] 点击「对称」→ 显示 7 种对称模式
- [ ] 选择 4 折对称 → Canvas 显示 4 次旋转复制
- [ ] 缩放控件（+ / - / 百分比重置）正常

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/components/workshop/ToolBar.tsx` | 新建 | 左侧工具栏 |
| `src/components/workshop/AdjustPanel.tsx` | 新建 | 色彩/变换/对称参数面板 |
| `src/lib/workshop/colorAdjust.ts` | 新建 | 色彩调节算法 |
| `src/lib/workshop/canvasEngine.ts` | 修改 | 集成色彩调节 |

---

**下一步：执行 Round 5 (`05-page-integration.md`)**
