import type { ApiKeyTier } from './apiKey'

/** 各 tier 每分钟请求限额 */
export const TIER_QUOTAS: Record<ApiKeyTier, { requestsPerMinute: number }> = {
  free: { requestsPerMinute: 30 },
  basic: { requestsPerMinute: 120 },
  premium: { requestsPerMinute: 600 },
}

/**
 * 检查 API Key 配额（预留骨架，当前不实际限流）。
 * 未来接入 Redis 计数器后启用。
 */
export function checkQuota(_tier: ApiKeyTier, _endpoint: string): void {
  void _tier
  void _endpoint
  // TODO: 接入 Redis 滑动窗口计数器
}
