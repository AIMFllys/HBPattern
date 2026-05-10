/**
 * /api/patterns/[id]/like — 点赞状态查询与切换
 *
 * POST：requireAuth() + parseOrThrow(PatternIdParam) + RPC 调用；返回 ok({ liked, likeCount })。
 * GET：parseOrThrow(PatternIdParam)；未登录走 ok({ liked: false }) 分支，已登录正常查询。
 * 不接入限流（读操作 + 低敏写操作）。
 *
 * _Validates: Requirements 2.7, 3.3, 5.2；Property 2, 5, 7, 8_
 * _Depends on: 2.4, 3.1, 3.2, 4.2_
 */

import type { NextRequest } from 'next/server'
import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { AppError } from '@/lib/api/errors'
import { parseOrThrow } from '@/lib/validation/parse'
import { PatternIdParam } from '@/lib/validation/schemas'
import { requireAuth } from '@/lib/auth/checks'
import { createClient } from '@/lib/supabase/server'

type LikeCtx = { params: Promise<{ id: string }> }

export const POST = withApi<{ liked: boolean; likeCount: number }, LikeCtx>(
  async (req: NextRequest, ctx: LikeCtx) => {
    // 步骤 1：校验路径参数
    const { id } = parseOrThrow(PatternIdParam, await ctx.params)

    // 步骤 2：鉴权（未登录抛 UNAUTHORIZED → 401）
    await requireAuth()

    // 步骤 3：调用 RPC 切换点赞状态
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('hp_toggle_like', { p_pattern_id: id })

    if (error) {
      throw new AppError('INTERNAL_ERROR', '操作失败', { cause: error })
    }

    // RPC 返回 { liked: boolean, like_count: number } 或类似结构
    const liked: boolean = !!(data as { liked?: boolean } | null)?.liked
    const likeCount: number = ((data as { like_count?: number } | null)?.like_count) ?? 0

    return ok({ liked, likeCount })
  },
)

export const GET = withApi<{ liked: boolean; likeCount?: number }, LikeCtx>(
  async (req: NextRequest, ctx: LikeCtx) => {
    // 步骤 1：校验路径参数
    const { id } = parseOrThrow(PatternIdParam, await ctx.params)

    const supabase = await createClient()

    // 步骤 2：检查登录状态（不强制要求登录）
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // 未登录：直接返回 liked: false，不查数据库
      return ok({ liked: false })
    }

    // 步骤 3：已登录，查询点赞记录
    const { data } = await supabase
      .from('hp_user_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('pattern_id', id)
      .maybeSingle()

    return ok({ liked: !!data })
  },
)
