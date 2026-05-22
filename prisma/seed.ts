import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import { hubeiRegions } from '../src/data/map/hubei'

config({ path: '.env.local' })

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL or DIRECT_URL is required')

const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

type ResearchPattern = {
  id: string
  name: string
  nameEn?: string
  category: string
  region: string
  specificLocation?: string
  era: string
  technique: 'embroidery' | 'dyeing' | 'weaving' | 'printing'
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
  technique: ResearchPattern['technique']
  ichLevel: string
  ichCode?: string
  description: string
  patterns: ResearchPattern[]
}

type ResearchData = {
  categories: ResearchCategory[]
}

const researchData = JSON.parse(
  readFileSync('scripts/hubei-patterns-data.json', 'utf8'),
) as ResearchData

const systemUserId = '00000000-0000-0000-0009-000000000001'

const techniqueInfo: Record<ResearchPattern['technique'], { name: string; category: ResearchPattern['technique']; description: string }> = {
  embroidery: { name: '刺绣与挑花', category: 'embroidery', description: '以针线、挑花、绣活或剪纸构成的平面装饰工艺。' },
  dyeing: { name: '印染', category: 'dyeing', description: '以蓝印、防染和民间染织形成的纹样工艺。' },
  weaving: { name: '织锦', category: 'weaving', description: '以经纬线组织生成几何和图腾纹样的织造工艺。' },
  printing: { name: '器物与雕刻纹', category: 'printing', description: '覆盖漆器、青铜、陶器、木雕和拓印等器物纹饰。' },
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
  const region = hubeiRegions.find(item => {
    const candidates = [item.name, item.shortName]
    return candidates.some(candidate => {
      const current = normalizeRegionName(candidate)
      return normalized === current || normalized.includes(current) || current.includes(normalized)
    })
  })
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">${palette.map((color, index) => `<stop offset="${Math.round((index / Math.max(1, palette.length - 1)) * 100)}%" stop-color="${color}"/>`).join('')}</linearGradient><pattern id="p" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M45 8 82 45 45 82 8 45Z" fill="none" stroke="rgba(255,255,255,.36)" stroke-width="8"/></pattern></defs><rect width="900" height="1100" fill="url(#g)"/><rect width="900" height="1100" fill="url(#p)" opacity=".64"/><text x="450" y="540" fill="rgba(255,255,255,.92)" font-size="82" font-family="serif" font-weight="700" text-anchor="middle">${escapeXml(pattern.name.slice(0, 6))}</text><text x="450" y="625" fill="rgba(255,255,255,.72)" font-size="34" font-family="sans-serif" text-anchor="middle">${escapeXml(pattern.region)} · ${escapeXml(pattern.era)}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

async function main() {
  await prisma.user.upsert({
    where: { email: 'system@hbpattern.local' },
    update: {},
    create: {
      id: systemUserId,
      email: 'system@hbpattern.local',
      nickname: '湖北纹样资料库',
      role: 'admin',
      agreed_privacy_policy: true,
    },
  })

  for (const region of hubeiRegions) {
    await prisma.region.upsert({
      where: { id: uuidFromSlug('region', region.id) },
      update: { name: region.name, cultural_intro: region.culturalIntro },
      create: {
        id: uuidFromSlug('region', region.id),
        name: region.name,
        province: '湖北省',
        city: region.shortName,
        cultural_intro: region.culturalIntro,
      },
    })
  }

  for (const [key, info] of Object.entries(techniqueInfo)) {
    await prisma.technique.upsert({
      where: { id: uuidFromSlug('technique', key) },
      update: { name: info.name, description: info.description },
      create: { id: uuidFromSlug('technique', key), ...info, difficulty_level: 2 },
    })
  }

  for (const category of researchData.categories) {
    await prisma.ichRecord.upsert({
      where: { id: uuidFromSlug('ich', category.id) },
      update: { name: category.name, description: category.description },
      create: {
        id: uuidFromSlug('ich', category.id),
        name: category.name,
        official_code: category.ichCode ?? null,
        level: mapIchLevel(category.ichLevel),
        protection_status: 'good',
        description: category.description,
      },
    })
  }

  const allPatterns = researchData.categories.flatMap(category =>
    category.patterns.map(pattern => ({ ...pattern, categoryId: category.id, categoryName: category.name })),
  )

  for (const pattern of allPatterns) {
    const patternId = uuidFromSlug('pattern', pattern.id)
    const palette = pattern.colorPalette?.length ? pattern.colorPalette : ['#8c2f22', '#c9a84c', '#f5f0e8']
    await prisma.pattern.upsert({
      where: { id: patternId },
      update: {
        name: pattern.name,
        description: pattern.description,
        historical_background: pattern.historicalBackground ?? null,
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
      },
      create: {
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
      },
    })

    await prisma.patternMedia.upsert({
      where: { id: uuidFromSlug('media', pattern.id) },
      update: { url: placeholderUrl(pattern) },
      create: {
        id: uuidFromSlug('media', pattern.id),
        pattern_id: patternId,
        media_type: 'image',
        url: placeholderUrl(pattern),
        thumbnail_url: placeholderUrl(pattern),
        sort_order: 0,
        metadata: { placeholder: !pattern.imageUrl },
      },
    })

    const tagNames = [pattern.category, pattern.region, pattern.era, pattern.usage]
      .filter((value): value is string => Boolean(value))
      .flatMap(value => value.split(/[、，,]/).map(item => item.trim()).filter(Boolean))
      .slice(0, 6)

    for (const tagName of tagNames) {
      const tagId = uuidFromSlug('tag', tagName)
      await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { id: tagId, name: tagName, category: '调研标签' },
      })
      await prisma.patternTag.upsert({
        where: { pattern_id_tag_id: { pattern_id: patternId, tag_id: tagId } },
        update: {},
        create: { pattern_id: patternId, tag_id: tagId },
      })
    }
  }

  console.log(`Seed completed: ${hubeiRegions.length} regions, ${Object.keys(techniqueInfo).length} techniques, ${researchData.categories.length} ICH records, ${allPatterns.length} patterns`)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
