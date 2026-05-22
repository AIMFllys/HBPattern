import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { hubeiRegions } from '@/data/map/hubei'
import { hubeiBoundaryFeatures } from '@/data/map/hubeiBoundaries'
import { createPatternPlaceholderDataUrl } from '@/lib/patternPlaceholder'

interface ResearchData {
  totalCount: number
  categories: Array<{
    id: string
    patterns: Array<{
      id: string
      name: string
      region: string
      colorPalette: string[]
    }>
  }>
}

function readResearchData() {
  return JSON.parse(readFileSync('scripts/hubei-patterns-data.json', 'utf8')) as ResearchData
}

describe('research data flow', () => {
  it('调研 JSON 总数与实际纹样数组保持一致', () => {
    const data = readResearchData()
    const patterns = data.categories.flatMap(category => category.patterns)

    expect(data.categories).toHaveLength(10)
    expect(patterns).toHaveLength(57)
    expect(data.totalCount).toBe(patterns.length)
  })

  it('地图点位与高细节边界覆盖同一批湖北区域', () => {
    const regionIds = new Set(hubeiRegions.map(region => region.id))
    const boundaryIds = new Set(hubeiBoundaryFeatures.map(feature => feature.id))

    expect(boundaryIds).toEqual(regionIds)
  })

  it('无图纹样可生成可用 SVG 占位图', () => {
    const url = createPatternPlaceholderDataUrl({
      name: '黄梅挑花',
      subtitle: '黄冈市 · 国家级非遗',
      palette: ['#1a1a1a', '#c41e3a', '#daa520'],
    })

    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    expect(decodeURIComponent(url)).toContain('黄梅挑花')
  })
})
