'use client'

import { memo } from 'react'
import ParameterSlider from '@/components/ui/ParameterSlider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { DEFAULT_COLOR_ADJUST } from '@/types/workshop'
import type { LayerTransform, SymmetryType } from '@/types/workshop'

export const AdjustPanel = memo(function AdjustPanel() {
  const activeTool = useWorkshopStore(state => state.activeTool)

  if (activeTool === 'color') return <ColorAdjustSection />
  if (activeTool === 'transform') return <TransformSection />
  if (activeTool === 'symmetry') return <SymmetrySection />

  return null
})

function ColorAdjustSection() {
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

function TransformSection() {
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

const SYMMETRY_OPTIONS: { type: SymmetryType; icon: string; label: string }[] = [
  { type: 'none', icon: 'block', label: '无' },
  { type: 'horizontal', icon: 'align_horizontal_center', label: '水平' },
  { type: 'vertical', icon: 'align_vertical_center', label: '垂直' },
  { type: 'both', icon: 'control_camera', label: '双轴' },
  { type: 'radial-4', icon: 'filter_4', label: '4 折' },
  { type: 'radial-6', icon: 'hexagon', label: '6 折' },
  { type: 'radial-8', icon: 'star', label: '8 折' },
]

function SymmetrySection() {
  const symmetry = useWorkshopStore(state => state.symmetry)
  const setSymmetry = useWorkshopStore(state => state.setSymmetry)

  return (
    <section className="border-t border-border bg-surface-inset p-4">
      <PanelHeader icon="texture" title="对称模式" />
      <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
        {SYMMETRY_OPTIONS.map(option => (
          <button
            key={option.type}
            type="button"
            onClick={() => setSymmetry({ type: option.type })}
            className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold transition-colors ${
              symmetry.type === option.type
                ? 'bg-gold text-white shadow-sm'
                : 'bg-surface-elevated text-text-muted hover:bg-border'
            }`}
          >
            <Icon name={option.icon} size={18} />
            {option.label}
          </button>
        ))}
      </div>

      {symmetry.type !== 'none' && (
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <ParameterSlider
            label="中心 X"
            value={Math.round(symmetry.centerX * 100)}
            onChange={value => setSymmetry({ centerX: value / 100 })}
            min={0}
            max={100}
            unit="%"
            primaryColor="gold"
          />
          <ParameterSlider
            label="中心 Y"
            value={Math.round(symmetry.centerY * 100)}
            onChange={value => setSymmetry({ centerY: value / 100 })}
            min={0}
            max={100}
            unit="%"
            primaryColor="gold"
          />
          <label className="flex items-center gap-2 text-xs font-bold text-text-muted">
            <input
              type="checkbox"
              checked={symmetry.showGuides}
              onChange={event => setSymmetry({ showGuides: event.target.checked })}
              className="accent-gold"
            />
            显示辅助线
          </label>
        </div>
      )}
    </section>
  )
}

function PanelHeader({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon name={icon} size={16} className="text-gold" />
        <h3 className="truncate text-xs font-bold uppercase tracking-wider text-text">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function ToggleButton({
  active,
  icon,
  label,
  onClick,
  disabled,
  rotateIcon = false,
}: {
  active: boolean
  icon: string
  label: string
  onClick: () => void
  disabled?: boolean
  rotateIcon?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-40 ${
        active ? 'bg-gold text-white' : 'bg-surface-elevated text-text-muted hover:bg-border'
      }`}
    >
      <Icon name={icon} size={14} className={rotateIcon ? 'rotate-90' : ''} />
      {label}
    </button>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <section className="border-t border-border bg-surface-inset p-4 text-center text-sm text-text-faint">
      {message}
    </section>
  )
}
