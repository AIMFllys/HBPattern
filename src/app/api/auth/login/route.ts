import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'
import { sessionJson, toClientSessionUser } from '../sessionProfile'

export const dynamic = 'force-dynamic'

const LOGIN_FAILED = '登录失败，请检查邮箱和密码后重试'

export async function POST(request: Request) {
  let email = ''
  let password = ''
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email : ''
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return sessionJson({ error: LOGIN_FAILED }, 401)
  }

  if (!email || !password) {
    return sessionJson({ error: LOGIN_FAILED }, 401)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return sessionJson({ error: LOGIN_FAILED }, 401)
  }

  const profile = await ensureUserProfile(supabase, data.user)
  return sessionJson({ user: profile ? toClientSessionUser(profile) : null })
}
