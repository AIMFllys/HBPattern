import type { PatternGeneratorConfig } from '@/types/create'

export function drawGeometric(
  ctx: CanvasRenderingContext2D,
  config: PatternGeneratorConfig,
  size: number
) {
  const cellSize = size / config.density
  ctx.lineWidth = config.lineWidth
  ctx.lineCap = 'square'

  for (let row = 0; row < config.density; row++) {
    for (let col = 0; col < config.density; col++) {
      const isEven = (row + col) % 2 === 0
      ctx.save()
      ctx.translate(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2)

      if (config.style === 'bold') {
        drawDiamond(ctx, cellSize * 0.4, isEven ? config.primaryColor : config.secondaryColor, config.lineWidth)
        drawDiamond(ctx, cellSize * 0.2, isEven ? config.secondaryColor : config.primaryColor, config.lineWidth)
      } else if (config.style === 'minimal') {
        drawSpiral(ctx, cellSize * 0.35, config.primaryColor, config.lineWidth, isEven ? 1 : -1)
      } else {
        drawCross(ctx, cellSize * 0.3, isEven ? config.primaryColor : config.secondaryColor, config.lineWidth)
      }

      ctx.restore()
    }
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, halfSize: number, color: string, lineWidth: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(0, -halfSize)
  ctx.lineTo(halfSize, 0)
  ctx.lineTo(0, halfSize)
  ctx.lineTo(-halfSize, 0)
  ctx.closePath()
  ctx.stroke()
}

function drawSpiral(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  lineWidth: number,
  direction: number
) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()

  let segment = size
  let x = 0
  let y = -segment
  ctx.moveTo(x, y)

  for (let step = 0; step < 12; step++) {
    segment *= 0.75
    const turn = step % 4
    if (turn === 0) x += segment * direction
    if (turn === 1) y += segment
    if (turn === 2) x -= segment * direction
    if (turn === 3) y -= segment
    ctx.lineTo(x, y)
  }

  ctx.stroke()
}

function drawCross(ctx: CanvasRenderingContext2D, size: number, color: string, lineWidth: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(-size, 0)
  ctx.lineTo(size, 0)
  ctx.moveTo(0, -size)
  ctx.lineTo(0, size)
  ctx.stroke()
}
