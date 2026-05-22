import { describe, expect, it } from 'vitest'
import { DEFAULT_COLOR_ADJUST, DEFAULT_LAYER_TRANSFORM } from '@/types/workshop'
import type { WorkshopLayer } from '@/types/workshop'
import { hasRenderablePattern, normalizeBlendMode, serializeWorkshopLayers } from '../layerCompositor'

function createLayer(overrides: Partial<WorkshopLayer> = {}): WorkshopLayer {
  return {
    id: 'layer-1',
    name: '测试图层',
    type: 'pattern',
    visible: true,
    locked: false,
    opacity: 100,
    blendMode: 'multiply',
    sourceImageUrl: 'https://example.com/pattern.png',
    sourcePatternId: 'pattern-1',
    sourcePatternName: '测试纹样',
    transform: DEFAULT_LAYER_TRANSFORM,
    colorAdjust: DEFAULT_COLOR_ADJUST,
    loadStatus: 'loaded',
    createdAt: 1,
    ...overrides,
  }
}

describe('workshop layer compositor helpers', () => {
  it('normalizes supported blend modes and falls back for unknown values', () => {
    expect(normalizeBlendMode('multiply')).toBe('multiply')
    expect(normalizeBlendMode('unsupported' as WorkshopLayer['blendMode'])).toBe('source-over')
  })

  it('serializes layers without carrying source pattern objects', () => {
    const [serialized] = serializeWorkshopLayers([
      createLayer({
        sourcePattern: {
          id: 'pattern-1',
          name: '测试纹样',
        } as WorkshopLayer['sourcePattern'],
      }),
    ])

    expect(serialized.sourcePatternId).toBe('pattern-1')
    expect('sourcePattern' in serialized).toBe(false)
  })

  it('checks whether a pattern layer can render', () => {
    expect(hasRenderablePattern(createLayer())).toBe(true)
    expect(hasRenderablePattern(createLayer({ visible: false }))).toBe(false)
    expect(hasRenderablePattern(createLayer({ opacity: 0 }))).toBe(false)
    expect(hasRenderablePattern(createLayer({ sourceImageUrl: undefined }))).toBe(false)
  })
})
