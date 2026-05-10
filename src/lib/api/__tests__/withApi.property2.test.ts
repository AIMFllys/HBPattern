/**
 * Feature: phase-0-tech-debt-cleanup, Property 2
 *
 * Property 2: Error response envelope contract
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 *
 * For any AppError(code, message) thrown by a Route_Handler
 * (code ∈ ApiErrorCode, message.length ∈ [1, 200]),
 * the response body JSON SHALL pass ApiErrorSchema validation:
 *   - error.code matches ^[A-Z][A-Z0-9_]*$
 *   - error.message length ∈ [1, 200]
 *   - error.requestId is a valid UUID v4
 * AND the response SHALL NOT contain a top-level `data` field.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { withApi } from '../withApi'
import { AppError, type ApiErrorCode } from '../errors'

// ─── ApiErrorSchema（本文件内定义）────────────────────────────────────────────

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    message: z.string().min(1).max(200),
    requestId: z.string().regex(UUID_V4_RE),
  }),
})

// ─── 合法 ApiErrorCode 列表（与 errors.ts 保持同步）──────────────────────────

const API_ERROR_CODES: ApiErrorCode[] = [
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

// ─── 辅助：构造测试用 NextRequest ─────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url)
}

// ─── Property 2 ───────────────────────────────────────────────────────────────

describe('Property 2: 错误响应 envelope 契约', () => {
  it(
    '对任意 (code ∈ ApiErrorCode, message[1..200])，withApi 产生的错误响应体通过 ApiErrorSchema 且无顶层 data 字段',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成合法的 ApiErrorCode
          fc.constantFrom(...API_ERROR_CODES),
          // 生成长度 1..200 的字符串（允许中文、ASCII 等任意字符）
          fc.string({ minLength: 1, maxLength: 200 }),
          async (code: ApiErrorCode, message: string) => {
            const handler = withApi(async () => {
              throw new AppError(code, message)
            })

            const response = await handler(makeRequest(), undefined)
            const body = await response.json()

            // 1. 响应体通过 ApiErrorSchema 解析
            const parseResult = ApiErrorSchema.safeParse(body)
            expect(
              parseResult.success,
              `ApiErrorSchema 解析失败（code=${code}, message="${message}"）: ${
                parseResult.success ? '' : JSON.stringify(parseResult.error.issues)
              }`,
            ).toBe(true)

            // 2. 响应顶层不含 data 字段
            expect(
              (body as Record<string, unknown>).data,
              `错误响应不应包含顶层 data 字段（code=${code}）`,
            ).toBeUndefined()
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
