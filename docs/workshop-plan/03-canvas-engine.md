# Round 3 — Canvas 2D 绘制引擎 + 图层系统

## 目标
实现 Canvas 2D 核心绘制引擎和图层系统——本轮是整个工坊的**技术心脏**。
用户选中纹样 → 图片加载到画布 → 支持多图层叠加 → 实时合成预览。

**本轮完成后：** 中央画布区域替换为真实 Canvas，纹样图片可加载为图层，可视可控。

---

## 上下文摘要（执行前必读）

| 项目 | 值 |
|------|------|
| Round 2 产出 | WorkshopClient + PatternAssetPanel（真实数据面板） |
| Store | useWorkshopStore 含 layers[], activeLayerId, addLayer, removeLayer, updateLayer |
| 类型 | WorkshopLayer, LayerTransform, CanvasBlendMode, ColorAdjustParams 已定义 |
| 画布尺寸 | 默认 1024×1024，可通过 CANVAS_PRESETS 切换 |
| 图片来源 | Supabase Storage `*.supabase.co`，通过 `pattern.media[0].url` 获取 |
| 跨域 | Supabase 公开 Storage 支持 CORS，`crossOrigin="anonymous"` |
| 性能目标 | 画布操作 < 50ms，图层合成 < 100ms（5 层以内） |

---

## 核心架构

### Canvas 架构设计

```
┌─ WorkshopCanvas.tsx (React 组件) ──────────────────────────┐
│  ├── <canvas ref> — 主显示画布 (CSS 尺寸自适应)              │
│  ├── CanvasEngine (纯 JS 类) — 渲染与合成逻辑               │
│  │     ├── offscreenCanvas — 离屏合成（大尺寸渲染）           │
│  │     ├── renderLayers() — 按顺序合成所有可见图层            │
│  │     ├── applyTransform() — 应用图层变换矩阵               │
│  │     ├── applyColorAdjust() — 逐像素色彩调节               │
│  │     └── applySymmetry() — 对称复制绘制                    │
│  ├── Pointer Events — 鼠标/触控交互处理                      │
│  └── useEffect — 响应 Store 变化触发重绘                     │
└────────────────────────────────────────────────────────────┘
```

### 为什么分离 CanvasEngine 为纯 JS 类？

1. **可测试** — 纯逻辑不依赖 React，可用 Vitest 单测
2. **可复用** — 导出时复用同一渲染逻辑，保证所见即所得
3. **性能** — 避免 React 重渲染干扰 Canvas 操作
4. **职责清晰** — React 组件只负责 DOM 绑定和 Store 桥接

---

## Step 1：Canvas 渲染引擎核心

**文件路径：** `src/lib/workshop/canvasEngine.ts`

