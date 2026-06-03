import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { AppError } from '@/lib/api/errors'
import { handleOptions } from '@/lib/api/cors'
import { rateLimit, clientIp } from '@/lib/rate-limit'

/**
 * @api GET /api/v1/regions
 * @summary 获取地区列表（公开 API）
 * @tag Regions
 */
export const GET = withApi(async (req: NextRequest) => {
  rateLimit('GET /api/v1/regions', clientIp(req.headers))
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hp_regions')
    .select('id, name, province, city, cultural_intro')
    .order('name')
  if (error) throw new AppError('INTERNAL_ERROR', '获取地区列表失败', { details: error })
  return ok(data)
})

export function OPTIONS(request: Request) {
  return handleOptions(request)
}
