import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'

export type ApiKeyTier = 'free' | 'basic' | 'premium'

export interface ApiCaller {
  id: string
  tier: ApiKeyTier
  userId: string
}

/**
 * 从请求 headers 中解析 API Key。对请求头原文做 SHA-256（hex）后再查询 hp_api_keys.key_hash。
 * 返回 null 表示无 API Key 或无效 key（调用方应回退到 session 认证）。
 *
 * 当前为预留基础设施，未在任何路由中强制启用。不记录密钥原文。
 */
function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

export async function resolveApiCaller(headers: Headers): Promise<ApiCaller | null> {
  const key = headers.get('x-api-key')
  if (!key) return null

  const keyHash = hashApiKey(key)

  const supabase = await createClient()
  const { data } = await supabase
    .from('hp_api_keys')
    .select('id, tier, user_id')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (!data) return null

  return { id: data.id, tier: data.tier as ApiKeyTier, userId: data.user_id }
}
