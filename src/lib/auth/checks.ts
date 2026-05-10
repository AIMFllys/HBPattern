import { createClient } from '@/lib/supabase/server'
import { AuthError } from './AuthError'
import type { Role } from '@/types/user'

/**
 * 已认证用户的精简表示。
 * role 默认为 'user'，从 hp_users 表查得。
 *
 * _Validates: Requirements 5.1, 5.2_
 */
export interface AuthedUser {
  id: string
  email: string | null
  role: Role
}

/**
 * 获取当前登录用户，失败抛 UNAUTHORIZED。
 * 返回值一定非空，调用方无需再做存在性判断。
 *
 * _Validates: Requirements 5.2, 5.3, 5.9_
 */
export async function requireAuth(): Promise<AuthedUser> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user || !data.user.id) {
    throw new AuthError('UNAUTHORIZED')
  }

  const { data: row } = await supabase
    .from('hp_users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role: Role = (row?.role as Role) ?? 'user'

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role,
  }
}

/**
 * 先 requireAuth，再按 hp_users.role 校验。
 * 角色不匹配抛 FORBIDDEN。
 *
 * _Validates: Requirements 5.4, 5.5_
 */
export async function requireRole(roles: ReadonlyArray<Role>): Promise<AuthedUser> {
  const user = await requireAuth()

  if (!roles.includes(user.role)) {
    throw new AuthError('FORBIDDEN')
  }

  return user
}
