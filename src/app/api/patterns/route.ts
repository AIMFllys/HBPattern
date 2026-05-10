import { NextRequest } from 'next/server'
import { getPatterns } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { withApi } from '@/lib/api/withApi'
import { ok, okList } from '@/lib/api/response'
import { AppError } from '@/lib/api/errors'
import { parseOrThrow } from '@/lib/validation/parse'
import { ListPatternsQuery, CreatePatternBody } from '@/lib/validation/schemas'
import { requireAuth } from '@/lib/auth/checks'
import { rateLimit } from '@/lib/rate-limit'

export const GET = withApi(async (req: NextRequest) => {
  const query = parseOrThrow(ListPatternsQuery, Object.fromEntries(new URL(req.url).searchParams))
  const { patterns, total } = await getPatterns(query)
  return okList(patterns, { page: query.page, limit: query.limit, total })
})

export const POST = withApi(async (req: NextRequest) => {
  // 步骤 1：校验请求体
  const body = parseOrThrow(CreatePatternBody, await req.json())

  // 步骤 2：鉴权
  const user = await requireAuth()

  // 步骤 3：限流
  rateLimit('POST /api/patterns', user.id)

  // 步骤 4：写入数据库
  const supabase = await createClient()

  const { data: pattern, error } = await supabase
    .from('hp_patterns')
    .insert({
      name: body.name,
      description: body.description ?? null,
      era: body.era ?? null,
      region_id: body.regionId ?? null,
      technique_id: body.techniqueId ?? null,
      uploader_id: user.id,
      status: 'pending',
      license_type: 'copyright',
    })
    .select('id')
    .single()

  if (error) {
    throw new AppError('INTERNAL_ERROR', '创建失败', { cause: error })
  }

  // 步骤 5：回填 hp_pattern_media
  await supabase.from('hp_pattern_media').insert({
    pattern_id: pattern.id,
    media_type: 'image',
    url: body.imageUrl,
    sort_order: 0,
  })

  return ok(pattern, { status: 201 })
})
