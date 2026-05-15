import { NextRequest } from 'next/server'
import { handleOptions } from '@/lib/api/cors'
import { getPatterns } from '@/lib/queries'
import { withApi } from '@/lib/api/withApi'
import { okList } from '@/lib/api/response'
import { parseOrThrow } from '@/lib/validation/parse'
import { ListPatternsQuery } from '@/lib/validation/schemas'

/**
 * @api GET /api/v1/patterns
 * @summary 获取纹样列表（公开 API）
 * @tag Patterns
 */
export const GET = withApi(async (req: NextRequest) => {
  const query = parseOrThrow(ListPatternsQuery, Object.fromEntries(new URL(req.url).searchParams))
  const { patterns, total } = await getPatterns(query)
  return okList(patterns, { page: query.page, limit: query.limit, total })
})

export function OPTIONS(request: Request) {
  return handleOptions(request)
}
