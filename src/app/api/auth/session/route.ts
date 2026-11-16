import { createClient } from '@/lib/supabase/server'
import { readClientSession, sessionJson } from '../sessionProfile'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const user = await readClientSession(supabase)
  return sessionJson({ user })
}
