import type { ExportConfig, WorkshopLayer, SymmetryConfig } from '@/types/workshop'
import { CanvasEngine } from './canvasEngine'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateExportFilename(patternName: string | null, config: ExportConfig) {
  const base = sanitizeFilename(patternName ?? 'workshop-design')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${base}_${config.scale}x_${timestamp}.${config.format}`
}

export function estimateFileSize(width: number, height: number, format: string, quality: number) {
  const pixels = width * height
  const normalizedQuality = Math.max(0.1, Math.min(1, quality))
  let bytes = pixels * 1.5

  if (format === 'jpeg') bytes = pixels * normalizedQuality * 0.5
  else if (format === 'webp') bytes = pixels * normalizedQuality * 0.3
  else if (format === 'svg') bytes = pixels * 1.65

  if (bytes >= 1024 * 1024) return `约 ${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `约 ${(bytes / 1024).toFixed(0)} KB`
}

export function scaleLayersForExport(layers: WorkshopLayer[], scale: number): WorkshopLayer[] {
  return layers.map(layer => ({
    ...layer,
    transform: {
      ...layer.transform,
      x: layer.transform.x * scale,
      y: layer.transform.y * scale,
      scaleX: layer.transform.scaleX * scale,
      scaleY: layer.transform.scaleY * scale,
    },
  }))
}

export async function exportWorkshopBlob({
  layers,
  symmetry,
  canvasSize,
  config,
}: {
  layers: WorkshopLayer[]
  symmetry: SymmetryConfig
  canvasSize: { width: number; height: number }
  config: ExportConfig
}) {
  const outputWidth = canvasSize.width * config.scale
  const outputHeight = canvasSize.height * config.scale
  const renderCanvas = document.createElement('canvas')
  const engine = new CanvasEngine(renderCanvas, outputWidth, outputHeight)
  const exportLayers = config.includeBackground
    ? scaleLayersForExport(layers, config.scale)
    : scaleLayersForExport(layers.filter(layer => layer.type !== 'color-fill'), config.scale)

  try {
    await Promise.all(
      exportLayers
        .filter(layer => layer.type === 'pattern' && layer.sourceImageUrl)
        .map(layer => engine.loadImage(layer.id, layer.sourceImageUrl as string))
    )
    engine.render(exportLayers, symmetry, {
      backgroundColor: config.includeBackground ? '#ffffff' : 'rgba(255,255,255,0)',
      showGuides: false,
    })

    if (config.format === 'svg') {
      const pngDataUrl = renderCanvas.toDataURL('image/png')
      return createSvgWrapperBlob(pngDataUrl, outputWidth, outputHeight)
    }

    const mimeType = `image/${config.format}`
    return await canvasToBlob(renderCanvas, mimeType, config.quality)
  } finally {
    engine.dispose()
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('导出失败'))
      },
      mimeType,
      quality
    )
  })
}

function createSvgWrapperBlob(pngDataUrl: string, width: number, height: number) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<title>湖北纹案工坊导出稿</title>`,
    `<image href="${pngDataUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`,
    `</svg>`,
  ].join('')
  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
}

function sanitizeFilename(input: string) {
  const cleaned = input.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-')
  return cleaned.length > 0 ? cleaned : 'workshop-design'
}
