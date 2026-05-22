# Round 5 — 完整页面集成 + 布局系统

## 目标
将 Round 2-4 所有组件整合到最终的 Workshop 页面布局中。
实现完整的三区布局：左工具栏 + 中画布 + 右素材面板，
以及底部浮动调参面板。

**本轮完成后：** Workshop 页面达到功能完整、视觉统一的生产级状态。

---

## 上下文摘要

| 项目 | 值 |
|------|------|
| Round 2 | PatternAssetPanel, PatternAssetCard（右侧面板） |
| Round 3 | WorkshopCanvas, LayerPanel（中画布 + 图层面板） |
| Round 4 | ToolBar, AdjustPanel（左工具栏 + 参数面板） |
| 当前状态 | WorkshopClient.tsx 为临时拼装版，需最终集成 |

---

## 最终布局架构

```
┌──────────────────────────────────────────────────────────┐
│  SiteHeader (logoIcon="grid_view", primaryColor="gold")  │
├──┬───────────────────────────────────────────────────┬───┤
│  │                                                   │   │
│  │    ┌────────────────────────────────────┐          │ P │
│  │    │                                    │          │ a │
│T │    │        WorkshopCanvas              │          │ t │
│o │    │       (Canvas 2D 绘制区)            │          │ t │
│o │    │                                    │          │ e │
│l │    └────────────────────────────────────┘          │ r │
│B │                                                   │ n │
│a │    ┌────────────────────────────────────┐          │ A │
│r │    │    AdjustPanel (浮动调参面板)        │          │ s │
│  │    └────────────────────────────────────┘          │ s │
│  │                                                   │ e │
│  │    ┌────────────────────────────────────┐          │ t │
│  │    │    LayerPanel (图层管理)             │          │ P │
│  │    └────────────────────────────────────┘          │ a │
│  │                                                   │ n │
├──┴───────────────────────────────────────────────────┤ e │
│                      底部状态栏 (可选)                │ l │
└──────────────────────────────────────────────────────┴───┘
```

---

## Step 1：最终 WorkshopClient 集成

**文件路径：** `src/components/workshop/WorkshopClient.tsx`

```typescript
'use client'

/**
 * WorkshopClient — 工坊主容器（最终版）
 *
 * 三区布局：左工具栏 + 中画布区 + 右素材面板
 * 中区包含：面包屑 → Canvas → 浮动调参 → 图层面板
 */
import SiteHeader from '@/components/layout/SiteHeader'
import { Icon } from '@/components/icons/Icon'
import { ToolBar } from './ToolBar'
import { WorkshopCanvas } from './WorkshopCanvas'
import { AdjustPanel } from './AdjustPanel'
import { LayerPanel } from './LayerPanel'
import { PatternAssetPanel } from './PatternAssetPanel'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAuthModal } from '@/stores/useAuthModal'
import type { PatternListItem } from '@/types/pattern'
import { CANVAS_PRESETS } from '@/types/workshop'

interface Props {
  initialPatterns: PatternListItem[]
  initialTotal: number
}

export default function WorkshopClient({ initialPatterns, initialTotal }: Props) {
  const selectedPattern = useWorkshopStore((s) => s.selectedSourcePattern)
  const canvasSize = useWorkshopStore((s) => s.canvasSize)
  const setCanvasSize = useWorkshopStore((s) => s.setCanvasSize)
  const layers = useWorkshopStore((s) => s.layers)
  const user = useAuthStore((s) => s.user)
  const { openModal } = useAuthModal()

  function requireAuth(message: string, action: () => void) {
    if (!user) { openModal(message); return }
    action()
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-rice">
      <SiteHeader logoIcon="grid_view" siteName="纹样+ 跨界创作工坊" primaryColor="gold" />

      <main className="flex flex-1 overflow-hidden">
        {/* 左侧工具栏 */}
        <ToolBar />

        {/* 中间画布区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部操作栏 */}
          <WorkshopTopBar
            selectedPattern={selectedPattern}
            canvasSize={canvasSize}
            setCanvasSize={setCanvasSize}
            layerCount={layers.length}
          />

          {/* 画布 */}
          <WorkshopCanvas />

          {/* 底部调参面板 + 图层 */}
          <div className="flex-shrink-0">
            <AdjustPanel />
            <LayerPanel />
          </div>
        </div>

        {/* 右侧纹样面板 */}
        <PatternAssetPanel
          initialPatterns={initialPatterns}
          initialTotal={initialTotal}
        />
      </main>
    </div>
  )
}

// ── 顶部操作栏 ──────────────────────────────────────────────────────────

interface TopBarProps {
  selectedPattern: PatternListItem | null
  canvasSize: { width: number; height: number }
  setCanvasSize: (size: { width: number; height: number }) => void
  layerCount: number
}

function WorkshopTopBar({ selectedPattern, canvasSize, setCanvasSize, layerCount }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur border-b border-rice-deep/30">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gold/60 font-medium">跨界工坊</span>
        <Icon name="chevron_right" size={12} className="text-ink-faint" />
        <span className="text-ink font-bold truncate max-w-48">
          {selectedPattern?.name ?? '选择纹样开始'}
        </span>
        {selectedPattern?.era && (
          <>
            <span className="text-ink-faint">·</span>
            <span className="text-xs text-ink-faint">{selectedPattern.era}</span>
          </>
        )}
      </div>

      {/* 画布尺寸预设 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-faint">
          {canvasSize.width} × {canvasSize.height}
        </span>
        <select
          onChange={(e) => {
            const preset = CANVAS_PRESETS.find((p) => p.id === e.target.value)
            if (preset) setCanvasSize({ width: preset.width, height: preset.height })
          }}
          className="text-xs bg-rice-warm border border-rice-deep rounded px-2 py-1
                     focus:ring-1 focus:ring-gold/30"
        >
          {CANVAS_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.width}×{p.height})
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-faint">{layerCount} 图层</span>
      </div>
    </div>
  )
}
```

