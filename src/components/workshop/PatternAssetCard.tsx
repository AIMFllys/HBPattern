'use client'

import { memo, useEffect, useState } from 'react'
import Image from 'next/image'
import { generateBlurDataURL } from '@/lib/image-placeholder'
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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const thumbnailUrl = pattern.media?.[0]?.thumbnail_url ?? pattern.media?.[0]?.url ?? null
  const palette = pattern.color_palette ?? []
  const fallbackStyle =
    palette.length >= 2
      ? { backgroundImage: `linear-gradient(135deg, ${palette.join(', ')})` }
      : { backgroundColor: palette[0] ?? '#ede7d9' }

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    if (!thumbnailUrl) setImageLoaded(true)
  }, [thumbnailUrl])

  return (
    <button
      id={`workshop-pattern-${pattern.id}`}
      type="button"
      onClick={() => onSelect(pattern)}
      className={`workshop-pattern-card group text-left transition-all active:scale-[0.98] ${isSelected ? 'scale-[0.98]' : ''}`}
      aria-pressed={isSelected}
      aria-label={`选择纹样: ${pattern.name}`}
    >
      <div
        className={`aspect-square overflow-hidden rounded-xl border-2 p-1 transition-all ${
          isSelected
            ? 'border-gold bg-gold/5 shadow-md shadow-gold/20'
            : 'border-transparent bg-rice-warm hover:border-rice-deep group-hover:shadow-sm'
        }`}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-lg bg-rice-warm transition-transform duration-500 group-hover:scale-110 ${
            imageLoaded ? '' : 'animate-pulse'
          }`}
          style={fallbackStyle}
        >
          {thumbnailUrl && !imageError && (
            <Image
              src={thumbnailUrl}
              alt={pattern.name}
              fill
              sizes="160px"
              className="object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL={generateBlurDataURL(palette[0] ?? '#ede7d9')}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true)
                setImageLoaded(true)
              }}
            />
          )}
        </div>
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
