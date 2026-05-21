'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type { PatternListItem } from '@/types/pattern'

interface PatternAssetCardProps {
  pattern: PatternListItem
  isSelected: boolean
  onSelect: (pattern: PatternListItem) => void
}

export const PatternAssetCard = memo(function PatternAssetCard({
  pattern,
  isSelected,
  onSelect,
}: PatternAssetCardProps) {
  const imageRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const thumbnailUrl = pattern.media?.[0]?.thumbnail_url ?? pattern.media?.[0]?.url ?? null

  useEffect(() => {
    const element = imageRef.current
    if (!element) return

    const palette = pattern.color_palette ?? []
    element.style.backgroundImage = ''
    element.style.background = ''
    element.style.backgroundColor = ''
    setImageLoaded(false)

    if (!thumbnailUrl) {
      if (palette.length >= 2) {
        element.style.background = `linear-gradient(135deg, ${palette.join(', ')})`
      } else {
        element.style.backgroundColor = palette[0] ?? '#ede7d9'
      }
      setImageLoaded(true)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const current = imageRef.current
      if (!current) return
      current.style.backgroundImage = `url("${thumbnailUrl}")`
      current.style.backgroundSize = 'cover'
      current.style.backgroundPosition = 'center'
      setImageLoaded(true)
    }
    img.onerror = () => {
      const current = imageRef.current
      if (!current) return
      if (palette.length >= 2) {
        current.style.background = `linear-gradient(135deg, ${palette.join(', ')})`
      } else {
        current.style.backgroundColor = palette[0] ?? '#ede7d9'
      }
      setImageLoaded(true)
    }
    img.src = thumbnailUrl
  }, [pattern.color_palette, thumbnailUrl])

  return (
    <button
      id={`workshop-pattern-${pattern.id}`}
      type="button"
      onClick={() => onSelect(pattern)}
      className={`group text-left transition-all active:scale-[0.98] ${isSelected ? 'scale-[0.98]' : ''}`}
      aria-pressed={isSelected}
    >
      <div
        className={`aspect-square overflow-hidden rounded-xl border-2 p-1 transition-all ${
          isSelected
            ? 'border-gold bg-gold/5 shadow-md shadow-gold/20'
            : 'border-transparent bg-rice-warm hover:border-rice-deep group-hover:shadow-sm'
        }`}
      >
        <div
          ref={imageRef}
          className={`h-full w-full rounded-lg bg-rice-warm transition-transform duration-500 group-hover:scale-110 ${
            imageLoaded ? '' : 'animate-pulse'
          }`}
        />
      </div>
      <div className="mt-1.5 px-0.5">
        <p className={`truncate text-xs font-bold ${isSelected ? 'text-gold' : 'text-ink-light group-hover:text-ink-medium'}`}>
          {pattern.name}
        </p>
        <p className="truncate text-[10px] text-ink-faint">
          {[pattern.era, pattern.technique?.name].filter(Boolean).join(' · ') || '湖北纹样'}
        </p>
      </div>
    </button>
  )
})
