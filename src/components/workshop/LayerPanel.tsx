'use client'

import { memo, useCallback } from 'react'
import ParameterSlider from '@/components/ui/ParameterSlider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { BLEND_MODE_LABELS } from '@/types/workshop'
import type { CanvasBlendMode } from '@/types/workshop'

export const LayerPanel = memo(function LayerPanel() {
  const layers = useWorkshopStore(state => state.layers)
  const activeLayerId = useWorkshopStore(state => state.activeLayerId)
  const setActiveLayer = useWorkshopStore(state => state.setActiveLayer)
  const updateLayer = useWorkshopStore(state => state.updateLayer)
  const removeLayer = useWorkshopStore(state => state.removeLayer)
  const reorderLayers = useWorkshopStore(state => state.reorderLayers)

  const handleMove = useCallback(
    (fromIndex: number, direction: -1 | 1) => {
      const toIndex = fromIndex + direction
      if (toIndex < 0 || toIndex >= layers.length) return
      reorderLayers(fromIndex, toIndex)
    },
    [layers.length, reorderLayers]
  )

  return (
    <section className="border-t border-rice-deep bg-white">
      <div className="flex items-center justify-between border-b border-rice-deep/50 px-4 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">图层</h3>
        <span className="text-xs text-ink-faint">{layers.length} 层</span>
      </div>

      <div className="custom-scrollbar max-h-44 overflow-y-auto">
        {[...layers].reverse().map(layer => {
          const originalIndex = layers.findIndex(item => item.id === layer.id)
          const isActive = activeLayerId === layer.id
          return (
            <div
              key={layer.id}
              role="button"
              tabIndex={0}
              aria-label={`选择图层: ${layer.name}`}
              onClick={() => setActiveLayer(layer.id)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') setActiveLayer(layer.id)
              }}
              className={`flex items-center gap-2 border-l-2 px-3 py-2 transition-colors ${
                isActive
                  ? 'border-gold bg-gold/10'
                  : 'border-transparent hover:bg-rice-warm'
              }`}
            >
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  updateLayer(layer.id, { visible: !layer.visible })
                }}
                className="text-ink-faint transition-colors hover:text-ink-medium"
                title={layer.visible ? '隐藏图层' : '显示图层'}
              >
                <Icon name={layer.visible ? 'visibility' : 'visibility_off'} size={16} />
              </button>

              <span className={`min-w-0 flex-1 truncate text-xs ${isActive ? 'font-bold text-ink' : 'text-ink-light'}`}>
                {layer.name}
              </span>

              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  layer.loadStatus === 'error'
                    ? 'bg-cinnabar/10 text-cinnabar'
                    : layer.loadStatus === 'loading'
                      ? 'bg-gold/10 text-gold'
                      : 'bg-rice-warm text-ink-faint'
                }`}
              >
                {layer.opacity}%
              </span>

              <button
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  updateLayer(layer.id, { locked: !layer.locked })
                }}
                className="text-ink-faint transition-colors hover:text-ink-medium"
                title={layer.locked ? '解锁图层' : '锁定图层'}
              >
                <Icon name={layer.locked ? 'lock' : 'lock_open'} size={14} />
              </button>

              <button
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  handleMove(originalIndex, 1)
                }}
                disabled={originalIndex >= layers.length - 1}
                className="text-ink-faint transition-colors hover:text-ink-medium disabled:opacity-30"
                title="上移图层"
              >
                <Icon name="keyboard_arrow_up" size={16} />
              </button>

              <button
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  handleMove(originalIndex, -1)
                }}
                disabled={originalIndex <= 0}
                className="text-ink-faint transition-colors hover:text-ink-medium disabled:opacity-30"
                title="下移图层"
              >
                <Icon name="keyboard_arrow_down" size={16} />
              </button>

              {layer.id !== 'workshop-background' && (
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    removeLayer(layer.id)
                  }}
                  className="text-ink-faint transition-colors hover:text-cinnabar"
                  title="删除图层"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <ActiveLayerControls />
    </section>
  )
})

function ActiveLayerControls() {
  const activeLayerId = useWorkshopStore(state => state.activeLayerId)
  const layer = useWorkshopStore(state => state.layers.find(item => item.id === state.activeLayerId))
  const updateLayer = useWorkshopStore(state => state.updateLayer)

  if (!layer || !activeLayerId) {
    return (
      <div className="border-t border-rice-deep/50 px-4 py-3 text-center text-sm text-ink-faint">
        请选择一个图层
      </div>
    )
  }

  return (
    <div className="grid gap-3 border-t border-rice-deep/50 px-4 py-3 md:grid-cols-[1fr_180px]">
      <ParameterSlider
        label="透明度"
        value={layer.opacity}
        onChange={value => updateLayer(activeLayerId, { opacity: value })}
        primaryColor="gold"
      />
      {layer.type === 'color-fill' ? (
        <ColorPicker
          value={layer.fillColor ?? '#ffffff'}
          onChange={color => updateLayer(activeLayerId, { fillColor: color })}
          label="填充颜色"
        />
      ) : (
      <label className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-tighter text-ink-faint">混合</span>
        <select
          value={layer.blendMode}
          onChange={event => updateLayer(activeLayerId, { blendMode: event.target.value as CanvasBlendMode })}
          className="min-w-0 flex-1 rounded border border-rice-deep bg-rice-warm px-2 py-1 text-xs text-ink-medium outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/30"
        >
          {Object.entries(BLEND_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      )}
    </div>
  )
}
