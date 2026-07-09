import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { PatternListItem } from '@/types/pattern'


/**
 * 带超时的 promise 包装。
 * EdgeOne / serverless 环境下 Supabase 网络抖动会让 await 永远不 resolve，
 * 导致 SSR Server Component 卡死、页面永久停在 loading.tsx。
 * 超时后抛错，让上层 catch 走 fallback。
 */
function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Supabase query timeout after ${ms}ms`))
    }, ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

/**
 * 安全执行 Supabase 查询，失败时返回 fallback 值。
 * 用于 SSR Server Component，保证页面在数据库不可达时仍能渲染。
 */
async function safeQuery<T>(
  factory: () => Promise<T>,
  fallback: T,
  label = 'query',
): Promise<T> {
  try {
    return await withTimeout(factory(), 8000)
  } catch (e) {
    console.warn(`[queries] ${label} failed, using fallback:`, e instanceof Error ? e.message : e)
    return fallback
  }
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

  return safeQuery(async () => {
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
      // 同时剥离 ILIKE 通配符 (%, _) 与 PostgREST `.or()` 过滤表达式的元字符
      // (, ) , 和 * —— 否则攻击者可借公开搜索注入额外过滤子句
      // （例如改写 status 条件以暴露 pending/rejected 记录）。
      const sanitized = q.replace(/[%_,()*\\]/g, '').trim()
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
  }, { patterns: [] as PatternListItem[], total: 0 }, 'getPatterns')
}

export const getPatternById = cache(async (id: string) => {
  return safeQuery(async () => {
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
  }, null, `getPatternById(${id})`)
})

export async function getRelatedPatterns(patternId: string, techniqueId: string | null, limit = 4) {
  return safeQuery(async () => {
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
  }, [], `getRelatedPatterns(${patternId})`)
}

export async function getFeaturedPatterns(limit = 4) {
  return safeQuery(async () => {
    const supabase = await createClient()

    const { data } = await supabase
      .from('hp_patterns')
      .select(`id, name, era, color_palette, media:hp_pattern_media(url)`)
      .eq('status', 'featured')
      .order('created_at', { ascending: false })
      .limit(limit)

    return data ?? []
  }, [], 'getFeaturedPatterns')
}

export async function getStats() {
  return safeQuery(async () => {
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
  }, { patternCount: 0, regionCount: 0, techniqueCount: 0 }, 'getStats')
}
