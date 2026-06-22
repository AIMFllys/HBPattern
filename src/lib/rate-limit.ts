import { RateLimitError } from '@/lib/api/errors'

export interface RateLimitQuota {
  /** 窗口长度（秒）。Phase 0 全部使用 60。 */
  windowSec: number
  /** 该窗口内允许的最大请求数。 */
  max: number
}

/** Requirement 7.3：按路由+方法命名。 */
export const QUOTAS = {
  'POST /api/patterns': { windowSec: 60, max: 10 },
  'POST /api/upload': { windowSec: 60, max: 20 },
  'POST /api/patterns/[id]/comments': { windowSec: 60, max: 30 },
  // 公开只读 API（v1）：按来源 IP 限流，防止匿名抓取 / DoS。
  'GET /api/v1/patterns': { windowSec: 60, max: 120 },
  'GET /api/v1/patterns/[id]': { windowSec: 60, max: 120 },
  'GET /api/v1/regions': { windowSec: 60, max: 120 },
  'GET /api/v1/stats': { windowSec: 60, max: 120 },
} as const satisfies Record<string, RateLimitQuota>

export type QuotaKey = keyof typeof QUOTAS

/** 限流计数器内部结构。 */
interface RateLimitEntry {
  count: number
  resetAt: number // epoch ms
}

/** 全局 store 类型声明，挂载到 globalThis 以跨热重载保持。 */
declare global {
  var __hbRateLimitStore__: Map<string, RateLimitEntry> | undefined
}

/** 获取（或初始化）全局 store。 */
function getStore(): Map<string, RateLimitEntry> {
  if (!globalThis.__hbRateLimitStore__) {
    globalThis.__hbRateLimitStore__ = new Map()
  }
  return globalThis.__hbRateLimitStore__
}

/**
 * Requirement 7.1 / 7.4 / 7.5 / 7.8：
 * - 进程内存计数，key = `${quota}:${subjectId}`，subjectId 由调用方传入
 *   （已登录：user.id；未登录：x-forwarded-for 首个 IP 或 'anonymous'）。
 * - 超配额抛 RateLimitError（含 Retry-After）。
 * - 当 env.RATE_LIMIT_DISABLED === '1'（测试态）则直接返回，不抛错（Req 7.5.b）。
 *
 * ─── 边缘部署注意事项 ───────────────────────────────────────────────────────
 * 本实现使用进程内存 Map（globalThis）做计数，仅在单实例环境下有效。
 * 在腾讯云 EdgeOne Pages / Vercel Edge / 多实例 Serverless 环境下，每个实例
 * 独立计数，限流会失效（用户轮询不同实例可绕过配额）。
 *
 * 生产部署默认降级为 no-op：
 * - 当 NODE_ENV='production' 且未显式设置 RATE_LIMIT_DISABLED 时，自动跳过限流
 *   并在首次调用时打印一条 console.warn 提示。
 * - 自建单实例部署（如宝塔 PM2）时，显式设置 RATE_LIMIT_DISABLED='0' 启用。
 * - EdgeOne Pages 部署时，依赖平台控制台的「速率限制 / WAF 规则」做边缘限流。
 *
 * 测试环境通过显式设置 RATE_LIMIT_DISABLED='1' 或 '0' 控制行为（见 property10 测试）。
 */
let __prodWarned = false

export function rateLimit(quota: QuotaKey, subjectId: string): void {
  // Requirement 7.5.b：测试环境可通过环境变量全局禁用限流
  if (process.env.RATE_LIMIT_DISABLED === '1') {
    return
  }

  // 生产环境默认降级：未显式启用时跳过限流（边缘多实例下进程内计数无意义）
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.RATE_LIMIT_DISABLED !== '0'
  ) {
    if (!__prodWarned) {
      __prodWarned = true
      console.warn(
        '[rate-limit] 生产环境未显式启用（RATE_LIMIT_DISABLED 非 "0"），' +
          '限流已降级为 no-op。边缘/多实例部署请依赖平台侧速率限制；' +
          '自建单实例部署如需启用请设置 RATE_LIMIT_DISABLED=0。',
      )
    }
    return
  }

  const { windowSec, max } = QUOTAS[quota]
  const key = `${quota}:${subjectId}`
  const store = getStore()
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    // 窗口不存在或已过期，重置计数
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return
  }

  // 窗口内，递增计数
  entry.count++

  if (entry.count > max) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    throw new RateLimitError(retryAfterSec)
  }
}

/**
 * 从请求头解析客户端 IP，作为匿名（未登录）请求的限流主体。
 * 取 `x-forwarded-for` 的首个 IP；回退到 `x-real-ip`；都缺失时返回 'anonymous'。
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'anonymous'
}

/**
 * 单测辅助：清空所有计数器。
 * 在需要验证限流行为的测试中，beforeEach 调用此函数以确保干净状态。
 */
export function __resetRateLimiterForTests(): void {
  getStore().clear()
}
