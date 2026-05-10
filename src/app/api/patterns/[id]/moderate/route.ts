import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { AppError } from '@/lib/api/errors'
import { parseOrThrow } from '@/lib/validation/parse'
import { PatternIdParam, ModeratePatternBody } from '@/lib/validation/schemas'
import { requireRole } from '@/lib/auth/checks'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

/**
 * PATCH /api/patterns/[id]/moderate
 *
 * 管理员审核纹样（approve / reject）。
 * 使用 withApi 包装，通过 requireRole(['admin']) 替代内联角色判断。
 *
 * _Validates: Requirements 2.7, 3.3, 5.4, 5.5, 5.8；Property 7, 8_
 */
export const PATCH = withApi<{ id: string; status: string }, { params: Promise<{ id: string }> }>(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    // 步骤 1：校验路径参数
    const { id } = parseOrThrow(PatternIdParam, await ctx.params)

    // 步骤 2：校验请求体
    const { action } = parseOrThrow(ModeratePatternBody, await req.json())

    // 步骤 3：鉴权 —— 仅 admin 可操作（Requirement 5.8）
    await requireRole(['admin'])

    // 步骤 4：写库
    const status = action === 'approve' ? 'approved' : 'rejected'
    const supabase = await createClient()
    const { error } = await supabase.from('hp_patterns').update({ status }).eq('id', id)

    if (error) {
      throw new AppError('INTERNAL_ERROR', '操作失败', { cause: error })
    }

    return ok({ id, status })
  },
)
