/**
 * Feature: phase-0-tech-debt-cleanup, Property 7
 *
 * Property 7: Zod validation is the sole gate into business logic
 * Validates: Requirements 3.3, 3.4, 3.4.a, 3.5, 3.6, 2.10
 *
 * For any request processed by a Route_Handler:
 * (a) If schema.safeParse(input).success === false, the response HTTP status
 *     SHALL be 400 and error.code === 'VALIDATION_ERROR', and the injected
 *     DB mock's side-effect call count SHALL be 0.
 * (b) If schema.safeParse(input).success === true, the response HTTP status
 *     SHALL be in [200, 299].
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'
import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { parseOrThrow } from '@/lib/validation/parse'
import { CreatePatternBody } from '@/lib/validation/schemas'

// ─── 辅助：构造测试用 NextRequest ─────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/patterns'): NextRequest {
  return new NextRequest(url, { method: 'POST' })
}

// ─── 辅助：构造包裹 parseOrThrow 的 mock Route_Handler ───────────────────────

// ─── 辅助类型 ─────────────────────────────────────────────────────────────────

type DbInsertMock = (input: unknown) => Promise<{ id: string }>

// ─── 辅助：构造包裹 parseOrThrow 的 mock Route_Handler ───────────────────────

/**
 * 构造一个模拟的 Route_Handler：
 * 1. 调用 parseOrThrow(CreatePatternBody, body) 进行 Zod 校验
 * 2. 若校验通过，调用注入的 dbInsertMock 并返回 ok(result)
 * 若校验失败，parseOrThrow 会抛 ValidationError，由 withApi 捕获并返回 400
 */
function makeHandler(body: unknown, dbInsertMock: ReturnType<typeof vi.fn<DbInsertMock>>) {
  return withApi(async () => {
    const parsed = parseOrThrow(CreatePatternBody, body)
    const result = await dbInsertMock(parsed)
    return ok(result)
  })
}

// ─── fast-check 生成器 ────────────────────────────────────────────────────────

/**
 * 生成违反 CreatePatternBody 约束的 body。
 * 至少有一个字段违反约束：
 *   - name 超长（> 100 字符）
 *   - imageUrl 非 URL
 *   - regionId 非 UUID（当存在时）
 */
const invalidBodyArb = fc.oneof(
  // name 超长（101..300 字符）
  fc.record({
    name: fc.string({ minLength: 101, maxLength: 300 }),
    imageUrl: fc.webUrl(),
  }),
  // imageUrl 非 URL（使用不含协议的字符串）
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    imageUrl: fc.string({ minLength: 1, maxLength: 50 }).filter(
      (s) => !s.startsWith('http://') && !s.startsWith('https://') && !s.startsWith('ftp://'),
    ),
  }),
  // regionId 非 UUID（当存在时）
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    imageUrl: fc.webUrl(),
    regionId: fc.string({ minLength: 1, maxLength: 30 }).filter(
      (s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s),
    ),
  }),
  // name 为空字符串（违反 min(1)）
  fc.record({
    name: fc.constant(''),
    imageUrl: fc.webUrl(),
  }),
)

/**
 * 生成满足 CreatePatternBody 约束的 body。
 * - name: 1..100 字符
 * - imageUrl: 合法 URL
 * - 可选字段均省略（最简合法 body）
 */
const validBodyArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length >= 1),
  imageUrl: fc.webUrl(),
})

// ─── Property 7(a)：无效 body → 400 VALIDATION_ERROR，dbInsertMock 未被调用 ──

describe('Property 7: Zod 校验是业务逻辑的唯一闸门', () => {
  let dbInsertMock: ReturnType<typeof vi.fn<DbInsertMock>>

  beforeEach(() => {
    dbInsertMock = vi.fn<DbInsertMock>().mockResolvedValue({ id: 'mock-id' })
  })

  it(
    '(a) 违反约束的 body → status=400, error.code=VALIDATION_ERROR, dbInsertMock 调用次数=0',
    async () => {
      await fc.assert(
        fc.asyncProperty(invalidBodyArb, async (body) => {
          dbInsertMock.mockClear()

          const handler = makeHandler(body, dbInsertMock)
          const response = await handler(makeRequest(), undefined)
          const responseBody = await response.json()

          // 响应状态必须为 400
          expect(response.status).toBe(400)

          // error.code 必须为 VALIDATION_ERROR
          expect(responseBody?.error?.code).toBe('VALIDATION_ERROR')

          // dbInsertMock 不得被调用（业务逻辑未执行）
          expect(dbInsertMock.mock.calls.length).toBe(0)
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    '(b) 满足约束的 body → status ∈ [200, 299]',
    async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          dbInsertMock.mockClear()

          const handler = makeHandler(body, dbInsertMock)
          const response = await handler(makeRequest(), undefined)

          // 响应状态必须在 2xx 范围内
          expect(response.status).toBeGreaterThanOrEqual(200)
          expect(response.status).toBeLessThanOrEqual(299)
        }),
        { numRuns: 100 },
      )
    },
  )
})
