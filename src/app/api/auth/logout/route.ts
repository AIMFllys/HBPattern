import { createClient } from '@/lib/supabase/server'
import { sessionJson } from '../sessionProfile'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    return sessionJson({ error: '退出登录失败，请稍后再试' }, 500)
  }
  return sessionJson({ ok: true })
}
