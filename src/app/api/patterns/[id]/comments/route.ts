import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hp_comments')
    .select('id, content, parent_id, created_at, user:hp_users(id, nickname, avatar_url)')
    .eq('pattern_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '获取评论失败' } }, { status: 500 })
  }
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } }, { status: 401 })
  }

  const body = await request.json()
  const content = body.content?.trim()
  if (!content || content.length > 500) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '评论内容无效' } }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('hp_comments')
    .insert({ pattern_id: id, user_id: user.id, content, parent_id: body.parentId || null, status: 'approved' })
    .select('id, content, parent_id, created_at, user:hp_users(id, nickname, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '发表评论失败' } }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
