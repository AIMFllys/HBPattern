import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { hubeiRegions } from '../src/data/map/hubei'

config({ path: '.env.local' })

type TechniqueKey = 'embroidery' | 'dyeing' | 'weaving' | 'printing'

type ResearchPattern = {
  id: string
  name: string
  nameEn?: string
  category: string
  region: string
  specificLocation?: string
  era: string
  technique: TechniqueKey
  ichRecord?: string
  description: string
  historicalBackground?: string
  symbolism?: string
  colorPalette?: string[]
  story?: string
  usage?: string
  imageUrl?: string | null
  status?: 'approved' | 'featured'
}

type ResearchCategory = {
  id: string
  name: string
  city: string
  technique: TechniqueKey
  ichLevel: string
  ichCode?: string
  description: string
  patterns: ResearchPattern[]
}

type ResearchData = { categories: ResearchCategory[] }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  getMatchedEnvKey('A', supabaseUrl) ??
  getMatchedEnvKey('B', supabaseUrl) ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key is required')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})
const researchData = JSON.parse(readFileSync('scripts/hubei-patterns-data.json', 'utf8')) as ResearchData
const systemUserId = '00000000-0000-0000-0009-000000000001'

const techniqueInfo: Record<TechniqueKey, { name: string; category: TechniqueKey; description: string }> = {
  embroidery: { name: '刺绣与挑花', category: 'embroidery', description: '以针线、挑花、绣活或剪纸构成的平面装饰工艺。' },
  dyeing: { name: '印染', category: 'dyeing', description: '以蓝印、防染和民间染织形成的纹样工艺。' },
  weaving: { name: '织锦', category: 'weaving', description: '以经纬线组织生成几何和图腾纹样的织造工艺。' },
  printing: { name: '器物与雕刻纹', category: 'printing', description: '覆盖漆器、青铜、陶器、木雕和拓印等器物纹饰。' },
}

function getMatchedEnvKey(suffix: 'A' | 'B', targetUrl: string | undefined) {
  const url = process.env[`SUPABASE_URL_${suffix}`]
  if (!url || !targetUrl || url.replace(/\/+$/, '') !== targetUrl.replace(/\/+$/, '')) return undefined
  return process.env[`SUPABASE_SERVICE_ROLE_KEY_${suffix}`] ?? process.env[`SUPABASE_ANON_KEY_${suffix}`]
}

function uuidFromSlug(scope: string, slug: string) {
  const hex = createHash('sha1').update(`hbpattern:${scope}:${slug}`).digest('hex').slice(0, 32)
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join('-')
}

function normalizeRegionName(name: string) {
  return name.replace(/湖北省/g, '').replace(/土家族苗族自治州/g, '州').replace(/[市区县]/g, '').trim()
}

function findRegionId(name: string) {
  const normalized = normalizeRegionName(name)
  const region = hubeiRegions.find(item =>
    [item.name, item.shortName].some(candidate => {
      const current = normalizeRegionName(candidate)
      return normalized === current || normalized.includes(current) || current.includes(normalized)
    }),
  )
  return uuidFromSlug('region', region?.id ?? normalized)
}

function mapIchLevel(level: string) {
  if (level.includes('国家') || level.includes('人类')) return 'national'
  if (level.includes('省')) return 'provincial'
  return 'municipal'
}

function pseudoCount(seed: string, min: number, max: number) {
  const value = parseInt(createHash('sha1').update(seed).digest('hex').slice(0, 8), 16)
  return min + (value % (max - min + 1))
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]!))
}

