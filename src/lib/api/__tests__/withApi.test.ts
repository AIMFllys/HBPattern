/**
 * withApi 验收测试
 *
 * 验收条件：
 * 1. 对 return ok({ a: 1 }) 的 handler，断言 response.headers.get('x-request-id') === (await response.json()).meta.requestId
 * 2. 对 throw new AppError('FORBIDDEN', 'x') 的 handler，断言响应 status 为 403
 */

import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { withApi } from '../withApi'
import { AppError } from '../errors'
import { ok } from '../response'

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function makeRequest(url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url)
}

describe('withApi', () => {
  it('成功响应：X-Request-Id header 与 meta.requestId 一致', async () => {
    const handler = withApi(async () => ok({ a: 1 }))
    const response = await handler(makeRequest(), undefined)

    const headerRequestId = response.headers.get('x-request-id')
    const body = await response.json()

    expect(headerRequestId).toBeTruthy()
    expect(UUID_V4_RE.test(headerRequestId!)).toBe(true)
    expect(body.meta.requestId).toBe(headerRequestId)
  })

  it('成功响应：status 默认为 200', async () => {
    const handler = withApi(async () => ok({ a: 1 }))
    const response = await handler(makeRequest(), undefined)
    expect(response.status).toBe(200)
  })

  it('成功响应：ok() 传入 status 201 时覆盖默认值', async () => {
    const handler = withApi(async () => ok({ id: 'new' }, { status: 201 }))
    const response = await handler(makeRequest(), undefined)
    expect(response.status).toBe(201)
  })

  it('AppError FORBIDDEN → 响应 status 为 403', async () => {
    const handler = withApi(async () => {
      throw new AppError('FORBIDDEN', 'x')
    })
    const response = await handler(makeRequest(), undefined)
    expect(response.status).toBe(403)
  })

  it('AppError 错误响应：X-Request-Id header 与 error.requestId 一致', async () => {
    const handler = withApi(async () => {
      throw new AppError('NOT_FOUND', '资源不存在')
    })
    const response = await handler(makeRequest(), undefined)

    const headerRequestId = response.headers.get('x-request-id')
    const body = await response.json()

    expect(headerRequestId).toBeTruthy()
    expect(UUID_V4_RE.test(headerRequestId!)).toBe(true)
    expect(body.error.requestId).toBe(headerRequestId)
  })

  it('AppError 错误响应：响应体包含正确的 code 和 message', async () => {
    const handler = withApi(async () => {
      throw new AppError('UNAUTHORIZED', '请先登录')
    })
    const response = await handler(makeRequest(), undefined)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(body.error.message).toBe('请先登录')
    expect(body.data).toBeUndefined()
  })

  it('AppError 含 headers（如 Retry-After）时合并到响应 header', async () => {
    const handler = withApi(async () => {
      throw new AppError('RATE_LIMIT_EXCEEDED', '限流', {
        headers: { 'Retry-After': '30' },
      })
    })
    const response = await handler(makeRequest(), undefined)
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('30')
  })

  it('未知异常 → 映射为 500 INTERNAL_ERROR', async () => {
    const handler = withApi(async () => {
      throw new Error('unexpected db error')
    })
    const response = await handler(makeRequest(), undefined)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(response.headers.get('x-request-id')).toBeTruthy()
  })

  it('okList 响应：包含 data 数组与 pagination', async () => {
    const handler = withApi(async () => {
      const { okList } = await import('../response')
      return okList([{ id: '1' }, { id: '2' }], { page: 1, limit: 10, total: 2 })
    })
    const response = await handler(makeRequest(), undefined)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.pagination).toBeDefined()
    expect(body.meta.requestId).toBe(response.headers.get('x-request-id'))
  })

  it('入站携带合法 X-Request-Id 时透传', async () => {
    const incomingId = '12345678-1234-4234-8234-123456789abc'
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-request-id': incomingId },
    })
    const handler = withApi(async () => ok({ ok: true }))
    const response = await handler(req, undefined)

    expect(response.headers.get('x-request-id')).toBe(incomingId)
    const body = await response.json()
    expect(body.meta.requestId).toBe(incomingId)
  })

  it('production 模式下 error.details 被裁剪', async () => {
    const originalEnv = process.env.NODE_ENV
    // @ts-expect-error 测试覆写 NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      const handler = withApi(async () => {
        throw new AppError('INTERNAL_ERROR', '内部错误', {
          details: { stack: 'sensitive stack trace', supabase: 'db error' },
        })
      })
      const response = await handler(makeRequest(), undefined)
      const body = await response.json()
      expect(body.error.details).toBeUndefined()
    } finally {
      // @ts-expect-error 还原 NODE_ENV
      process.env.NODE_ENV = originalEnv
    }
  })
})
