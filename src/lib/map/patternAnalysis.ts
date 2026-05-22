import { findHubeiPlace, findHubeiRegion } from '@/data/map/hubei'
import type { DemoMapBinding, DemoPatternDraft, PatternAnalysisResult } from '@/types'

const KEYWORD_RULES = [
  { tag: '凤鸟纹', terms: ['凤', '凤凰', '凤鸟'] },
  { tag: '云纹', terms: ['云', '流云', '云雷'] },
  { tag: '水波纹', terms: ['水', '江', '湖', '波', '峡'] },
  { tag: '几何纹', terms: ['几何', '菱', '折线', '回纹'] },
  { tag: '织锦纹', terms: ['织锦', '西兰卡普', '土家'] },
  { tag: '刺绣纹', terms: ['绣', '汉绣', '挑花', '针'] },
  { tag: '青铜纹', terms: ['铜', '青铜', '编钟', '礼器'] },
  { tag: '植物纹', terms: ['花', '草', '桂', '莲', '牡丹', '植物'] },
] as const

export function analyzePatternDraft(
  draft: Pick<DemoPatternDraft, 'name' | 'description' | 'era' | 'technique' | 'regionId' | 'placeId' | 'colorPalette'>,
  bindings: Pick<DemoMapBinding, 'regionId'>[],
): PatternAnalysisResult {
  const region = findHubeiRegion(draft.regionId)
  const place = findHubeiPlace(draft.regionId, draft.placeId)
  const text = `${draft.name} ${draft.description} ${draft.era} ${draft.technique} ${region?.name ?? ''} ${place?.name ?? ''}`
  const recommendedTags = collectRecommendedTags(text, region?.patternKeywords ?? [], place?.patternKeywords ?? [])
  const completenessScore = calculateCompletenessScore(draft)
  const bindingCountInRegion = bindings.filter(binding => binding.regionId === draft.regionId).length

  return {
    completenessScore,
    matchedRegionName: region?.name ?? '未匹配地区',
    matchedPlaceName: place?.name ?? '未匹配地点',
    dominantColors: draft.colorPalette,
    recommendedTags,
    bindingCountInRegion,
    summary: buildSummary(completenessScore, recommendedTags, bindingCountInRegion),
  }
}

export function calculateCompletenessScore(
  draft: Pick<DemoPatternDraft, 'name' | 'description' | 'era' | 'technique' | 'regionId' | 'placeId' | 'colorPalette'>,
): number {
  const checks = [
    draft.name.trim().length >= 2,
    draft.description.trim().length >= 12,
    draft.era.trim().length > 0,
    draft.technique.trim().length > 0,
    Boolean(findHubeiRegion(draft.regionId)),
    Boolean(findHubeiPlace(draft.regionId, draft.placeId)),
    draft.colorPalette.length > 0,
  ]
  const passed = checks.filter(Boolean).length
  return Math.round((passed / checks.length) * 100)
}

export function collectRecommendedTags(text: string, regionKeywords: string[], placeKeywords: string[]): string[] {
  const normalized = text.toLowerCase()
  const tags = new Set<string>()

  for (const rule of KEYWORD_RULES) {
    if (rule.terms.some(term => normalized.includes(term.toLowerCase()))) {
      tags.add(rule.tag)
    }
  }

  for (const keyword of [...regionKeywords, ...placeKeywords]) {
    tags.add(keyword)
  }

  return Array.from(tags).slice(0, 8)
}

function buildSummary(completenessScore: number, tags: string[], bindingCountInRegion: number) {
  if (completenessScore >= 85) {
    return `资料完整度较高，已形成 ${tags.length} 个推荐标签；当前地区已有 ${bindingCountInRegion} 条 Demo 绑定，可直接用于地图展示。`
  }
  if (completenessScore >= 58) {
    return `资料已具备基础入库条件，建议继续补充年代、工艺或说明；当前地区已有 ${bindingCountInRegion} 条 Demo 绑定。`
  }
  return `资料仍偏草稿，请优先补充说明、工艺和地点；当前地区已有 ${bindingCountInRegion} 条 Demo 绑定。`
}
