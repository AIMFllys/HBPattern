/**
 * Feature: phase-0-tech-debt-cleanup, Property 10
 *
 * Property 10: Rate limit window semantics & disable switch
 *
 * For any (quotaKey, subjectId) pair and quota max = QUOTAS[quotaKey].max:
 * (a) When process.env.RATE_LIMIT_DISABLED === '1', consecutive calls to
 *     rateLimit(quotaKey, subjectId) SHALL never throw.
 * (b) Otherwise, within the same 60-second window, the first `max` calls SHALL
 *     not throw; the (max+1)-th call SHALL throw RateLimitError, which maps to
 *     HTTP 429, and the response Retry-After header SHALL be a positive integer ≤ 60.
 * (c) Two different subjectIds have independent counters.
 *
 * Validates: Requirements 7.3, 7.4, 7.5, 7.5.b, 7.6, 7.8
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'
import { rateLimit, __resetRateLimiterForTests, QUOTAS } from '../rate-limit'
import { RateLimitError } from '@/lib/api/errors'
import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'

// 所有 quota key 的数组，用于 fc.constantFrom
const QUOTA_KEYS = Object.keys(QUOTAS) as Array<keyof typeof QUOTAS>

function makeRequest(url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// Property (a): RATE_LIMIT_DISABLED='1' 下任意调用永不抛错
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 10(a): RATE_LIMIT_DISABLED=1 下限流永不触发', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_DISABLED = '1'
    __resetRateLimiterForTests()
  })

  afterEach(() => {
    // 还原为 vitest.setup.ts 的默认值
    process.env.RATE_LIMIT_DISABLED = '1'
  })

  it('任意 (quotaKey, subjectId, repeats) 的 repeats 次调用永不抛错', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUOTA_KEYS),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 200 }),
        (quotaKey, subjectId, repeats) => {
          // 每次属性运行都重置，确保干净状态
          __resetRateLimiterForTests()

          expect(() => {
            for (let i = 0; i < repeats; i++) {
              rateLimit(quotaKey, subjectId)
            }
          }).not.toThrow()
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property (b): RATE_LIMIT_DISABLED='0' 下窗口语义正确
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 10(b): 限流窗口语义 — 前 max 次不抛，第 max+1 次抛 RateLimitError → 429', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_DISABLED = '0'
    __resetRateLimiterForTests()
  })

  afterEach(() => {
    process.env.RATE_LIMIT_DISABLED = '1'
  })

  it('前 max 次 rateLimit(quotaKey, "u") 不抛错', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUOTA_KEYS),
        (quotaKey) => {
          __resetRateLimiterForTests()
          const max = QUOTAS[quotaKey].max

          expect(() => {
            for (let i = 0; i < max; i++) {
              rateLimit(quotaKey, 'u')
            }
          }).not.toThrow()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('第 max+1 次调用抛 RateLimitError', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUOTA_KEYS),
        (quotaKey) => {
          __resetRateLimiterForTests()
          const max = QUOTAS[quotaKey].max

          // 消耗完配额
          for (let i = 0; i < max; i++) {
            rateLimit(quotaKey, 'u')
          }

          // 第 max+1 次必须抛 RateLimitError
          expect(() => rateLimit(quotaKey, 'u')).toThrow(RateLimitError)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('RateLimitError 经 withApi 映射为 HTTP 429，Retry-After 为 1..60 的正整数字符串', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...QUOTA_KEYS),
        async (quotaKey) => {
          __resetRateLimiterForTests()
          const max = QUOTAS[quotaKey].max

          // 消耗完配额
          for (let i = 0; i < max; i++) {
            rateLimit(quotaKey, 'u')
          }

          // 用 withApi 包装一个会触发限流的 handler
          const handler = withApi(async () => {
            rateLimit(quotaKey, 'u') // 第 max+1 次，必然抛 RateLimitError
            return ok({ success: true })
          })

          const response = await handler(makeRequest(), undefined)

          // 状态码必须是 429
          expect(response.status).toBe(429)

          // Retry-After header 必须存在且为 1..60 的正整数字符串
          const retryAfter = response.headers.get('Retry-After')
          expect(retryAfter).not.toBeNull()
          const retryAfterNum = Number(retryAfter)
          expect(Number.isInteger(retryAfterNum)).toBe(true)
          expect(retryAfterNum).toBeGreaterThanOrEqual(1)
          expect(retryAfterNum).toBeLessThanOrEqual(60)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property (c): 不同 subjectId 的计数器相互独立
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 10(c): 不同 subjectId 的计数器相互独立', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_DISABLED = '0'
    __resetRateLimiterForTests()
  })

  afterEach(() => {
    process.env.RATE_LIMIT_DISABLED = '1'
  })

  it('对 u1 打满配额后，u2 的第 1 次调用仍不抛错', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUOTA_KEYS),
        (quotaKey) => {
          __resetRateLimiterForTests()
          const max = QUOTAS[quotaKey].max

          // 将 u1 的配额打满（再多一次，触发限流）
          for (let i = 0; i < max; i++) {
            rateLimit(quotaKey, 'u1')
          }
          // 确认 u1 已被限流
          expect(() => rateLimit(quotaKey, 'u1')).toThrow(RateLimitError)

          // u2 的第 1 次调用不受 u1 影响，不应抛错
          expect(() => rateLimit(quotaKey, 'u2')).not.toThrow()
        },
      ),
      { numRuns: 100 },
    )
  })
})
