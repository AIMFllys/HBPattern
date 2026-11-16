import { createClient } from '@/lib/supabase/server'
import { sessionJson } from '../sessionProfile'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let password = ''
  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return sessionJson({ error: '密码更新失败' }, 400)
  }

  if (!password) {
    return sessionJson({ error: '请输入新密码' }, 400)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return sessionJson({ error: '请先登录' }, 401)
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return sessionJson({ error: error.message || '密码更新失败' }, 400)
  }

  return sessionJson({ ok: true })
}
