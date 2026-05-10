import { getPatternById, getRelatedPatterns } from '@/lib/queries'
import { AppError } from '@/lib/api/errors'
import { ok } from '@/lib/api/response'
import { withApi } from '@/lib/api/withApi'
import { parseOrThrow } from '@/lib/validation/parse'
import { PatternIdParam } from '@/lib/validation/schemas'

/**
 * GET /api/patterns/[id]
 *
 * _Validates: Requirements 1.4, 2.1, 2.7, 3.3；Property 2, 3, 7_
 * _Depends on: 2.4, 3.1, 3.2_
 */
export const GET = withApi<object, { params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { id } = parseOrThrow(PatternIdParam, await ctx.params)

    const pattern = await getPatternById(id)
    if (!pattern) {
      throw new AppError('PATTERN_NOT_FOUND', '纹样不存在')
    }

    const related = await getRelatedPatterns(id, pattern.technique_id ?? null)
    return ok({ ...pattern, related })
  },
)
