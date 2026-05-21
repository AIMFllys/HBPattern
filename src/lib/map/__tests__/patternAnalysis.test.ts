import { describe, expect, it } from 'vitest'
import { analyzePatternDraft, calculateCompletenessScore, collectRecommendedTags } from '../patternAnalysis'

const completeDraft = {
  name: '汉绣凤穿牡丹',
  description: '以汉绣针法呈现凤鸟与牡丹，适合绑定武汉汉绣传习点。',
  era: '清代',
  technique: '刺绣',
  regionId: 'wuhan',
  placeId: 'wuhan-han-embroidery',
  colorPalette: ['#b84a39', '#c9a84c', '#f5f0e8'],
}

describe('patternAnalysis', () => {
  it('根据草稿字段、地区和地点输出基础分析', () => {
    const result = analyzePatternDraft(completeDraft, [
      { regionId: 'wuhan' },
      { regionId: 'jingzhou' },
      { regionId: 'wuhan' },
    ])

    expect(result.completenessScore).toBe(100)
    expect(result.matchedRegionName).toBe('武汉市')
    expect(result.matchedPlaceName).toBe('汉绣传习点')
    expect(result.bindingCountInRegion).toBe(2)
    expect(result.recommendedTags).toEqual(expect.arrayContaining(['凤鸟纹', '刺绣纹', '汉绣']))
    expect(result.summary).toContain('资料完整度较高')
  })

  it('对缺字段草稿降低完整度', () => {
    expect(calculateCompletenessScore({ ...completeDraft, description: '', technique: '', colorPalette: [] })).toBeLessThan(70)
  })

  it('合并文本规则与地区地点关键词，并去重截断', () => {
    const tags = collectRecommendedTags('西兰卡普 几何 织锦', ['西兰卡普', '土家几何纹'], ['织锦纹', '西兰卡普'])
    expect(tags).toEqual(expect.arrayContaining(['织锦纹', '几何纹', '西兰卡普', '土家几何纹']))
    expect(new Set(tags).size).toBe(tags.length)
    expect(tags.length).toBeLessThanOrEqual(8)
  })
})
