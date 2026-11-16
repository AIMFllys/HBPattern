import { createClient } from '@/lib/supabase/server'
import { AUTH_ROUTES } from '@/lib/auth/routes'
import { ensureUserProfile } from '@/lib/auth/profile'
import { sessionJson, toClientSessionUser } from '../sessionProfile'

export const dynamic = 'force-dynamic'

const REGISTER_FAILED = '注册失败，请稍后再试'

export async function POST(request: Request) {
  let email = ''
  let password = ''
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email : ''
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return sessionJson({ error: REGISTER_FAILED }, 400)
  }

  if (!email || !password) {
    return sessionJson({ error: REGISTER_FAILED }, 400)
  }

  const origin = new URL(request.url).origin
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}${AUTH_ROUTES.callback}`,
      data: { full_name: email.split('@')[0] },
    },
  })

  if (error) {
    return sessionJson({ error: REGISTER_FAILED }, 400)
  }

  let user = null
  if (data.user && data.session) {
    const profile = await ensureUserProfile(supabase, data.user)
    user = profile ? toClientSessionUser(profile) : null
  }

  return sessionJson({ ok: true, user })
}
