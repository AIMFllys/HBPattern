import type { LayerTransform, SymmetryConfig, WorkshopLayer } from '@/types/workshop'
import { createSymmetryGuideLines, createSymmetryInstructions } from './symmetry'
import { hasRenderablePattern, normalizeBlendMode } from './layerCompositor'

type CanvasSurface = HTMLCanvasElement | OffscreenCanvas
type CanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

interface LoadedImage {
  url: string
  source: CanvasImageSource
  width: number
  height: number
  close?: () => void
}

interface RenderOptions {
  backgroundColor?: string
  showGuides?: boolean
}

export class CanvasEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private offscreen: CanvasSurface
  private offCtx: CanvasContext
  private width: number
  private height: number
  private dpr: number
  private readonly imageCache = new Map<string, LoadedImage>()

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas
    this.width = width
    this.height = height
    this.dpr = getDevicePixelRatio()

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas 2D context is not available')
    this.ctx = ctx

    this.offscreen = createCanvasSurface(width, height)
    this.offCtx = getCanvasContext(this.offscreen)
    this.resize(width, height)
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.dpr = getDevicePixelRatio()

    this.canvas.width = Math.round(width * this.dpr)
    this.canvas.height = Math.round(height * this.dpr)
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    this.offscreen = createCanvasSurface(width, height)
    this.offCtx = getCanvasContext(this.offscreen)
  }

  async loadImage(layerId: string, url: string) {
    const cached = this.imageCache.get(layerId)
    if (cached?.url === url) return

    cached?.close?.()
    const loaded = await loadCanvasImage(url)
    this.imageCache.set(layerId, loaded)
  }

  removeImage(layerId: string) {
    const cached = this.imageCache.get(layerId)
    cached?.close?.()
    this.imageCache.delete(layerId)
  }

  render(layers: WorkshopLayer[], symmetry: SymmetryConfig, options: RenderOptions = {}) {
    renderLayersToContext(this.offCtx, this.width, this.height, layers, symmetry, this.imageCache, options)
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.ctx.drawImage(this.offscreen, 0, 0, this.width, this.height)
  }

  renderToCanvas(
    targetCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    layers: WorkshopLayer[],
    symmetry: SymmetryConfig,
    options: RenderOptions = {}
  ) {
    targetCanvas.width = width
    targetCanvas.height = height
    const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true })
    if (!targetCtx) throw new Error('Canvas 2D context is not available')

    renderLayersToContext(targetCtx, width, height, layers, symmetry, this.imageCache, options)
  }

  dispose() {
    for (const image of this.imageCache.values()) image.close?.()
    this.imageCache.clear()
  }
}

function getDevicePixelRatio() {
  if (typeof window === 'undefined') return 1
  return Math.min(window.devicePixelRatio || 1, 2)
}

function createCanvasSurface(width: number, height: number): CanvasSurface {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function getCanvasContext(surface: CanvasSurface): CanvasContext {
  const context = surface.getContext('2d', { willReadFrequently: true })
  if (!context || !('drawImage' in context)) {
    throw new Error('Canvas 2D context is not available')
  }
  return context
}

async function loadCanvasImage(url: string): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) throw new Error(`Image request failed: ${response.status}`)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    return {
      url,
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    }
  }

  const image = await loadHtmlImage(url)
  return {
    url,
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
}

function loadHtmlImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = url
  })
}

function renderLayersToContext(
  ctx: CanvasContext,
  width: number,
  height: number,
  layers: WorkshopLayer[],
  symmetry: SymmetryConfig,
  imageCache: Map<string, LoadedImage>,
  options: RenderOptions
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = options.backgroundColor ?? '#ffffff'
  ctx.fillRect(0, 0, width, height)

  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue

    ctx.save()
    ctx.globalAlpha = layer.opacity / 100
    ctx.globalCompositeOperation = normalizeBlendMode(layer.blendMode)

    if (layer.type === 'color-fill') {
      ctx.fillStyle = layer.fillColor ?? '#ffffff'
      ctx.fillRect(0, 0, width, height)
    } else if (hasRenderablePattern(layer)) {
      const image = imageCache.get(layer.id)
      if (image) renderPatternLayer(ctx, width, height, layer, image, symmetry)
    }

    ctx.restore()
  }

  if (options.showGuides) drawGuides(ctx, width, height, symmetry)
}

function renderPatternLayer(
  ctx: CanvasContext,
  width: number,
  height: number,
  layer: WorkshopLayer,
  image: LoadedImage,
  symmetry: SymmetryConfig
) {
  const instructions = createSymmetryInstructions(layer.transform, symmetry)
  const centerX = width * symmetry.centerX
  const centerY = height * symmetry.centerY

  for (const instruction of instructions) {
    ctx.save()
    if (instruction.rotationOffset !== 0) {
      ctx.translate(centerX, centerY)
      ctx.rotate(instruction.rotationOffset)
      ctx.translate(-centerX, -centerY)
    }

    if (instruction.mirrorX || instruction.mirrorY) {
      ctx.translate(centerX, centerY)
      ctx.scale(instruction.mirrorX ? -1 : 1, instruction.mirrorY ? -1 : 1)
      ctx.translate(-centerX, -centerY)
    }

    drawTransformedImage(ctx, width, height, image, instruction.transform)
    ctx.restore()
  }
}

function drawTransformedImage(
  ctx: CanvasContext,
  width: number,
  height: number,
  image: LoadedImage,
  transform: LayerTransform
) {
  ctx.save()
  ctx.translate(width / 2 + transform.x, height / 2 + transform.y)
  ctx.rotate(transform.rotation)
  ctx.scale(
    transform.scaleX * (transform.flipH ? -1 : 1),
    transform.scaleY * (transform.flipV ? -1 : 1)
  )
  ctx.drawImage(image.source, -image.width / 2, -image.height / 2, image.width, image.height)
  ctx.restore()
}

function drawGuides(ctx: CanvasContext, width: number, height: number, symmetry: SymmetryConfig) {
  const guides = createSymmetryGuideLines(symmetry, width, height)
  if (guides.length === 0) return

  ctx.save()
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.55)'
  ctx.lineWidth = 2
  ctx.setLineDash([10, 10])
  for (const guide of guides) {
    ctx.beginPath()
    ctx.moveTo(guide.x1, guide.y1)
    ctx.lineTo(guide.x2, guide.y2)
    ctx.stroke()
  }
  ctx.restore()
}
