import type { MapPatternOption } from '@/types'
import { DEFAULT_PALETTE } from './mapDemoTypes'

export function PatternThumb({ pattern, small = false }: { pattern: MapPatternOption; small?: boolean }) {
  const sizeClass = small ? 'size-9' : 'size-12'
  const palette = pattern.colorPalette.length > 0 ? pattern.colorPalette : DEFAULT_PALETTE

  return (
    <span
      className={`block shrink-0 overflow-hidden border border-border bg-cover bg-center ${sizeClass}`}
      style={{
        backgroundColor: palette[0],
        backgroundImage: pattern.imageUrl ? `url("${pattern.imageUrl}")` : `linear-gradient(135deg, ${palette.join(', ')})`,
      }}
    />
  )
}
