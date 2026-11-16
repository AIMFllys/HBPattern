import type { PatternGeneratorConfig } from '@/types/create'

export function drawFloral(
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

export function drawWave(
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

export function drawCloud(
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