---

## Step 2：添加工坊 CSS 到 globals.css

在 `globals.css` 中追加工坊特有样式（如果需要自定义 token）：

```css
/* ── 跨界工坊 ── */
.workshop-canvas-grid {
  /* 棋盘格背景 — 已在 WorkshopCanvas 中用 Tailwind 实现 */
}

.workshop-layer-item:active {
  cursor: grabbing;
}
```

> 注：大部分样式使用 Tailwind 类名实现，仅在极少数情况下需要自定义 CSS。

---

## Step 3：确保 page.tsx Server Component 正确

Round 2 已将 `page.tsx` 改为 Server Component，此轮确保其保持简洁：

```typescript
import { getPatterns } from '@/lib/queries'
import WorkshopClient from '@/components/workshop/WorkshopClient'

export default async function WorkshopPage() {
  const { patterns: initialPatterns, total } = await getPatterns({
    limit: 20,
    sort: 'newest',
  })

  return (
    <WorkshopClient
      initialPatterns={initialPatterns}
      initialTotal={total}
    />
  )
}
```

---

## Step 4：确保移动端基础可用

工具栏和侧栏在移动端隐藏，仅保留画布和简化的底部导航：

```typescript
// ToolBar 增加响应式
<aside className="w-14 border-r border-rice-deep flex-col items-center py-4 gap-2 bg-rice hidden md:flex">

// PatternAssetPanel 增加响应式
<aside className="w-80 lg:w-96 border-l border-rice-deep/50 flex-col bg-white hidden lg:flex">
```

移动端完整体验在 Round 6 实现。

---

## 验证步骤

```bash
npm run build
npm run lint
npm run dev
```

- [ ] 三区布局正确渲染：左工具栏 | 中画布 | 右素材面板
- [ ] 顶部操作栏显示：面包屑 + 画布尺寸选择器 + 图层数
- [ ] 切换画布尺寸预设 → Canvas 重新调整大小
- [ ] 选中纹样 → 面包屑更新为纹样名称
- [ ] 底部调参面板根据工具切换动态显示/隐藏
- [ ] 图层面板正确显示当前图层列表
- [ ] 中屏 (768px-1024px)：隐藏右侧面板，保留工具栏
- [ ] 小屏 (<768px)：隐藏工具栏和右面板，仅画布 + 底部调参
- [ ] 所有组件使用项目 token，无硬编码颜色

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/components/workshop/WorkshopClient.tsx` | **重写** | 最终集成版 |
| `src/app/(main)/workshop/page.tsx` | 确认 | 保持 Server Component |
| `src/app/globals.css` | 小改 | 追加工坊专用样式（可选） |

---

**下一步：执行 Round 6 (`06-export-history-polish.md`)**
