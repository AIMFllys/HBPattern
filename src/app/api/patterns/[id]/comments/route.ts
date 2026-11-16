/**
 * GET /api/patterns/[id]/comments  — 获取纹样评论列表
 * POST /api/patterns/[id]/comments — 发表评论
 *
 * _Validates: Requirements 2.7, 3.3, 5.7, 7.3；Property 2, 7, 8, 10_
 * _Depends on: 2.4, 3.1, 3.2, 4.2, 6.1_
 */

import type { NextRequest } from 'next/server'
import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { AppError } from '@/lib/api/errors'
import { parseOrThrow } from '@/lib/validation/parse'
import { PatternIdParam, CreateCommentBody } from '@/lib/validation/schemas'
import { requireAuth } from '@/lib/auth/checks'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

type CommentCtx = { params: Promise<{ id: string }> }

type CommentRow = {
  id: string
  content: string
  parent_id: string | null
  created_at: string
  user_id: string
}

type PublicProfile = {
  id: string
  nickname: string
  avatar_url: string | null
}

// hp_users 的 SELECT 只放行本人或管理员。昵称和头像从只含公开列的视图读取。
async function attachPublicProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: CommentRow[],
  failureMessage: string,
) {
  const ids = [...new Set(rows.map((row) => row.user_id))]
  const profiles = new Map<string, PublicProfile>()

  if (ids.length > 0) {
    const { data, error } = await supabase
      .from('hp_user_public')
      .select('id, nickname, avatar_url')
      .in('id', ids)

    if (error) {
      throw new AppError('INTERNAL_ERROR', failureMessage, { cause: error })
    }

    for (const profile of (data ?? []) as PublicProfile[]) {
      profiles.set(profile.id, {
        id: profile.id,
        nickname: profile.nickname,
        avatar_url: profile.avatar_url,
      })
    }
  }

  return rows.map(({ user_id, ...row }) => ({
    ...row,
    user: profiles.get(user_id) ?? null,
  }))
}

export const GET = withApi<unknown, CommentCtx>(async (_req: NextRequest, ctx: CommentCtx) => {
  const { id } = parseOrThrow(PatternIdParam, await ctx.params)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hp_comments')
    .select('id, content, parent_id, created_at, user_id')
    .eq('pattern_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(200) // 防止热门纹样返回无上限的评论列表

  if (error) {
    throw new AppError('INTERNAL_ERROR', '获取评论失败', { cause: error })
  }

  const comments = await attachPublicProfiles(
    supabase,
    (data ?? []) as CommentRow[],
    '获取评论失败',
  )
  return ok(comments)
})

export const POST = withApi<unknown, CommentCtx>(async (req: NextRequest, ctx: CommentCtx) => {
  // 步骤 1：校验路径参数
  const { id } = parseOrThrow(PatternIdParam, await ctx.params)

  // 步骤 2：校验请求体
  const body = parseOrThrow(CreateCommentBody, await req.json())

  // 步骤 3：鉴权
  const user = await requireAuth()

  // 步骤 4：限流
  rateLimit('POST /api/patterns/[id]/comments', user.id)

  // 步骤 5：写库
  const supabase = await createClient()

  // 5a：确认目标纹样存在且对外可见，避免在 pending/rejected/不存在的纹样上
  //     产生孤儿评论（GET 仅返回 approved，写入后将永不可见），并返回干净的 404。
  const { data: target } = await supabase
    .from('hp_patterns')
    .select('id')
    .eq('id', id)
    .in('status', ['approved', 'featured'])
    .maybeSingle()
  if (!target) {
    throw new AppError('PATTERN_NOT_FOUND', '纹样不存在')
  }

  const { data, error } = await supabase
    .from('hp_comments')
    .insert({
      pattern_id: id,
      user_id: user.id,
      content: body.content,
      parent_id: body.parentId ?? null,
      status: 'approved',
    })
    .select('id, content, parent_id, created_at, user_id')
    .single()

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', '发表评论失败', { cause: error })
  }

  const [comment] = await attachPublicProfiles(
    supabase,
    [data as CommentRow],
    '发表评论失败',
  )
  return ok(comment, { status: 201 })
})