```typescript
/**
 * Canvas 2D 渲染引擎
 *
 * 纯 JS 类，不依赖 React。
 * 负责图层合成、变换应用、画布管理。
 */
import type {
  WorkshopLayer,
  LayerTransform,
  ColorAdjustParams,
  SymmetryConfig,
  CanvasBlendMode,
} from '@/types/workshop'

export class CanvasEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private offscreen: OffscreenCanvas
  private offCtx: OffscreenCanvasRenderingContext2D
  private width: number
  private height: number
  private dpr: number

  /** 已加载的图片缓存 (layerId → ImageBitmap) */
  private imageCache: Map<string, ImageBitmap> = new Map()

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas
    this.width = width
    this.height = height
    this.dpr = Math.min(window.devicePixelRatio, 2)

    // 主 Canvas 设置（高 DPI 支持）
    canvas.width = width * this.dpr
    canvas.height = height * this.dpr
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas 2D not supported')
    ctx.scale(this.dpr, this.dpr)
    this.ctx = ctx

    // 离屏画布（用于图层合成，避免闪烁）
    this.offscreen = new OffscreenCanvas(width, height)
    const offCtx = this.offscreen.getContext('2d', { willReadFrequently: true })
    if (!offCtx) throw new Error('OffscreenCanvas 2D not supported')
    this.offCtx = offCtx
  }

  /** 调整画布尺寸 */
  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.ctx.scale(this.dpr, this.dpr)
    this.offscreen = new OffscreenCanvas(width, height)
    const offCtx = this.offscreen.getContext('2d', { willReadFrequently: true })
    if (offCtx) this.offCtx = offCtx
  }

  /** 加载图片到缓存 */
  async loadImage(layerId: string, url: string): Promise<void> {
    // 如果已缓存，跳过
    if (this.imageCache.has(layerId)) return

    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    this.imageCache.set(layerId, bitmap)
  }

  /** 从缓存移除图片 */
  removeImage(layerId: string): void {
    const bitmap = this.imageCache.get(layerId)
    if (bitmap) {
      bitmap.close()
      this.imageCache.delete(layerId)
    }
  }

  /**
   * 渲染所有图层到主 Canvas
   * 这是核心渲染循环，按顺序合成所有可见图层。
   */
  render(
    layers: WorkshopLayer[],
    symmetry: SymmetryConfig,
    backgroundColor: string = '#ffffff'
  ): void {
    const { offCtx, width, height } = this

    // 1. 清空离屏画布
    offCtx.clearRect(0, 0, width, height)

    // 2. 绘制背景
    offCtx.fillStyle = backgroundColor
    offCtx.fillRect(0, 0, width, height)

    // 3. 按顺序合成各图层
    for (const layer of layers) {
      if (!layer.visible || layer.opacity <= 0) continue

      offCtx.save()

      // 设置混合模式和透明度
      offCtx.globalCompositeOperation = layer.blendMode
      offCtx.globalAlpha = layer.opacity / 100

      if (layer.type === 'pattern') {
        this.renderPatternLayer(offCtx, layer, symmetry)
      } else if (layer.type === 'color-fill') {
        this.renderColorFillLayer(offCtx, layer)
      }

      offCtx.restore()
    }

    // 4. 将离屏画布绘制到主画布
    this.ctx.clearRect(0, 0, width, height)
    this.ctx.drawImage(this.offscreen, 0, 0, width, height)
  }

  /** 渲染纹样图层 */
  private renderPatternLayer(
    ctx: OffscreenCanvasRenderingContext2D,
    layer: WorkshopLayer,
    symmetry: SymmetryConfig
  ): void {
    const bitmap = this.imageCache.get(layer.id)
    if (!bitmap) return

    const { transform } = layer
    const { width, height } = this

    // 应用对称
    if (symmetry.type !== 'none') {
      this.drawWithSymmetry(ctx, bitmap, transform, symmetry, width, height)
    } else {
      this.drawTransformed(ctx, bitmap, transform, width, height)
    }
  }

  /** 带变换的图片绘制 */
  private drawTransformed(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    bitmap: ImageBitmap,
    transform: LayerTransform,
    canvasW: number,
    canvasH: number
  ): void {
    ctx.save()

    // 平移到画布中心 + 偏移
    const cx = canvasW / 2 + transform.x
    const cy = canvasH / 2 + transform.y
    ctx.translate(cx, cy)

    // 旋转
    ctx.rotate(transform.rotation)

    // 缩放 + 翻转
    ctx.scale(
      transform.scaleX * (transform.flipH ? -1 : 1),
      transform.scaleY * (transform.flipV ? -1 : 1)
    )

    // 绘制（以中心为原点）
    const drawW = bitmap.width * transform.scaleX
    const drawH = bitmap.height * transform.scaleY
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)

    ctx.restore()
  }

  /** 对称绘制 */
  private drawWithSymmetry(
    ctx: OffscreenCanvasRenderingContext2D,
    bitmap: ImageBitmap,
    transform: LayerTransform,
    symmetry: SymmetryConfig,
    canvasW: number,
    canvasH: number
  ): void {
    const cx = canvasW * symmetry.centerX
    const cy = canvasH * symmetry.centerY

    switch (symmetry.type) {
      case 'horizontal': {
        this.drawTransformed(ctx, bitmap, transform, canvasW, canvasH)
        ctx.save()
        ctx.translate(cx * 2, 0)
        ctx.scale(-1, 1)
        this.drawTransformed(ctx, bitmap, transform, canvasW, canvasH)
        ctx.restore()
        break
      }
      case 'vertical': {
        this.drawTransformed(ctx, bitmap, transform, canvasW, canvasH)
        ctx.save()
        ctx.translate(0, cy * 2)
        ctx.scale(1, -1)
        this.drawTransformed(ctx, bitmap, transform, canvasW, canvasH)
        ctx.restore()
        break
      }
      case 'both': {
        // 四象限对称
        const transforms = [
          { flipH: false, flipV: false },
          { flipH: true, flipV: false },
          { flipH: false, flipV: true },
          { flipH: true, flipV: true },
        ]
        for (const t of transforms) {
          const adjusted = { ...transform, flipH: t.flipH, flipV: t.flipV }
          this.drawTransformed(ctx, bitmap, adjusted, canvasW, canvasH)
        }
        break
      }
      case 'radial-4':
      case 'radial-6':
      case 'radial-8': {
        const foldCount = parseInt(symmetry.type.split('-')[1] ?? '4', 10)
        const angleStep = (Math.PI * 2) / foldCount
        for (let i = 0; i < foldCount; i++) {
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(angleStep * i)
          ctx.translate(-cx, -cy)
          this.drawTransformed(ctx, bitmap, transform, canvasW, canvasH)
          ctx.restore()
        }
        break
      }
      default:
        this.drawTransformed(ctx, bitmap, transform, canvasW, canvasH)
    }
  }

  /** 渲染纯色填充图层 */
  private renderColorFillLayer(
    ctx: OffscreenCanvasRenderingContext2D,
    layer: WorkshopLayer
  ): void {
    // 背景色使用 colorAdjust.tint 或默认白色
    const fillColor = layer.colorAdjust.tint ?? '#ffffff'
    ctx.fillStyle = fillColor
    ctx.fillRect(0, 0, this.width, this.height)
  }

  /** 导出画布为数据 URL */
  exportToDataURL(format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality = 1.0): string {
    return this.canvas.toDataURL(format, quality)
  }

  /** 导出画布为 Blob */
  async exportToBlob(format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality = 1.0): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Export failed'))
        },
        format,
        quality
      )
    })
  }

  /** 获取画布原始尺寸 */
  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height }
  }

  /** 清理资源 */
  dispose(): void {
    for (const bitmap of this.imageCache.values()) {
      bitmap.close()
    }
    this.imageCache.clear()
  }
}
```

