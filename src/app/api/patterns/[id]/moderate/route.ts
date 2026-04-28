import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase.from('hp_users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: '无权限' } }, { status: 403 })
  }

  const body = await request.json()
  const { action } = body
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '无效操作' } }, { status: 400 })
  }

  const status = action === 'approve' ? 'approved' : 'rejected'
  const { error } = await supabase.from('hp_patterns').update({ status }).eq('id', id)

  if (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '操作失败' } }, { status: 500 })
  }

  return NextResponse.json({ data: { id, status } })
}