function placeholderUrl(pattern: ResearchPattern) {
  if (pattern.imageUrl) return pattern.imageUrl
  const palette = pattern.colorPalette?.length ? pattern.colorPalette : ['#8c2f22', '#c9a84c', '#f5f0e8']
  const stops = palette.map((color, index) => {
    const offset = Math.round((index / Math.max(1, palette.length - 1)) * 100)
    return `<stop offset="${offset}%" stop-color="${escapeXml(color)}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">${stops}</linearGradient><pattern id="p" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M45 8 82 45 45 82 8 45Z" fill="none" stroke="rgba(255,255,255,.36)" stroke-width="8"/></pattern></defs><rect width="900" height="1100" fill="url(#g)"/><rect width="900" height="1100" fill="url(#p)" opacity=".64"/><text x="450" y="540" fill="rgba(255,255,255,.92)" font-size="82" font-family="serif" font-weight="700" text-anchor="middle">${escapeXml(pattern.name.slice(0, 6))}</text><text x="450" y="625" fill="rgba(255,255,255,.72)" font-size="34" font-family="sans-serif" text-anchor="middle">${escapeXml(pattern.region)} · ${escapeXml(pattern.era)}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

async function upsert(table: string, values: Record<string, unknown>, onConflict = 'id') {
  const { error } = await supabase.from(table).upsert(values, { onConflict })
  if (error) throw new Error(`${table}: ${error.message || error.code}`)
}

async function upsertRows(table: string, rows: Record<string, unknown>[], onConflict = 'id') {
  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100)
    if (chunk.length === 0) continue
    const { error } = await supabase.from(table).upsert(chunk, { onConflict })
    if (error) throw new Error(`${table}: ${error.message || error.code}`)
  }
}

async function main() {
  await upsert('hp_users', {
    id: systemUserId,
    email: 'system@hbpattern.local',
    nickname: '湖北纹样资料库',
    role: 'admin',
    agreed_privacy_policy: true,
  }, 'id')

  await upsertRows('hp_regions', hubeiRegions.map(region => ({
      id: uuidFromSlug('region', region.id),
      name: region.name,
      province: '湖北省',
      city: region.shortName,
      cultural_intro: region.culturalIntro,
  })), 'id')

  await upsertRows('hp_techniques', Object.entries(techniqueInfo).map(([key, info]) => ({
      id: uuidFromSlug('technique', key),
      ...info,
      difficulty_level: 2,
  })), 'id')

  await upsertRows('hp_ich_records', researchData.categories.map(category => ({
      id: uuidFromSlug('ich', category.id),
      name: category.name,
      official_code: category.ichCode ?? null,
      level: mapIchLevel(category.ichLevel),
      protection_status: 'good',
      description: category.description,
  })), 'id')

  const allPatterns = researchData.categories.flatMap(category =>
    category.patterns.map(pattern => ({ ...pattern, categoryId: category.id })),
  )
  const tags = new Map<string, Record<string, unknown>>()
  const patternTags = new Map<string, Record<string, unknown>>()

  const patterns = allPatterns.map(pattern => {
    const patternId = uuidFromSlug('pattern', pattern.id)
    const palette = pattern.colorPalette?.length ? pattern.colorPalette : ['#8c2f22', '#c9a84c', '#f5f0e8']
    return {
      id: patternId,
      name: pattern.name,
      description: pattern.description,
      historical_background: pattern.historicalBackground ?? null,
      era: pattern.era,
      region_id: findRegionId(pattern.region),
      uploader_id: systemUserId,
      technique_id: uuidFromSlug('technique', pattern.technique),
      ich_record_id: uuidFromSlug('ich', pattern.categoryId),
      status: pattern.status ?? 'approved',
      license_type: 'copyright',
      source_declaration: 'Research seed from scripts/hubei-patterns-research-report.md; image is placeholder unless source imageUrl exists.',
      color_palette: palette,
      metadata: {
        nameEn: pattern.nameEn ?? null,
        category: pattern.category,
        specificLocation: pattern.specificLocation ?? null,
        symbolism: pattern.symbolism ?? null,
        story: pattern.story ?? null,
        usage: pattern.usage ?? null,
        source: 'scripts/hubei-patterns-research-report.md',
      },
      view_count: pseudoCount(pattern.id, 80, 1680),
      like_count: pseudoCount(`${pattern.id}:likes`, 8, 260),
    }
  })

  const media = allPatterns.map(pattern => ({
      id: uuidFromSlug('media', pattern.id),
      pattern_id: uuidFromSlug('pattern', pattern.id),
      media_type: 'image',
      url: placeholderUrl(pattern),
      thumbnail_url: placeholderUrl(pattern),
      sort_order: 0,
      metadata: { placeholder: !pattern.imageUrl },
  }))

  for (const pattern of allPatterns) {
    const patternId = uuidFromSlug('pattern', pattern.id)
    const tagNames = [pattern.category, pattern.region, pattern.era, pattern.usage]
      .filter((value): value is string => Boolean(value))
      .flatMap(value => value.split(/[、，,]/).map(item => item.trim()).filter(Boolean))
      .slice(0, 6)

    for (const tagName of tagNames) {
      const tagId = uuidFromSlug('tag', tagName)
      tags.set(tagName, { id: tagId, name: tagName, category: '调研标签' })
      patternTags.set(`${patternId}:${tagId}`, { pattern_id: patternId, tag_id: tagId })
    }
  }

  await upsertRows('hp_patterns', patterns, 'id')
  await upsertRows('hp_pattern_media', media, 'id')
  await upsertRows('hp_tags', [...tags.values()], 'name')
  await upsertRows('hp_pattern_tags', [...patternTags.values()], 'pattern_id,tag_id')

  console.log(`Seed completed: ${hubeiRegions.length} regions, ${Object.keys(techniqueInfo).length} techniques, ${researchData.categories.length} ICH records, ${allPatterns.length} patterns`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
