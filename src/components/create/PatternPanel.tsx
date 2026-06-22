'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { PATTERN_CATEGORIES, PATTERN_PRESETS } from '@/lib/textures/patternPresets'
import { useCreateStore } from '@/stores/useCreateStore'
import type { PatternPreset } from '@/types/create'
import { PatternThumbnail } from './PatternThumbnail'

export function PatternPanel({ className = '' }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const activeCategory = useCreateStore(state => state.activeCategory)
  const setActiveCategory = useCreateStore(state => state.setActiveCategory)
  const selectedPattern = useCreateStore(state => state.selectedPattern)
  const setPattern = useCreateStore(state => state.setPattern)

  const filteredPatterns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return PATTERN_PRESETS.filter(pattern => {
      const categoryMatch = activeCategory === '全部' || pattern.category === activeCategory
      const searchMatch =
        query.length === 0 ||
        pattern.name.toLowerCase().includes(query) ||
        pattern.category.toLowerCase().includes(query)

      return categoryMatch && searchMatch
    })
  }, [activeCategory, searchQuery])

  const handleSelectPattern = useCallback(
    (pattern: PatternPreset) => {
      setPattern(pattern.id === selectedPattern?.id ? null : pattern)
    },
    [selectedPattern, setPattern]
  )

  return (
    <aside className={`flex w-80 flex-col border-l border-border bg-surface ${className}`}>
      <div className="border-b border-border p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-text">
            <Icon name="palette" className="text-cinnabar" />
            纹样素材库
          </h3>
          <span className="rounded bg-cinnabar/10 px-2 py-0.5 text-xs font-bold text-cinnabar">
            {PATTERN_PRESETS.length} 款
          </span>
        </div>

        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
          />
          <input
            id="pattern-search"
            type="text"
            className="w-full rounded-lg border border-border bg-surface-elevated py-2 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-text-faint focus:border-cinnabar/40 focus:ring-1 focus:ring-cinnabar/30"
            placeholder="搜索纹样名称..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="custom-scrollbar flex gap-1.5 overflow-x-auto border-b border-border px-4 py-3">
        {PATTERN_CATEGORIES.map(category => (
          <button
            key={category}
            id={`category-${category}`}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              activeCategory === category
                ? 'bg-cinnabar text-white shadow-sm'
                : 'bg-surface-elevated text-text-muted hover:bg-border hover:text-text'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {filteredPatterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-faint">
            <Icon name="search_off" size={32} className="mb-2" />
            <p className="text-sm">未找到匹配的纹样</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredPatterns.map(pattern => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                isSelected={selectedPattern?.id === pattern.id}
                onSelect={handleSelectPattern}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-surface-elevated/30 p-4">
        {selectedPattern ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border">
              <PatternThumbnail
                config={selectedPattern.generatorConfig}
                bgColor={selectedPattern.suggestedBaseColor}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text">{selectedPattern.name}</p>
              <p className="text-xs text-text-faint">{selectedPattern.category}</p>
            </div>
            <div className="flex gap-1">
              {selectedPattern.palette.map(color => (
                <ColorDot key={color} color={color} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-text-faint">请选择一个纹样</p>
        )}
      </div>
    </aside>
  )
}

interface PatternCardProps {
  pattern: PatternPreset
  isSelected: boolean
  onSelect: (pattern: PatternPreset) => void
}

const PatternCard = memo(function PatternCard({
  pattern,
  isSelected,
  onSelect,
}: PatternCardProps) {
  return (
    <button
      id={`pattern-${pattern.id}`}
      type="button"
      onClick={() => onSelect(pattern)}
      className={`group text-left transition-all ${isSelected ? 'scale-[0.98]' : ''}`}
    >
      <div
        className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${
          isSelected
            ? 'border-cinnabar shadow-md shadow-cinnabar/20'
            : 'border-transparent hover:border-border'
        }`}
      >
        <PatternThumbnail
          config={pattern.generatorConfig}
          bgColor={pattern.suggestedBaseColor}
          className="transition-transform group-hover:scale-110"
        />
      </div>
      <p
        className={`mt-1.5 truncate text-center text-xs font-bold ${
          isSelected ? 'text-cinnabar' : 'text-text-muted group-hover:text-text'
        }`}
      >
        {pattern.name}
      </p>
    </button>
  )
})

function ColorDot({ color }: { color: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.backgroundColor = color
    }
  }, [color])

  return <span ref={ref} className="h-4 w-4 rounded-full border border-white shadow-sm" />
}
