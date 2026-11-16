'use client'

import ParameterSlider from '@/components/ui/ParameterSlider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { DEFAULT_COLOR_ADJUST } from '@/types/workshop'
import { EmptyPanel, PanelHeader } from './AdjustChrome'

export function ColorAdjustSection() {
  const activeLayerId = useWorkshopStore(state => state.activeLayerId)
  const layer = useWorkshopStore(state => state.layers.find(item => item.id === state.activeLayerId))
  const updateActiveLayerColorAdjust = useWorkshopStore(state => state.updateActiveLayerColorAdjust)

  if (!layer || !activeLayerId) return <EmptyPanel message="请先选中一个图层" />

  const colorAdjust = layer.colorAdjust
  const disabled = layer.locked

  return (
    <section className="border-t border-border bg-surface-inset p-4">
      <PanelHeader icon="palette" title={`色彩调节 - ${layer.name}`}>
        <button
          type="button"
          onClick={() => updateActiveLayerColorAdjust(DEFAULT_COLOR_ADJUST)}
          disabled={disabled}
          className="text-xs font-bold text-text-faint transition-colors hover:text-cinnabar disabled:opacity-40"
        >
          重置
        </button>
      </PanelHeader>

      <div className="grid gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-5">
        <ParameterSlider
          label="色相 HUE"
          value={colorAdjust.hue}
          onChange={value => updateActiveLayerColorAdjust({ hue: value })}
          min={-180}
          max={180}
          unit="°"
          primaryColor="gold"
        />
        <ParameterSlider
          label="饱和度 SAT"
          value={colorAdjust.saturation}
          onChange={value => updateActiveLayerColorAdjust({ saturation: value })}
          min={-100}
          max={100}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="亮度 BRI"
          value={colorAdjust.brightness}
          onChange={value => updateActiveLayerColorAdjust({ brightness: value })}
          min={-100}
          max={100}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="对比度 CON"
          value={colorAdjust.contrast}
          onChange={value => updateActiveLayerColorAdjust({ contrast: value })}
          min={-100}
          max={100}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="色温 TEMP"
          value={colorAdjust.temperature}
          onChange={value => updateActiveLayerColorAdjust({ temperature: value })}
          min={-50}
          max={50}
          unit=""
          primaryColor="gold"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-72 max-w-full">
          <ColorPicker
            value={colorAdjust.tint ?? '#c9a84c'}
            onChange={color => updateActiveLayerColorAdjust({ tint: color })}
            label="染色 TINT"
          />
        </div>
        <button
          type="button"
          onClick={() => updateActiveLayerColorAdjust({ tint: null })}
          disabled={disabled || colorAdjust.tint === null}
          className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-muted transition-colors hover:border-cinnabar/40 hover:text-cinnabar disabled:opacity-40"
        >
          清除染色
        </button>
      </div>
    </section>
  )
}
