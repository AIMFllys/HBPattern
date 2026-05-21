import { describe, expect, it } from 'vitest'
import { DEFAULT_COLOR_ADJUST, DEFAULT_LAYER_TRANSFORM } from '@/types/workshop'
import type { WorkshopLayer } from '@/types/workshop'
import { estimateFileSize, generateExportFilename, scaleLayersForExport } from '../exportUtils'

function createLayer(): WorkshopLayer {
  return {
    id: 'layer-1',
    name: '测试图层',
    type: 'pattern',
    visible: true,
    locked: false,
    opacity: 100,
    blendMode: 'source-over',
    sourceImageUrl: 'https://example.com/pattern.png',
    sourcePatternId: 'pattern-1',
    sourcePatternName: '测试纹样',
    transform: { ...DEFAULT_LAYER_TRANSFORM, x: 12, y: -6, scaleX: 1.2, scaleY: 0.8 },
    colorAdjust: { ...DEFAULT_COLOR_ADJUST },
    loadStatus: 'loaded',
    createdAt: 1,
  }
}

describe('workshop export utils', () => {
  it('generates safe filenames with format and scale', () => {
    const filename = generateExportFilename('凤鸟/云纹', {
      format: 'png',
      quality: 1,
      scale: 2,
      includeBackground: true,
    })

    expect(filename).toMatch(/^凤鸟-云纹_2x_/)
    expect(filename.endsWith('.png')).toBe(true)
  })

  it('estimates file sizes with readable units', () => {
    expect(estimateFileSize(1024, 1024, 'png', 1)).toContain('MB')
    expect(estimateFileSize(128, 128, 'webp', 0.8)).toContain('KB')
  })

  it('scales transform coordinates and scale factors for high-resolution export', () => {
    const [scaled] = scaleLayersForExport([createLayer()], 2)

    expect(scaled.transform.x).toBe(24)
    expect(scaled.transform.y).toBe(-12)
    expect(scaled.transform.scaleX).toBe(2.4)
    expect(scaled.transform.scaleY).toBe(1.6)
  })
})
