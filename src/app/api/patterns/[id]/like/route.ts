import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('hp_toggle_like', { p_pattern_id: id })
  if (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '操作失败' } }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: { liked: false } })
  }

  const { data } = await supabase
    .from('hp_user_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('pattern_id', id)
    .maybeSingle()

  return NextResponse.json({ data: { liked: !!data } })
}
