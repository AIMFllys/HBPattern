import type { PatternGeneratorConfig } from '@/types/create'
import { drawDragon, drawPhoenix } from './motifs/creature'
import { drawCloud, drawFloral, drawWave } from './motifs/field'
import { drawGeometric } from './motifs/geometric'

const DEFAULT_TEXTURE_SIZE = 512

export function generatePatternCanvas(
  config: PatternGeneratorConfig,
  size = DEFAULT_TEXTURE_SIZE
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context is not available')
  }

  if (config.backgroundColor === 'transparent') {
    ctx.clearRect(0, 0, size, size)
  } else {
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, size, size)
  }

  switch (config.type) {
    case 'geometric':
      drawGeometric(ctx, config, size)
      break
    case 'floral':
      drawFloral(ctx, config, size)
      break
    case 'wave':
      drawWave(ctx, config, size)
      break
    case 'cloud':
      drawCloud(ctx, config, size)
      break
    case 'dragon':
      drawDragon(ctx, config, size)
      break
    case 'phoenix':
      drawPhoenix(ctx, config, size)
      break
  }

  return canvas
}
