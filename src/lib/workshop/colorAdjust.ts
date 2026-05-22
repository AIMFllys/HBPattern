import type { ColorAdjustParams } from '@/types/workshop'

export interface RgbColor {
  r: number
  g: number
  b: number
}

export function hasColorAdjustment(params: ColorAdjustParams) {
  return (
    params.hue !== 0 ||
    params.saturation !== 0 ||
    params.brightness !== 0 ||
    params.contrast !== 0 ||
    params.temperature !== 0 ||
    params.tint !== null
  )
}

export function adjustRgb(input: RgbColor, params: ColorAdjustParams): RgbColor {
  let r = input.r
  let g = input.g
  let b = input.b

  if (params.brightness !== 0) {
    const factor = 1 + params.brightness / 100
    r *= factor
    g *= factor
    b *= factor
  }

  if (params.contrast !== 0) {
    const contrast = params.contrast * 2.55
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
    r = factor * (r - 128) + 128
    g = factor * (g - 128) + 128
    b = factor * (b - 128) + 128
  }

  if (params.hue !== 0 || params.saturation !== 0) {
    const [h, s, l] = rgbToHsl(clamp255(r), clamp255(g), clamp255(b))
    const nextHue = wrap01(h + params.hue / 360)
    const nextSaturation = clamp01(s + params.saturation / 100)
    const rgb = hslToRgb(nextHue, nextSaturation, l)
    r = rgb.r
    g = rgb.g
    b = rgb.b
  }

  if (params.temperature !== 0) {
    r += params.temperature * 1.5
    b -= params.temperature * 1.5
  }

  if (params.tint) {
    const tint = parseHexColor(params.tint)
    if (tint) {
      r = mix(r, tint.r, 0.28)
      g = mix(g, tint.g, 0.28)
      b = mix(b, tint.b, 0.28)
    }
  }

  return {
    r: clamp255(r),
    g: clamp255(g),
    b: clamp255(b),
  }
}

export function applyColorAdjustment(imageData: ImageData, params: ColorAdjustParams): ImageData {
  if (!hasColorAdjustment(params)) return imageData

  const data = new Uint8ClampedArray(imageData.data)
  for (let index = 0; index < data.length; index += 4) {
    const adjusted = adjustRgb(
      {
        r: data[index] ?? 0,
        g: data[index + 1] ?? 0,
        b: data[index + 2] ?? 0,
      },
      params
    )
    data[index] = adjusted.r
    data[index + 1] = adjusted.g
    data[index + 2] = adjusted.b
  }

  return new ImageData(data, imageData.width, imageData.height)
}

export function parseHexColor(hex: string): RgbColor | null {
  const normalized = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const lightness = (max + min) / 2

  if (max === min) return [0, 0, lightness]

  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue = 0

  if (max === rn) hue = (gn - bn) / delta + (gn < bn ? 6 : 0)
  else if (max === gn) hue = (bn - rn) / delta + 2
  else hue = (rn - gn) / delta + 4

  return [hue / 6, saturation, lightness]
}

function hslToRgb(h: number, s: number, l: number): RgbColor {
  if (s === 0) {
    const value = clamp255(l * 255)
    return { r: value, g: value, b: value }
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: clamp255(hueToRgb(p, q, h + 1 / 3) * 255),
    g: clamp255(hueToRgb(p, q, h) * 255),
    b: clamp255(hueToRgb(p, q, h - 1 / 3) * 255),
  }
}

function hueToRgb(p: number, q: number, tValue: number) {
  let t = tValue
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

function mix(a: number, b: number, amount: number) {
  return a * (1 - amount) + b * amount
}

function wrap01(value: number) {
  return ((value % 1) + 1) % 1
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function clamp255(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)))
}
