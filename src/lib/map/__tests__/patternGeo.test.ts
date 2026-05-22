import { describe, expect, it } from 'vitest'
import { createGalleryMapBindings, resolvePatternPlace } from '../patternGeo'
import type { MapPatternOption } from '@/types'

function pattern(overrides: Partial<MapPatternOption>): MapPatternOption {
  return {
    id: 'p-1',
    name: '汉绣凤穿牡丹',
    description: '武汉汉绣传习点代表纹样',
    era: '清代',
    regionName: '武汉市',
    techniqueName: '刺绣',
    imageUrl: null,
    colorPalette: ['#b84a39'],
    source: 'gallery',
    ...overrides,
  }
}

describe('patternGeo', () => {
  it('按画廊地区字段把纹样解析到湖北地图地点', () => {
    const resolved = resolvePatternPlace(pattern({}))

    expect(resolved?.region.id).toBe('wuhan')
    expect(resolved?.place.id).toBe('wuhan-han-embroidery')
  })

  it('仅为 gallery 来源生成默认地图绑定', () => {
    const bindings = createGalleryMapBindings([
      pattern({ id: 'gallery-1' }),
      pattern({ id: 'demo-1', source: 'demo' }),
    ])

    expect(bindings).toHaveLength(1)
    expect(bindings[0]).toMatchObject({
      id: 'gallery-gallery-1',
      patternId: 'gallery-1',
      patternSource: 'gallery',
      regionId: 'wuhan',
    })
  })
})