---

## Step 2：Canvas React 组件

**文件路径：** `src/components/workshop/WorkshopCanvas.tsx`

```typescript
'use client'

/**
 * WorkshopCanvas — 画布 React 组件
 *
 * 桥接 CanvasEngine (纯 JS) 与 React Store。
 * 负责：
 * 1. 创建和管理 Canvas DOM 元素
 * 2. 监听 Store 变化触发重绘
 * 3. 处理指针事件（平移/缩放）
 * 4. 管理画布缩放/平移视口
 */
import { useRef, useEffect, useCallback, useState } from 'react'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { CanvasEngine } from '@/lib/workshop/canvasEngine'
import { Icon } from '@/components/icons/Icon'

export function WorkshopCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<CanvasEngine | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Store subscriptions ───────────────────────────────
  const layers = useWorkshopStore((s) => s.layers)
  const canvasSize = useWorkshopStore((s) => s.canvasSize)
  const zoom = useWorkshopStore((s) => s.zoom)
  const setZoom = useWorkshopStore((s) => s.setZoom)
  const panOffset = useWorkshopStore((s) => s.panOffset)
  const setPanOffset = useWorkshopStore((s) => s.setPanOffset)
  const symmetry = useWorkshopStore((s) => s.symmetry)
  const selectedPattern = useWorkshopStore((s) => s.selectedSourcePattern)
  const addLayer = useWorkshopStore((s) => s.addLayer)

  // ── 初始化引擎 ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new CanvasEngine(canvas, canvasSize.width, canvasSize.height)
    engineRef.current = engine

    // 首次渲染
    engine.render(layers, symmetry)

    return () => {
      engine.dispose()
      engineRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 仅挂载时创建

  // ── 画布尺寸变化 ──────────────────────────────────────
  useEffect(() => {
    engineRef.current?.resize(canvasSize.width, canvasSize.height)
    engineRef.current?.render(layers, symmetry)
  }, [canvasSize, layers, symmetry])

  // ── 响应图层/对称变化重绘 ──────────────────────────────
  useEffect(() => {
    engineRef.current?.render(layers, symmetry)
  }, [layers, symmetry])

  // ── 纹样选中 → 自动添加图层 ────────────────────────────
  useEffect(() => {
    if (!selectedPattern || !engineRef.current) return

    const imageUrl = selectedPattern.media?.[0]?.url
    if (!imageUrl) return

    const layerId = `pattern-${selectedPattern.id}-${Date.now()}`

    // 异步加载图片
    engineRef.current.loadImage(layerId, imageUrl).then(() => {
      addLayer({
        name: selectedPattern.name,
        type: 'pattern',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'source-over',
        sourceImageUrl: imageUrl,
        sourcePatternId: selectedPattern.id,
        sourcePatternName: selectedPattern.name,
        transform: {
          x: 0, y: 0,
          scaleX: 1, scaleY: 1,
          rotation: 0,
          flipH: false, flipV: false,
        },
        colorAdjust: {
          hue: 0, saturation: 0, brightness: 0,
          contrast: 0, temperature: 0, tint: null,
        },
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPattern])

  // ── 鼠标滚轮缩放 ──────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    },
    [zoom, setZoom]
  )

  // ── 中键平移 ──────────────────────────────────────────
  const [isPanning, setIsPanning] = useState(false)
  const lastPan = useRef({ x: 0, y: 0 })

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1) { // 中键
      setIsPanning(true)
      lastPan.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return
      const dx = e.clientX - lastPan.current.x
      const dy = e.clientY - lastPan.current.y
      lastPan.current = { x: e.clientX, y: e.clientY }
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
    },
    [isPanning, panOffset, setPanOffset]
  )

  const handlePointerUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex-1 relative flex items-center justify-center bg-rice-warm overflow-hidden"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* 棋盘格背景（指示透明区域） */}
      <div className="absolute inset-0 opacity-30 bg-[length:20px_20px] bg-[image:linear-gradient(45deg,_#d6ccba_25%,_transparent_25%,_transparent_75%,_#d6ccba_75%),linear-gradient(45deg,_#d6ccba_25%,_transparent_25%,_transparent_75%,_#d6ccba_75%)] bg-[position:0_0,_10px_10px]" />

      {/* Canvas 元素 */}
      <CanvasWrapper
        ref={canvasRef}
        zoom={zoom}
        panX={panOffset.x}
        panY={panOffset.y}
      />

      {/* 缩放指示器 */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-ink-light shadow-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}

/**
 * CanvasWrapper — 管理 canvas 元素的 transform（zoom + pan）
 * 使用 ref 设置 transform 避免 inline style
 */
import { forwardRef } from 'react'

interface CanvasWrapperProps {
  zoom: number
  panX: number
  panY: number
}

const CanvasWrapper = forwardRef<HTMLCanvasElement, CanvasWrapperProps>(
  function CanvasWrapper({ zoom, panX, panY }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`
      }
    }, [zoom, panX, panY])

    return (
      <div ref={wrapperRef} className="relative transition-transform duration-75 origin-center">
        <canvas
          ref={ref}
          className="block shadow-lg rounded-sm bg-white"
        />
      </div>
    )
  }
)
```

---

## Step 3：图层管理面板

**文件路径：** `src/components/workshop/LayerPanel.tsx`

```typescript
'use client'

