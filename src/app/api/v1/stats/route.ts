import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { getStats } from '@/lib/queries'
import { handleOptions } from '@/lib/api/cors'

/**
 * @api GET /api/v1/stats
 * @summary 获取平台统计数据（公开 API）
 * @tag Stats
 */
export const GET = withApi(async () => {
  const stats = await getStats()
  return ok(stats)
})

export function OPTIONS(request: Request) {
  return handleOptions(request)
}
