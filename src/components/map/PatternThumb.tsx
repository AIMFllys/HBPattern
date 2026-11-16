import type { MapPatternOption } from '@/types'
import { DEFAULT_PALETTE } from './mapDemoTypes'

export function PatternThumb({ pattern, small = false }: { pattern: MapPatternOption; small?: boolean }) {
  const sizeClass = small ? 'size-9' : 'size-12'
  const palette = pattern.colorPalette.length > 0 ? pattern.colorPalette : DEFAULT_PALETTE

  return (
    <span
      className={`relative block shrink-0 overflow-hidden border border-border ${sizeClass}`}
      style={
        pattern.imageUrl
          ? { backgroundColor: palette[0] }
          : {
              backgroundColor: palette[0],
              backgroundImage: `linear-gradient(135deg, ${palette.join(', ')})`,
            }
      }
    >
      {pattern.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pattern.imageUrl}
          alt={pattern.name}
          className="h-full w-full object-cover object-center"
        />
      ) : null}
    </span>
  )
}
