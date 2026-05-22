'use client'

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
  const activeTool = useWorkshopStore(state => state.activeTool)
  const setActiveTool = useWorkshopStore(state => state.setActiveTool)
  const zoom = useWorkshopStore(state => state.zoom)
  const setZoom = useWorkshopStore(state => state.setZoom)
  const resetViewport = useWorkshopStore(state => state.resetViewport)

  return (
    <aside className="hidden w-14 flex-col items-center gap-2 border-r border-rice-deep bg-rice py-4 lg:flex">
      {TOOLS.map(tool => {
        const isActive = activeTool === tool.id
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveTool(tool.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              isActive
                ? 'bg-gold text-white shadow-sm'
                : 'text-ink-light hover:bg-rice-warm hover:text-ink-medium'
            }`}
            title={tool.label}
            aria-label={tool.label}
          >
            <Icon name={tool.icon} size={20} />
          </button>
        )
      })}

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => setZoom(zoom + 0.1)}
        className="flex h-8 w-8 items-center justify-center rounded text-ink-faint transition-colors hover:bg-rice-warm hover:text-ink-medium"
        title="放大"
        aria-label="放大"
      >
        <Icon name="add" size={18} />
      </button>
      <button
        type="button"
        onClick={resetViewport}
        className="rounded px-1 py-0.5 text-[10px] font-bold text-ink-faint transition-colors hover:bg-rice-warm hover:text-ink-medium"
        title="重置视口"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={() => setZoom(zoom - 0.1)}
        className="flex h-8 w-8 items-center justify-center rounded text-ink-faint transition-colors hover:bg-rice-warm hover:text-ink-medium"
        title="缩小"
        aria-label="缩小"
      >
        <Icon name="remove" size={18} />
      </button>
    </aside>
  )
})
