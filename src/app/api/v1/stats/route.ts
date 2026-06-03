import type { NextRequest } from 'next/server'
import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { getStats } from '@/lib/queries'
import { handleOptions } from '@/lib/api/cors'
import { rateLimit, clientIp } from '@/lib/rate-limit'

/**
 * @api GET /api/v1/stats
 * @summary 获取平台统计数据（公开 API）
 * @tag Stats
 */
export const GET = withApi(async (req: NextRequest) => {
  rateLimit('GET /api/v1/stats', clientIp(req.headers))
  const stats = await getStats()
  return ok(stats)
})

export function OPTIONS(request: Request) {
  return handleOptions(request)
}
