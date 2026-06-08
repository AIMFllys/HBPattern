'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { TRADITIONAL_COLORS } from '@/data/traditional-colors'

interface ColorSearchProps {
  onSearch: (colors: string[]) => void
  selectedColors?: string[]
}

export function ColorSearch({ onSearch, selectedColors = [] }: ColorSearchProps) {
  const [selected, setSelected] = useState<string[]>(selectedColors)

  function toggle(hex: string) {
    const next = selected.includes(hex)
      ? selected.filter((c) => c !== hex)
      : [...selected, hex]
    setSelected(next)
    onSearch(next)
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">按颜色搜索</h3>
      <div className="grid grid-cols-6 gap-2">
        {TRADITIONAL_COLORS.map((color) => {
          const isSelected = selected.includes(color.hex)
          return (
            <motion.button
              key={color.hex}
              type="button"
              onClick={() => toggle(color.hex)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex flex-col items-center gap-1"
              aria-label={`选择${color.name}色${isSelected ? '（已选中）' : ''}`}
              aria-pressed={isSelected}
            >
              <div
                className="w-10 h-10 rounded-lg shadow-sm border-2 transition-all duration-200"
                style={{
                  backgroundColor: color.hex,
                  borderColor: isSelected ? '#b84a39' : 'transparent',
                }}
              />
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-0.5 w-4 h-4 bg-cinnabar rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-[8px] font-bold" aria-hidden="true">&#10003;</span>
                </motion.div>
              )}
              <span className="text-[10px] text-ink-medium leading-tight">{color.name}</span>
            </motion.button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => { setSelected([]); onSearch([]) }}
          className="mt-3 text-xs text-gold hover:text-cinnabar transition-colors"
        >
          清除颜色筛选
        </button>
      )}
    </div>
  )
}
