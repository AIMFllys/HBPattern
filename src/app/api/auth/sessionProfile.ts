import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { ensureUserProfile, type AuthProfile } from '@/lib/auth/profile'

export interface ClientSessionUser {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  role?: string
}

export function sessionJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

export function toClientSessionUser(profile: AuthProfile): ClientSessionUser {
  return {
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    avatar_url: profile.avatar_url,
    ...(profile.role ? { role: profile.role } : {}),
  }
}

async function profileForUser(supabase: SupabaseClient, user: User) {
  const { data } = await supabase
    .from('hp_users')
    .select('id, email, nickname, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (data?.id && data.email && data.nickname) {
    return toClientSessionUser(data as AuthProfile)
  }

  const created = await ensureUserProfile(supabase, user)
  return created ? toClientSessionUser(created) : null
}

export async function readClientSession(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return profileForUser(supabase, user)
}
