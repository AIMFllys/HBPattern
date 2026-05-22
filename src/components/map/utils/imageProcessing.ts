import { DEFAULT_PALETTE } from '../mapDemoTypes'

function toHex(value: number) {
  return value.toString(16).padStart(2, '0')
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function quantize(value: number) {
  return Math.min(240, Math.round(value / 32) * 32)
}

export async function readImageForDemo(file: File): Promise<{ dataUrl: string; palette: string[] }> {
  const sourceDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解析失败'))
    img.src = sourceDataUrl
  })

  const maxSize = 520
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return { dataUrl: sourceDataUrl, palette: DEFAULT_PALETTE }
  ctx.drawImage(image, 0, 0, width, height)

  const pixels = ctx.getImageData(0, 0, width, height).data
  const buckets = new Map<string, number>()
  for (let i = 0; i < pixels.length; i += 16) {
    const alpha = pixels[i + 3]
    if (alpha < 160) continue
    const r = quantize(pixels[i])
    const g = quantize(pixels[i + 1])
    const b = quantize(pixels[i + 2])
    const key = rgbToHex(r, g, b)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  const palette = Array.from(buckets.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex)
    .slice(0, 5)

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.82),
    palette: palette.length > 0 ? palette : DEFAULT_PALETTE,
  }
}
