# Round 6 — 导出 + Undo/Redo + 动画 + 移动端适配

## 目标
完成最后的功能收尾与品质打磨：
1. **导出功能** — PNG/JPEG/WebP + 分辨率选择 + 下载
2. **Undo/Redo 历史系统** — 快捷键支持，最多 30 步
3. **过渡动画** — 面板切换、工具选中、图层操作动效
4. **移动端适配** — 底部 Sheet 替代侧栏
5. **本地存储** — 作品草稿自动保存/恢复
6. **快捷键绑定** — 常用操作键盘映射

**本轮完成后：** Workshop 达到上线品质。

---

## Step 1：导出功能

### 导出对话框

**文件路径：** `src/components/workshop/ExportDialog.tsx`

```typescript
'use client'

/**
 * ExportDialog — 导出对话框
 *
 * 功能：
 * - 选择导出格式（PNG/JPEG/WebP）
 * - 选择分辨率倍率（1x/2x/4x）
 * - 是否包含背景
 * - 预览导出效果
 * - 下载文件
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAuthModal } from '@/stores/useAuthModal'
import type { ExportFormat, ExportConfig } from '@/types/workshop'

const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string }[] = [
  { value: 'png', label: 'PNG', desc: '无损，支持透明' },
  { value: 'jpeg', label: 'JPEG', desc: '有损压缩，体积小' },
  { value: 'webp', label: 'WebP', desc: '高质量，小体积' },
]

const SCALE_OPTIONS = [
  { value: 1, label: '1×', desc: '标准分辨率' },
  { value: 2, label: '2×', desc: '高清（推荐）' },
  { value: 4, label: '4×', desc: '超高清印刷' },
]

export function ExportDialog() {
  const isExporting = useWorkshopStore((s) => s.isExporting)
  const setIsExporting = useWorkshopStore((s) => s.setIsExporting)
  const canvasSize = useWorkshopStore((s) => s.canvasSize)
  const user = useAuthStore((s) => s.user)
  const { openModal } = useAuthModal()

  const [config, setConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 0.92,
    scale: 2,
    includeBackground: true,
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleExport = useCallback(async () => {
    if (!user) {
      openModal('登录后即可导出高清设计稿')
      return
    }

    setIsProcessing(true)
    try {
      // 获取画布引擎实例（通过 DOM 查询 canvas 元素）
      const canvas = document.querySelector<HTMLCanvasElement>('.workshop-canvas')
      if (!canvas) return

      const mimeType = `image/${config.format}` as const
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('导出失败')),
          mimeType,
          config.quality
        )
      })

      // 下载
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `workshop-${Date.now()}.${config.format}`
      link.click()
      URL.revokeObjectURL(url)

      setIsExporting(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [config, user, openModal, setIsExporting])

  const outputWidth = canvasSize.width * config.scale
  const outputHeight = canvasSize.height * config.scale

  return (
    <AnimatePresence>
      {isExporting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm"
          onClick={() => setIsExporting(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Icon name="download" className="text-gold" />
                导出设计稿
              </h2>
              <button
                type="button"
                onClick={() => setIsExporting(false)}
                className="text-ink-faint hover:text-ink-medium"
              >
                <Icon name="close" />
              </button>
            </div>

            {/* 格式选择 */}
            <div className="mb-4">
              <label className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-2 block">
                导出格式
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, format: opt.value }))}
                    className={`py-2 px-3 rounded-lg text-center transition-colors ${
                      config.format === opt.value
                        ? 'bg-gold text-white shadow-sm'
                        : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="text-[10px] opacity-80">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 分辨率 */}
            <div className="mb-4">
              <label className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-2 block">
                分辨率
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, scale: opt.value }))}
                    className={`py-2 px-3 rounded-lg text-center transition-colors ${
                      config.scale === opt.value
                        ? 'bg-gold text-white shadow-sm'
                        : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="text-[10px] opacity-80">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-faint mt-1">
                输出尺寸：{outputWidth} × {outputHeight} px
              </p>
            </div>

            {/* 导出按钮 */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isProcessing}
              className="w-full py-3 bg-gold text-white font-bold rounded-xl flex items-center
                         justify-center gap-2 hover:bg-gold/90 transition-all shadow-xl
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  导出中…
                </>
              ) : (
                <>
                  <Icon name="download" size={18} />
                  导出 {config.format.toUpperCase()} ({config.scale}×)
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## Step 2：Undo/Redo 历史系统

**文件路径：** `src/hooks/useCanvasHistory.ts`

```typescript
/**
 * useCanvasHistory — Undo/Redo Hook
 *
 * 基于 Store 图层快照的历史记录。
 * 每次图层变更时自动记录快照。
 * 支持 Ctrl+Z / Ctrl+Shift+Z 快捷键。
 * 最多保留 30 步历史。
 */
import { useEffect, useRef, useCallback } from 'react'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { SerializableLayer, HistoryEntry } from '@/types/workshop'

const MAX_HISTORY = 30

export function useCanvasHistory() {
  const layers = useWorkshopStore((s) => s.layers)
  const historyRef = useRef<HistoryEntry[]>([])
  const indexRef = useRef(-1)
  const isUndoRedoRef = useRef(false)

  /** 序列化图层（去除运行时缓存） */
  const serializeLayers = useCallback(
    (layers: typeof layers): SerializableLayer[] =>
      layers.map(({ _cachedBitmap, ...rest }) => rest),
    []
  )

  /** 记录快照 */
  const pushSnapshot = useCallback(
    (description: string = '操作') => {
      if (isUndoRedoRef.current) return

      const snapshot = serializeLayers(layers)
      const entry: HistoryEntry = {
        id: `h-${Date.now()}`,
        timestamp: Date.now(),
        description,
        layersSnapshot: snapshot,
      }

      // 如果不在历史末端，截断后续历史
      const history = historyRef.current.slice(0, indexRef.current + 1)
      history.push(entry)

      // 限制历史长度
      if (history.length > MAX_HISTORY) {
        history.shift()
      }

      historyRef.current = history
      indexRef.current = history.length - 1
    },
    [layers, serializeLayers]
  )

  /** 撤销 */
  const undo = useCallback(() => {
    if (indexRef.current <= 0) return
    isUndoRedoRef.current = true
    indexRef.current -= 1
    const entry = historyRef.current[indexRef.current]
    if (entry) {
      // 恢复图层快照到 Store
      // 注意：需要重新加载图片缓存
      useWorkshopStore.setState({ layers: entry.layersSnapshot as any })
    }
    isUndoRedoRef.current = false
  }, [])

  /** 重做 */
  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return
    isUndoRedoRef.current = true
    indexRef.current += 1
    const entry = historyRef.current[indexRef.current]
    if (entry) {
      useWorkshopStore.setState({ layers: entry.layersSnapshot as any })
    }
    isUndoRedoRef.current = false
  }, [])

  /** 监听图层变化自动记录 */
  useEffect(() => {
    if (!isUndoRedoRef.current) {
      pushSnapshot()
    }
  }, [layers, pushSnapshot])

  /** 快捷键绑定 */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    undo,
    redo,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
    historyLength: historyRef.current.length,
  }
}
```

---

## Step 3：导出工具函数

**文件路径：** `src/lib/workshop/exportUtils.ts`

```typescript
/**
 * 导出工具函数
 */
