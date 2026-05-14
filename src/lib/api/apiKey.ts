import { createClient } from '@/lib/supabase/server'

export type ApiKeyTier = 'free' | 'basic' | 'premium'

export interface ApiCaller {
  id: string
  tier: ApiKeyTier
  userId: string
}

/**
 * 从请求 headers 中解析 API Key，查询 hp_api_keys 表验证。
 * 返回 null 表示无 API Key 或无效 key（调用方应回退到 session 认证）。
 *
 * 当前为预留基础设施，未在任何路由中强制启用。
 */
export async function resolveApiCaller(headers: Headers): Promise<ApiCaller | null> {
  const key = headers.get('x-api-key')
  if (!key) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('hp_api_keys')
    .select('id, tier, user_id')
    .eq('key_hash', key)
    .eq('is_active', true)
    .single()

  if (!data) return null

  return { id: data.id, tier: data.tier as ApiKeyTier, userId: data.user_id }
}
