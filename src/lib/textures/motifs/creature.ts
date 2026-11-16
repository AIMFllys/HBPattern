import type { PatternGeneratorConfig } from '@/types/create'

export function drawDragon(
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

export function drawPhoenix(
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