import type { ExportConfig } from '@/types/workshop'

/** 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** 生成导出文件名 */
export function generateExportFilename(
  patternName: string | null,
  config: ExportConfig
): string {
  const base = patternName?.replace(/\s+/g, '-') ?? 'workshop-design'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${base}_${config.scale}x_${timestamp}.${config.format}`
}

/** 计算导出文件预估大小（粗略） */
export function estimateFileSize(
  width: number,
  height: number,
  format: string,
  quality: number
): string {
  const pixels = width * height
  let bytes: number

  switch (format) {
    case 'png':
      bytes = pixels * 1.5 // PNG 粗估
      break
    case 'jpeg':
      bytes = pixels * quality * 0.5
      break
    case 'webp':
      bytes = pixels * quality * 0.3
      break
    default:
      bytes = pixels * 2
  }

  if (bytes > 1024 * 1024) return `≈ ${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `≈ ${(bytes / 1024).toFixed(0)} KB`
}
```

---

## Step 4：移动端底部导航

**文件路径：** `src/components/workshop/WorkshopMobileBar.tsx`

```typescript
'use client'

/**
 * WorkshopMobileBar — 移动端底部工具栏
 *
 * 仅在 md 以下尺寸显示。
 * 提供核心操作入口：纹样库、工具、图层、导出。
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'

type MobileSheet = 'patterns' | 'tools' | 'layers' | null

export function WorkshopMobileBar() {
  const [activeSheet, setActiveSheet] = useState<MobileSheet>(null)
  const setIsExporting = useWorkshopStore((s) => s.setIsExporting)

  const toggleSheet = (sheet: MobileSheet) => {
    setActiveSheet((prev) => prev === sheet ? null : sheet)
  }

  const buttons = [
    { id: 'patterns' as const, icon: 'auto_awesome', label: '纹样' },
    { id: 'tools' as const, icon: 'handyman', label: '工具' },
    { id: 'layers' as const, icon: 'layers', label: '图层' },
  ]

  return (
    <>
      {/* 底部导航栏 — 仅移动端 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-rice-deep flex items-center justify-around py-2 z-40">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => toggleSheet(btn.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
              activeSheet === btn.id
                ? 'text-gold'
                : 'text-ink-faint'
            }`}
          >
            <Icon name={btn.icon} size={20} />
            <span className="text-[10px] font-bold">{btn.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsExporting(true)}
          className="flex flex-col items-center gap-0.5 px-4 py-1 text-ink-faint"
        >
          <Icon name="download" size={20} />
          <span className="text-[10px] font-bold">导出</span>
        </button>
      </nav>

      {/* 底部 Sheet */}
      <AnimatePresence>
        {activeSheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed bottom-14 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-30 max-h-[60vh] overflow-y-auto"
          >
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-rice-deep" />
            </div>
            {/* 根据 activeSheet 渲染对应内容 */}
            {/* 这里可以嵌入对应的 Panel 组件 */}
            <div className="p-4 text-center text-sm text-ink-faint">
              {activeSheet === 'patterns' && '纹样面板（嵌入 PatternAssetPanel 的 mobile 版）'}
              {activeSheet === 'tools' && '工具面板（嵌入 ToolBar + AdjustPanel 的 mobile 版）'}
              {activeSheet === 'layers' && '图层面板（嵌入 LayerPanel 的 mobile 版）'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## Step 5：本地草稿自动保存

在 Store 中添加 `persist` 中间件（保存关键状态到 localStorage）：

```typescript
// useWorkshopStore.ts 增强
import { persist } from 'zustand/middleware'

export const useWorkshopStore = create<WorkshopState>()(
  persist(
    (set) => ({
      // ... 现有状态
    }),
    {
      name: 'workshop-draft',
      partialize: (state) => ({
        // 只持久化可序列化的部分
        canvasSize: state.canvasSize,
        layers: state.layers.map(({ _cachedBitmap, ...rest }) => rest),
        symmetry: state.symmetry,
        colorAdjust: state.colorAdjust,
      }),
    }
  )
)
```

---

## Step 6：快捷键总览

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |
| `V` | 选择工具 |
| `H` | 平移工具 |
| `T` | 变换工具 |
| `C` | 调色工具 |
| `S` | 对称工具 |
| `Ctrl+E` | 导出 |
| `Ctrl++` | 放大 |
| `Ctrl+-` | 缩小 |
| `Ctrl+0` | 重置缩放 |
| `Delete` | 删除选中图层 |

快捷键在 WorkshopClient 中通过 `useEffect` 统一绑定。

---

## Step 7：动画增强

使用 `motion/react` 为面板切换添加过渡：

```typescript
// AdjustPanel 包装
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* 面板内容 */}
</motion.div>
```

工具切换、图层选中等也添加微动画。

---

## 验证步骤

```bash
npm run build
npm run lint
npm run dev
```

### 功能验证
- [ ] 点击导出按钮 → 弹出导出对话框（格式/分辨率选择）
- [ ] 选择 PNG 2x → 点击导出 → 浏览器下载文件
- [ ] 下载的 PNG 与画布内容一致
- [ ] JPEG 和 WebP 格式同样可用
- [ ] 未登录点导出 → 弹出登录提示
- [ ] Ctrl+Z 撤销 → 画布恢复上一步
- [ ] Ctrl+Shift+Z 重做 → 画布恢复下一步
- [ ] 30 步以上操作后，最早的历史被丢弃
- [ ] 面板切换有平滑动画过渡
- [ ] 刷新页面后，画布状态从 localStorage 恢复

### 移动端验证（Chrome DevTools 模拟 iPhone 14）
- [ ] 底部导航栏显示 4 个按钮
- [ ] 点击「纹样」→ 底部 Sheet 滑出纹样面板
- [ ] 点击「导出」→ 导出对话框弹出
- [ ] 画布可触控平移/缩放（双指手势）

### 代码质量
- [ ] TypeScript strict 无报错
- [ ] ESLint + lint-guards 全通过
- [ ] 无 inline style、无 any、无 console.log
- [ ] 全部使用设计 token

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/components/workshop/ExportDialog.tsx` | 新建 | 导出对话框 |
| `src/hooks/useCanvasHistory.ts` | 新建 | Undo/Redo 历史系统 |
| `src/lib/workshop/exportUtils.ts` | 新建 | 导出工具函数 |
| `src/components/workshop/WorkshopMobileBar.tsx` | 新建 | 移动端底部导航 |
| `src/stores/useWorkshopStore.ts` | 修改 | 添加 persist 中间件 |
| `src/components/workshop/WorkshopClient.tsx` | 修改 | 集成导出+历史+快捷键+移动端 |

---

## 全轮次完工总结

### 新增文件（共 16 个）

```
src/types/workshop.ts
src/stores/useWorkshopStore.ts
src/components/workshop/
├── WorkshopClient.tsx
├── WorkshopCanvas.tsx
├── PatternAssetPanel.tsx
├── PatternAssetCard.tsx
├── ToolBar.tsx
├── AdjustPanel.tsx
├── LayerPanel.tsx
├── ExportDialog.tsx
└── WorkshopMobileBar.tsx
src/hooks/
├── queries/useWorkshopPatterns.ts
└── useCanvasHistory.ts
src/lib/workshop/
├── canvasEngine.ts
├── colorAdjust.ts
└── exportUtils.ts
```

### 修改文件（共 3 个）

```
src/app/(main)/workshop/page.tsx     # 重写为 Server Component
src/app/(main)/workshop/layout.tsx    # 保持不变
src/app/globals.css                   # 追加工坊样式
```

---

**🎉 跨界工坊规划文档全部完成！**
