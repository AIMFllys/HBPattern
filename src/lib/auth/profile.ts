import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Role } from '@/types/user'

export interface AuthProfile {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  role?: Role
}

function getNickname(user: User) {
  const metadata = user.user_metadata ?? {}
  return metadata.full_name ?? metadata.name ?? user.email?.split('@')[0] ?? '湖北纹样用户'
}

export async function ensureUserProfile(supabase: SupabaseClient, user: User): Promise<AuthProfile | null> {
  if (!user.email) return null

  const payload = {
    id: user.id,
    email: user.email,
    nickname: getNickname(user),
    avatar_url: user.user_metadata?.avatar_url ?? null,
    last_login: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('hp_users')
    .upsert(payload, { onConflict: 'id' })
    .select('id, email, nickname, avatar_url, role')
    .single()

  if (error) return null
  return data as AuthProfile
}
