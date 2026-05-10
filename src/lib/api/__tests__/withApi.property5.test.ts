/**
 * Feature: phase-0-tech-debt-cleanup, Property 5
 *
 * Property 5: Request_Id consistency & global uniqueness
 * Validates: Requirements 2.4, 2.8, 2.9, 2.11, 3.8, 6.9, 7.6
 *
 * 子属性 (a): 成功路径 — response.headers.get('x-request-id') 与 body.meta.requestId 相等且均为 UUID v4
 * 子属性 (b): 失败路径 — response.headers.get('x-request-id') 与 body.error.requestId 相等且均为 UUID v4
 * 子属性 (c): 独立发起 100 次请求，收集 100 个 requestId 放入 Set，断言 .size === 100（全局唯一性）
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'
import { withApi } from '../withApi'
import { AppError, type ApiErrorCode } from '../errors'
import { ok } from '../response'

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** 构造一个不携带 x-request-id 的请求（让 withApi 自行生成） */
function makeRequest(url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url)
}

/** 所有合法的 ApiErrorCode */
const ALL_ERROR_CODES: ApiErrorCode[] = [
  'VALIDATION_ERROR',
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'PATTERN_NOT_FOUND',
  'CONFLICT',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMIT_EXCEEDED',
  'INTERNAL_ERROR',
]

describe('Property 5: Request_Id 一致性与唯一性', () => {
  /**
   * 子属性 (a): 成功路径
   * 对任意成功 handler，response.headers.get('x-request-id') 与 body.meta.requestId 相等且均为 UUID v4
   */
  it('(a) 成功路径：x-request-id header 与 meta.requestId 相等且均为 UUID v4', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成任意 JSON 可序列化的数据作为响应体
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.integer(),
        }),
        async (data) => {
          const handler = withApi(async () => ok(data))
          const response = await handler(makeRequest(), undefined)
          const body = await response.json()

          const headerRequestId = response.headers.get('x-request-id')

          // header 必须存在且为 UUID v4
          expect(headerRequestId).toBeTruthy()
          expect(UUID_V4_RE.test(headerRequestId!)).toBe(true)

          // meta.requestId 必须存在且为 UUID v4
          expect(body.meta?.requestId).toBeTruthy()
          expect(UUID_V4_RE.test(body.meta.requestId)).toBe(true)

          // 两者必须相等
          expect(body.meta.requestId).toBe(headerRequestId)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * 子属性 (b): 失败路径
   * 对任意 AppError，response.headers.get('x-request-id') 与 body.error.requestId 相等且均为 UUID v4
   */
  it('(b) 失败路径：x-request-id header 与 error.requestId 相等且均为 UUID v4', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 随机选择错误码
        fc.constantFrom(...ALL_ERROR_CODES),
        // 随机生成 1-200 字符的错误消息
        fc.string({ minLength: 1, maxLength: 200 }),
        async (code, message) => {
          const handler = withApi(async () => {
            throw new AppError(code, message)
          })
          const response = await handler(makeRequest(), undefined)
          const body = await response.json()

          const headerRequestId = response.headers.get('x-request-id')

          // header 必须存在且为 UUID v4
          expect(headerRequestId).toBeTruthy()
          expect(UUID_V4_RE.test(headerRequestId!)).toBe(true)

          // error.requestId 必须存在且为 UUID v4
          expect(body.error?.requestId).toBeTruthy()
          expect(UUID_V4_RE.test(body.error.requestId)).toBe(true)

          // 两者必须相等
          expect(body.error.requestId).toBe(headerRequestId)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * 子属性 (c): 全局唯一性
   * 独立发起 100 次请求，收集 100 个 requestId 放入 Set，断言 .size === 100
   * RATE_LIMIT_DISABLED=1 已在 vitest.setup.ts 中设置
   */
  it('(c) 全局唯一性：100 次独立请求的 requestId 两两不同', async () => {
    const handler = withApi(async () => ok({ ping: true }))

    const requestIds: string[] = []

    for (let i = 0; i < 100; i++) {
      // 每次都构造新请求，不携带 x-request-id，让 withApi 自行生成
      const response = await handler(makeRequest(), undefined)
      const body = await response.json()
      const requestId = body.meta?.requestId as string
      requestIds.push(requestId)
    }

    // 所有 requestId 必须为 UUID v4
    for (const id of requestIds) {
      expect(UUID_V4_RE.test(id)).toBe(true)
    }

    // 放入 Set 后 size 必须等于 100（两两不同）
    const uniqueIds = new Set(requestIds)
    expect(uniqueIds.size).toBe(100)
  })
})
