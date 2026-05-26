import { getPatternById, getRelatedPatterns } from '@/lib/queries'
import { AppError } from '@/lib/api/errors'
import { ok } from '@/lib/api/response'
import { withApi } from '@/lib/api/withApi'
import { parseOrThrow } from '@/lib/validation/parse'
import { PatternIdParam } from '@/lib/validation/schemas'
import { handleOptions } from '@/lib/api/cors'
import { rateLimit, clientIp } from '@/lib/rate-limit'

/**
 * @api GET /api/v1/patterns/:id
 * @summary 获取纹样详情（公开 API）
 * @tag Patterns
 */
export const GET = withApi<object, { params: Promise<{ id: string }> }>(
  async (req, ctx) => {
    rateLimit('GET /api/v1/patterns/[id]', clientIp(req.headers))
    const { id } = parseOrThrow(PatternIdParam, await ctx.params)
    const pattern = await getPatternById(id)
    if (!pattern) throw new AppError('PATTERN_NOT_FOUND', '纹样不存在')
    const related = await getRelatedPatterns(id, pattern.technique_id ?? null)
    return ok({ ...pattern, related })
  },
)

export function OPTIONS(request: Request) {
  return handleOptions(request)
}
