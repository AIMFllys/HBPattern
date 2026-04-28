import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface PatternListItem {
  id: string
  name: string
  description: string | null
  era: string | null
  is_ai_generated: boolean
  status: string
  color_palette: string[] | null
  view_count: number
  like_count: number
  region: { name: string } | null
  technique: { name: string } | null
  media: { url: string; thumbnail_url: string | null }[]
  tags: { tag: { name: string } }[]
}

export async function getPatterns(opts: {
  page?: number
  limit?: number
  era?: string
  region?: string
  sort?: string
  q?: string
} = {}) {
  const { page = 1, limit = 12, era, region, sort = 'newest', q } = opts
  const supabase = await createClient()

  let query = supabase
    .from('hp_patterns')
    .select(`
      id, name, description, era, is_ai_generated, status, color_palette, view_count, like_count,
      region:hp_regions(name),
      technique:hp_techniques(name),
      media:hp_pattern_media(url, thumbnail_url),
      tags:hp_pattern_tags(tag:hp_tags(name))
    `, { count: 'exact' })
    .in('status', ['approved', 'featured'])

  if (era) query = query.eq('era', era)
  if (region) query = query.eq('region_id', region)
  if (q) {
    const sanitized = q.replace(/[%_]/g, '')
    if (sanitized) query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
  }

  if (sort === 'oldest') query = query.order('created_at', { ascending: true })
  else if (sort === 'popular') query = query.order('view_count', { ascending: false })
  else if (sort === 'likes') query = query.order('like_count', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query

  if (error) throw error
  return { patterns: (data ?? []) as unknown as PatternListItem[], total: count ?? 0 }
}

export const getPatternById = cache(async (id: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hp_patterns')
    .select(`
      *,
      region:hp_regions(id, name, province),
      technique:hp_techniques(id, name, category),
      ich_record:hp_ich_records(id, name, level),
      media:hp_pattern_media(id, url, thumbnail_url, media_type, sort_order),
      tags:hp_pattern_tags(tag:hp_tags(id, name))
    `)
    .eq('id', id)
    .in('status', ['approved', 'featured'])
    .single()

  if (error || !data) return null
  return data
})

export async function getRelatedPatterns(patternId: string, techniqueId: string | null, limit = 4) {
  const supabase = await createClient()

  let query = supabase
    .from('hp_patterns')
    .select(`id, name, era, media:hp_pattern_media(url)`)
    .in('status', ['approved', 'featured'])
    .neq('id', patternId)
    .limit(limit)

  if (techniqueId) query = query.eq('technique_id', techniqueId)

  const { data } = await query
  return data ?? []
}

export async function getFeaturedPatterns(limit = 4) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('hp_patterns')
    .select(`id, name, era, color_palette, media:hp_pattern_media(url)`)
    .eq('status', 'featured')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getStats() {
  const supabase = await createClient()

  const [patterns, regions, techniques] = await Promise.all([
    supabase.from('hp_patterns').select('*', { count: 'exact', head: true }).in('status', ['approved', 'featured']),
    supabase.from('hp_regions').select('*', { count: 'exact', head: true }),
    supabase.from('hp_techniques').select('*', { count: 'exact', head: true }),
  ])

  return {
    patternCount: patterns.count ?? 0,
    regionCount: regions.count ?? 0,
    techniqueCount: techniques.count ?? 0,
  }
}