/**
 * LayerPanel — 图层管理面板
 *
 * 功能：
 * - 显示图层列表（名称 + 可见性 + 锁定）
 * - 选中图层高亮
 * - 拖拽排序（简单版用按钮上下移动）
 * - 删除图层
 * - 调节图层透明度
 * - 切换混合模式
 *
 * 位置：侧栏下方或底部（Round 5 集成时确定）
 */
import { memo, useCallback } from 'react'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import ParameterSlider from '@/components/ui/ParameterSlider'
import { BLEND_MODE_LABELS } from '@/types/workshop'
import type { CanvasBlendMode } from '@/types/workshop'

export const LayerPanel = memo(function LayerPanel() {
  const layers = useWorkshopStore((s) => s.layers)
  const activeLayerId = useWorkshopStore((s) => s.activeLayerId)
  const setActiveLayer = useWorkshopStore((s) => s.setActiveLayer)
  const updateLayer = useWorkshopStore((s) => s.updateLayer)
  const removeLayer = useWorkshopStore((s) => s.removeLayer)
  const reorderLayers = useWorkshopStore((s) => s.reorderLayers)

  const handleToggleVisibility = useCallback(
    (id: string, currentVisible: boolean) => {
      updateLayer(id, { visible: !currentVisible })
    },
    [updateLayer]
  )

  const handleToggleLock = useCallback(
    (id: string, currentLocked: boolean) => {
      updateLayer(id, { locked: !currentLocked })
    },
    [updateLayer]
  )

  const handleOpacityChange = useCallback(
    (id: string, opacity: number) => {
      updateLayer(id, { opacity })
    },
    [updateLayer]
  )

  const handleBlendModeChange = useCallback(
    (id: string, blendMode: CanvasBlendMode) => {
      updateLayer(id, { blendMode })
    },
    [updateLayer]
  )

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index < layers.length - 1) reorderLayers(index, index + 1)
    },
    [layers.length, reorderLayers]
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index > 0) reorderLayers(index, index - 1)
    },
    [reorderLayers]
  )

  // 从上到下显示（最上层图层在列表顶部）
  const reversedLayers = [...layers].reverse()

  return (
    <div className="border-t border-rice-deep bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-rice-deep/50">
        <h3 className="text-xs font-bold text-ink-faint uppercase tracking-wider">
          图层
        </h3>
        <span className="text-xs text-ink-faint">{layers.length} 层</span>
      </div>

      <div className="max-h-48 overflow-y-auto custom-scrollbar">
        {reversedLayers.map((layer) => {
          const originalIndex = layers.indexOf(layer)
          const isActive = activeLayerId === layer.id
          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-gold/10 border-l-2 border-gold'
                  : 'hover:bg-rice-warm border-l-2 border-transparent'
              }`}
            >
              {/* 可见性 */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer.id, layer.visible) }}
                className="text-ink-faint hover:text-ink-medium"
              >
                <Icon name={layer.visible ? 'visibility' : 'visibility_off'} size={16} />
              </button>

              {/* 名称 */}
              <span className={`flex-1 text-xs font-medium truncate ${
                isActive ? 'text-ink font-bold' : 'text-ink-light'
              }`}>
                {layer.name}
              </span>

              {/* 透明度值 */}
              <span className="text-[10px] text-ink-faint w-8 text-right">
                {layer.opacity}%
              </span>

              {/* 锁定 */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleLock(layer.id, layer.locked) }}
                className="text-ink-faint hover:text-ink-medium"
              >
                <Icon name={layer.locked ? 'lock' : 'lock_open'} size={14} />
              </button>

              {/* 删除 */}
              {layer.id !== 'bg-default' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id) }}
                  className="text-ink-faint hover:text-cinnabar"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 活动图层详细控制 */}
      {activeLayerId && (
        <ActiveLayerControls layerId={activeLayerId} />
      )}
    </div>
  )
})

/** 活动图层的详细参数控制 */
function ActiveLayerControls({ layerId }: { layerId: string }) {
  const layer = useWorkshopStore((s) => s.layers.find((l) => l.id === layerId))
  const updateLayer = useWorkshopStore((s) => s.updateLayer)

  if (!layer) return null

  return (
    <div className="px-4 py-3 border-t border-rice-deep/50 space-y-3">
      <ParameterSlider
        label="透明度"
        value={layer.opacity}
        onChange={(v) => updateLayer(layerId, { opacity: v })}
        primaryColor="gold"
      />

      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-ink-faint uppercase tracking-tighter whitespace-nowrap">
          混合
        </label>
        <select
          value={layer.blendMode}
          onChange={(e) => updateLayer(layerId, { blendMode: e.target.value as CanvasBlendMode })}
          className="flex-1 text-xs bg-rice-warm border border-rice-deep rounded px-2 py-1
                     focus:ring-1 focus:ring-gold/30"
        >
          {Object.entries(BLEND_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

---

## 验证步骤

```bash
npm run build
npm run lint
npm run dev
# 访问 http://localhost:6427/workshop
```

验证要点：
- [ ] 中央区域显示白色 Canvas 画布（带棋盘格透明指示背景）
- [ ] 左下角显示缩放百分比指示器
- [ ] 从右侧面板选中纹样后：
  - 纹样图片加载到 Canvas（异步，需等待图片下载）
  - 图层面板新增一个图层条目
  - Canvas 上显示纹样图片
- [ ] 图层可见性切换（眼睛图标）→ Canvas 即时更新
- [ ] 图层透明度滑块 → Canvas 即时更新
- [ ] 图层混合模式下拉 → Canvas 即时更新
- [ ] 鼠标滚轮缩放 Canvas
- [ ] 选择多个纹样 → 多图层叠加
- [ ] 删除图层 → Canvas 即时更新

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/workshop/canvasEngine.ts` | 新建 | Canvas 2D 渲染引擎核心 |
| `src/components/workshop/WorkshopCanvas.tsx` | 新建 | Canvas React 组件 |
| `src/components/workshop/LayerPanel.tsx` | 新建 | 图层管理面板 |

---

**下一步：执行 Round 4 (`04-tools-transforms.md`)**
