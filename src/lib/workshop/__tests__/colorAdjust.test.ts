import { describe, expect, it } from 'vitest'
import { DEFAULT_COLOR_ADJUST } from '@/types/workshop'
import { adjustRgb, parseHexColor } from '../colorAdjust'

describe('workshop color adjustment', () => {
  it('keeps RGB values unchanged for default params', () => {
    expect(adjustRgb({ r: 80, g: 120, b: 160 }, DEFAULT_COLOR_ADJUST)).toEqual({
      r: 80,
      g: 120,
      b: 160,
    })
  })

  it('clamps brightness and contrast output to displayable RGB range', () => {
    const adjusted = adjustRgb(
      { r: 240, g: 12, b: 128 },
      {
        ...DEFAULT_COLOR_ADJUST,
        brightness: 100,
        contrast: 100,
      }
    )

    expect(adjusted.r).toBeGreaterThanOrEqual(0)
    expect(adjusted.r).toBeLessThanOrEqual(255)
    expect(adjusted.g).toBeGreaterThanOrEqual(0)
    expect(adjusted.g).toBeLessThanOrEqual(255)
    expect(adjusted.b).toBeGreaterThanOrEqual(0)
    expect(adjusted.b).toBeLessThanOrEqual(255)
  })

  it('wraps hue rotation around the HSL color wheel', () => {
    const rotated360 = adjustRgb(
      { r: 210, g: 80, b: 40 },
      {
        ...DEFAULT_COLOR_ADJUST,
        hue: 360,
      }
    )

    const rotated0 = adjustRgb(
      { r: 210, g: 80, b: 40 },
      {
        ...DEFAULT_COLOR_ADJUST,
        hue: 0,
      }
    )

    expect(rotated360).toEqual(rotated0)
  })

  it('parses six-digit hex colors for tinting', () => {
    expect(parseHexColor('#c9a84c')).toEqual({ r: 201, g: 168, b: 76 })
    expect(parseHexColor('invalid')).toBeNull()
  })
})
