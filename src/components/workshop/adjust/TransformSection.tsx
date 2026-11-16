'use client'

import ParameterSlider from '@/components/ui/ParameterSlider'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { LayerTransform } from '@/types/workshop'
import { EmptyPanel, PanelHeader, ToggleButton } from './AdjustChrome'

export function TransformSection() {
  const activeLayerId = useWorkshopStore(state => state.activeLayerId)
  const layer = useWorkshopStore(state => state.layers.find(item => item.id === state.activeLayerId))
  const updateActiveLayerTransform = useWorkshopStore(state => state.updateActiveLayerTransform)

  if (!layer || !activeLayerId) return <EmptyPanel message="请先选中一个图层" />

  const transform = layer.transform
  const disabled = layer.locked
  const updateTransform = (updates: Partial<LayerTransform>) => {
    if (!disabled) updateActiveLayerTransform(updates)
  }

  return (
    <section className="border-t border-border bg-surface-inset p-4">
      <PanelHeader icon="transform" title={`变换 - ${layer.name}`} />
      <div className="grid gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-5">
        <ParameterSlider
          label="X 偏移"
          value={Math.round(transform.x)}
          onChange={value => updateTransform({ x: value })}
          min={-500}
          max={500}
          unit="px"
          primaryColor="gold"
        />
        <ParameterSlider
          label="Y 偏移"
          value={Math.round(transform.y)}
          onChange={value => updateTransform({ y: value })}
          min={-500}
          max={500}
          unit="px"
          primaryColor="gold"
        />
        <ParameterSlider
          label="缩放 X"
          value={Math.round(transform.scaleX * 100)}
          onChange={value => updateTransform({ scaleX: value / 100 })}
          min={10}
          max={300}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="缩放 Y"
          value={Math.round(transform.scaleY * 100)}
          onChange={value => updateTransform({ scaleY: value / 100 })}
          min={10}
          max={300}
          unit="%"
          primaryColor="gold"
        />
        <ParameterSlider
          label="旋转"
          value={Math.round((transform.rotation * 180) / Math.PI)}
          onChange={value => updateTransform({ rotation: (value * Math.PI) / 180 })}
          min={0}
          max={360}
          unit="°"
          primaryColor="gold"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ToggleButton
          active={transform.flipH}
          icon="flip"
          label="水平翻转"
          onClick={() => updateTransform({ flipH: !transform.flipH })}
          disabled={disabled}
        />
        <ToggleButton
          active={transform.flipV}
          icon="flip"
          label="垂直翻转"
          onClick={() => updateTransform({ flipV: !transform.flipV })}
          disabled={disabled}
          rotateIcon
        />
      </div>
    </section>
  )
}
