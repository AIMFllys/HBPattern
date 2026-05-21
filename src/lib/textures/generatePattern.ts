import type { PatternGeneratorConfig } from '@/types/create'

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

function drawGeometric(
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

function drawFloral(
  ctx: CanvasRenderingContext2D,
  config: PatternGeneratorConfig,
  size: number
) {
  const grid = Math.max(2, Math.floor(config.density / 2))
  const cellSize = size / grid
  const rows = Math.ceil(size / cellSize) + 1
  const petalCount = config.style === 'delicate' ? 8 : config.style === 'minimal' ? 5 : 6

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < rows; col++) {
      const cx = col * cellSize + cellSize / 2 + (row % 2) * (cellSize / 2)
      const cy = row * cellSize + cellSize / 2
      const petalSize = cellSize * 0.3

      ctx.save()
      ctx.translate(cx, cy)

      for (let index = 0; index < petalCount; index++) {
        ctx.save()
        ctx.rotate((Math.PI * 2 * index) / petalCount)
        ctx.beginPath()
        ctx.ellipse(0, -petalSize * 0.5, petalSize * 0.25, petalSize * 0.5, 0, 0, Math.PI * 2)
        ctx.fillStyle = config.primaryColor
        ctx.globalAlpha = 0.78
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.strokeStyle = config.secondaryColor
        ctx.lineWidth = config.lineWidth * 0.5
        ctx.stroke()
        ctx.restore()
      }

      ctx.beginPath()
      ctx.arc(0, 0, petalSize * 0.15, 0, Math.PI * 2)
      ctx.fillStyle = config.secondaryColor
      ctx.fill()
      ctx.restore()
    }
  }
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  config: PatternGeneratorConfig,
  size: number
) {
  const waveHeight = size / config.density

  for (let index = 0; index < config.density + 2; index++) {
    const baseY = index * waveHeight - waveHeight
    ctx.strokeStyle = index % 2 === 0 ? config.primaryColor : config.secondaryColor
    ctx.lineWidth = config.lineWidth
    ctx.beginPath()

    for (let x = 0; x <= size; x += 2) {
      const y = baseY + Math.sin((x / size) * Math.PI * 4) * (waveHeight * 0.3)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.stroke()
  }
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  config: PatternGeneratorConfig,
  size: number
) {
  const cloudCount = Math.max(3, config.density)
  ctx.lineWidth = config.lineWidth
  ctx.lineCap = 'round'

  for (let index = 0; index < cloudCount; index++) {
    const cx = (index * 137.5) % size
    const cy = (index * 89.3 + 50) % size
    const cloudSize = (size / cloudCount) * (config.style === 'delicate' ? 0.9 : 1.2)

    ctx.save()
    ctx.translate(cx, cy)
    ctx.strokeStyle = config.primaryColor
    ctx.beginPath()

    for (let t = 0; t < Math.PI * 3; t += 0.1) {
      const radius = cloudSize * 0.15 * (1 + t * 0.15)
      const x = Math.cos(t) * radius
      const y = Math.sin(t) * radius
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cloudSize * 0.4, 0)
    ctx.quadraticCurveTo(cloudSize * 0.62, cloudSize * 0.2, cloudSize * 0.85, 0)
    ctx.strokeStyle = config.secondaryColor
    ctx.stroke()
    ctx.restore()
  }
}

function drawDragon(
  ctx: CanvasRenderingContext2D,
  config: PatternGeneratorConfig,
  size: number
) {
  const bodyCount = Math.max(1, Math.floor(config.density / 3))
  const segments = config.density * 2
  const scale = size / 4

  for (let body = 0; body < bodyCount; body++) {
    const offsetX = (body * size) / bodyCount
    const offsetY = (body * 73) % (size * 0.55)
    ctx.save()
    ctx.translate(offsetX, offsetY + size * 0.2)
    ctx.strokeStyle = config.primaryColor
    ctx.lineWidth = config.lineWidth * 1.5
    ctx.lineCap = 'round'
    ctx.beginPath()

    for (let index = 0; index <= segments; index++) {
      const t = (index / segments) * Math.PI * 2
      const x = Math.sin(t) * scale + Math.sin(t * 2) * (scale * 0.3)
      const y = t * scale * 0.4 - scale
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.stroke()

    if (config.style !== 'minimal') {
      ctx.strokeStyle = config.secondaryColor
      ctx.lineWidth = config.lineWidth * 0.5
      for (let index = 0; index < segments; index += 2) {
        const t = (index / segments) * Math.PI * 2
        const x = Math.sin(t) * scale + Math.sin(t * 2) * (scale * 0.3)
        const y = t * scale * 0.4 - scale
        ctx.beginPath()
        ctx.arc(x, y, scale * 0.05, 0, Math.PI, true)
        ctx.stroke()
      }
    }

    ctx.restore()
  }
}

function drawPhoenix(
  ctx: CanvasRenderingContext2D,
  config: PatternGeneratorConfig,
  size: number
) {
  const birdCount = Math.max(1, Math.floor(config.density / 2))

  for (let bird = 0; bird < birdCount; bird++) {
    const cx = size * (0.3 + (bird * 0.5) % 1)
    const cy = size * (0.3 + (bird * 0.37) % 0.6)
    const birdScale = (size / birdCount) * 0.42

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((bird * Math.PI) / 4)
    ctx.lineCap = 'round'

    ctx.strokeStyle = config.primaryColor
    ctx.lineWidth = config.lineWidth * 1.5
    ctx.beginPath()
    ctx.moveTo(-birdScale, 0)
    ctx.quadraticCurveTo(0, -birdScale * 0.8, birdScale, -birdScale * 0.3)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-birdScale * 0.2, -birdScale * 0.2)
    ctx.quadraticCurveTo(-birdScale * 0.85, -birdScale * 1.18, 0, -birdScale * 0.78)
    ctx.strokeStyle = config.style === 'bold' ? config.primaryColor : config.secondaryColor
    ctx.stroke()

    ctx.strokeStyle = config.secondaryColor
    ctx.lineWidth = config.lineWidth
    ctx.beginPath()
    ctx.moveTo(-birdScale, 0)
    for (let t = 0; t < Math.PI * 2; t += 0.1) {
      const radius = birdScale * 0.3 * (1 + t * 0.2)
      ctx.lineTo(-birdScale - Math.cos(t) * radius * 0.5, Math.sin(t) * radius)
    }
    ctx.stroke()

    ctx.strokeStyle = config.primaryColor
    ctx.lineWidth = config.lineWidth * 0.8
    for (let index = 0; index < 3; index++) {
      const angle = -Math.PI / 4 + (index * Math.PI) / 12
      ctx.beginPath()
      ctx.moveTo(birdScale * 0.8, -birdScale * 0.3)
      ctx.quadraticCurveTo(
        birdScale + Math.cos(angle) * birdScale * 0.3,
        -birdScale * 0.5 + Math.sin(angle) * birdScale * 0.3,
        birdScale * 0.9 + Math.cos(angle) * birdScale * 0.5,
        -birdScale * 0.6 + Math.sin(angle) * birdScale * 0.5
      )
      ctx.stroke()
    }

    ctx.restore()
  }
}
