import { Icon } from '@/components/icons/Icon'
import type { PatternListItem } from '@/types/pattern'
import { CANVAS_PRESETS } from '@/types/workshop'

interface WorkshopTopBarProps {
  selectedPattern: PatternListItem | null
  canvasSize: { width: number; height: number }
  setCanvasSize: (size: { width: number; height: number }) => void
  layerCount: number
  resetViewport: () => void
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  openExport: () => void
}

export function WorkshopTopBar({
  selectedPattern,
  canvasSize,
  setCanvasSize,
  layerCount,
  resetViewport,
  canUndo,
  canRedo,
  undo,
  redo,
  openExport,
}: WorkshopTopBarProps) {
  const activePreset =
    CANVAS_PRESETS.find(preset => preset.width === canvasSize.width && preset.height === canvasSize.height)?.id ??
    'custom'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rice-deep/40 bg-white/85 px-4 py-2 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="font-medium text-gold/70">跨界工坊</span>
        <Icon name="chevron_right" size={12} className="text-ink-faint" />
        <span className="truncate font-bold text-ink">
          {selectedPattern?.name ?? '选择纹样开始创作'}
        </span>
        {selectedPattern?.era && (
          <span className="hidden text-xs text-ink-faint md:inline">
            {selectedPattern.era}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="hidden h-8 w-8 items-center justify-center rounded border border-rice-deep bg-white text-ink-light transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-35 md:flex"
          title="撤销"
          aria-label="撤销"
        >
          <Icon name="undo" size={16} />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className="hidden h-8 w-8 items-center justify-center rounded border border-rice-deep bg-white text-ink-light transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-35 md:flex"
          title="重做"
          aria-label="重做"
        >
          <Icon name="redo" size={16} />
        </button>
        <span className="rounded bg-rice-warm px-2 py-1 text-xs font-bold text-ink-faint">
          {layerCount} 图层
        </span>
        <span className="hidden text-xs font-medium text-ink-faint md:inline">
          {canvasSize.width} × {canvasSize.height}
        </span>
        <select
          value={activePreset}
          onChange={event => {
            const preset = CANVAS_PRESETS.find(item => item.id === event.target.value)
            if (!preset) return
            setCanvasSize({ width: preset.width, height: preset.height })
            resetViewport()
          }}
          className="rounded border border-rice-deep bg-rice-warm px-2 py-1 text-xs font-bold text-ink-medium outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/30"
          aria-label="画布尺寸"
        >
          {activePreset === 'custom' && <option value="custom">自定义尺寸</option>}
          {CANVAS_PRESETS.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={resetViewport}
          className="flex items-center gap-1 rounded border border-rice-deep bg-white px-2 py-1 text-xs font-bold text-ink-light transition-colors hover:border-gold/40 hover:text-gold"
        >
          <Icon name="center_focus_strong" size={14} />
          复位
        </button>
        <button
          type="button"
          onClick={openExport}
          className="flex items-center gap-1 rounded bg-ink px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-ink-medium"
        >
          <Icon name="download" size={14} />
          导出
        </button>
      </div>
    </div>
  )
}
