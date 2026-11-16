'use client'

import ParameterSlider from '@/components/ui/ParameterSlider'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { SymmetryType } from '@/types/workshop'
import { PanelHeader } from './AdjustChrome'

const SYMMETRY_OPTIONS: { type: SymmetryType; icon: string; label: string }[] = [
  { type: 'none', icon: 'block', label: '无' },
  { type: 'horizontal', icon: 'align_horizontal_center', label: '水平' },
  { type: 'vertical', icon: 'align_vertical_center', label: '垂直' },
  { type: 'both', icon: 'control_camera', label: '双轴' },
  { type: 'radial-4', icon: 'filter_4', label: '4 折' },
  { type: 'radial-6', icon: 'hexagon', label: '6 折' },
  { type: 'radial-8', icon: 'star', label: '8 折' },
]

export function SymmetrySection() {
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
