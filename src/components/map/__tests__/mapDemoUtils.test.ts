import { describe, expect, it } from 'vitest'
import { parseStoredState } from '../utils/mapDemoUtils'

describe('map demo storage parsing', () => {
  it('returns empty state for missing or malformed localStorage data', () => {
    expect(parseStoredState(null)).toEqual({ bindings: [], drafts: [] })
    expect(parseStoredState('{bad json')).toEqual({ bindings: [], drafts: [] })
  })

  it('accepts structurally valid demo bindings and drafts', () => {
    const parsed = parseStoredState(JSON.stringify({
      bindings: [{
        id: 'binding-1',
        patternId: 'pattern-1',
        patternSource: 'gallery',
        regionId: 'wuhan',
        placeId: 'wuhan-hubei-museum',
        note: '测试绑定',
        createdAt: '2026-05-22T00:00:00.000Z',
      }],
      drafts: [{
        id: 'demo-1',
        name: '测试纹样',
        description: '用于本地 Demo 的测试纹样',
        era: '现代',
        technique: '测试',
        regionId: 'wuhan',
        placeId: 'wuhan-hubei-museum',
        imageDataUrl: null,
        colorPalette: ['#b84a39'],
        createdAt: '2026-05-22T00:00:00.000Z',
      }],
    }))

    expect(parsed.bindings).toHaveLength(1)
    expect(parsed.drafts).toHaveLength(1)
  })

  it('drops arrays whose entries do not match the storage schema', () => {
    const parsed = parseStoredState(JSON.stringify({
      bindings: [{ id: 'bad', patternSource: 'other' }],
      drafts: [{ id: 'bad', colorPalette: '#b84a39' }],
    }))

    expect(parsed).toEqual({ bindings: [], drafts: [] })
  })
})
