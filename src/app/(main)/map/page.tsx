import type { Metadata } from 'next'
import SiteHeader from '@/components/layout/SiteHeader'
import HubeiMapClient from '@/components/map/HubeiMapClient'
import { mockPatterns } from '@/data/mock/patterns'
import { getPatterns } from '@/lib/queries'
import type { MapPatternOption, PatternListItem } from '@/types'

export const metadata: Metadata = {
  title: '3D 文化地图',
  description: '以本地矢量湖北地图探索纹样、地点与非遗线索的地理分布。',
}

export default async function MapPage() {
  const initialPatterns = await getInitialMapPatterns()

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-surface transition-colors">
      <SiteHeader
        siteName="湖北非遗3D文化地图"
        primaryColor="gold"
      />
      <HubeiMapClient initialPatterns={initialPatterns} />
    </div>
  )
}

async function getInitialMapPatterns(): Promise<MapPatternOption[]> {
  try {
    const { patterns } = await getPatterns({ page: 1, limit: 24, sort: 'newest' })
    if (patterns.length > 0) return patterns.map(toMapPatternOption)
  } catch {
    // 地图 Demo 在缺少 Supabase 环境变量或本地数据库不可用时仍应可打开。
  }

  return mockPatterns.map(pattern => ({
    id: pattern.id,
    name: pattern.name,
    description: pattern.description,
    era: pattern.era,
    regionName: pattern.region,
    techniqueName: pattern.technique,
    imageUrl: null,
    colorPalette: pattern.colorPalette,
    source: 'gallery',
  }))
}

function toMapPatternOption(pattern: PatternListItem): MapPatternOption {
  return {
    id: pattern.id,
    name: pattern.name,
    description: pattern.description,
    era: pattern.era,
    regionName: pattern.region?.name ?? null,
    techniqueName: pattern.technique?.name ?? null,
    imageUrl: pattern.media?.[0]?.thumbnail_url ?? pattern.media?.[0]?.url ?? null,
    colorPalette: Array.isArray(pattern.color_palette) ? pattern.color_palette : [],
    source: 'gallery',
  }
}
