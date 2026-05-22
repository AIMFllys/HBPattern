/**
 * 单测：src/proxy.ts — X-Request-Id 前置注入
 *
 * 验收：
 * 1. 入站无 x-request-id 时，返回的 NextResponse 的转发请求头中包含合法 UUID v4。
 * 2. 入站已带合法 UUID v4 时，透传不覆盖（原值保留）。
 *
 * Validates: Requirements 2.4, 2.11；design.md §Request_Id 生成与传播策略
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '../proxy'

// UUID v4 正则（与 requestId.ts 保持一致）
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ── Mock @supabase/ssr ────────────────────────────────────────────────────────
// proxy() 调用 createServerClient，需要 mock 以避免真实 Supabase 连接。
// 返回一个最小化的 fake client：auth.getUser() 返回未登录状态。
let mockUser: { id: string; email?: string } | null = null

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser }, error: null }),
    },
  }),
}))

// ── 辅助：从 NextResponse 读取转发的请求头 ────────────────────────────────────
// NextResponse.next({ request: { headers } }) 会把转发的请求头以
// "x-middleware-request-{key}" 的形式存入响应头（Next.js 内部协议）。
function getForwardedRequestHeader(response: Response, headerName: string): string | null {
  return response.headers.get(`x-middleware-request-${headerName}`)
}

// ── 辅助：构造最小化 NextRequest ──────────────────────────────────────────────
function makeRequest(headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/patterns', {
    headers: headers ?? {},
  })
}

// ── 设置 Supabase 环境变量（proxy.ts 中 createServerClient 需要） ─────────────
beforeEach(() => {
  mockUser = null
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

describe('proxy() — X-Request-Id 前置注入', () => {
  it('入站无 x-request-id 时，转发请求头中应包含合法 UUID v4', async () => {
    const request = makeRequest()
    const response = await proxy(request)

    const requestId = getForwardedRequestHeader(response, 'x-request-id')

    expect(requestId).not.toBeNull()
    expect(UUID_V4_RE.test(requestId!)).toBe(true)
  })

  it('入站 x-request-id 为非法值时，应生成新的合法 UUID v4', async () => {
    const request = makeRequest({ 'x-request-id': 'not-a-uuid' })
    const response = await proxy(request)

    const requestId = getForwardedRequestHeader(response, 'x-request-id')

    expect(requestId).not.toBeNull()
    expect(UUID_V4_RE.test(requestId!)).toBe(true)
    // 确认不是原来的非法值
    expect(requestId).not.toBe('not-a-uuid')
  })

  it('入站已带合法 UUID v4 时，透传不覆盖（原值保留）', async () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000'
    const request = makeRequest({ 'x-request-id': validId })
    const response = await proxy(request)

    const requestId = getForwardedRequestHeader(response, 'x-request-id')

    expect(requestId).toBe(validId)
  })

  it('非受保护路由 + 未登录时，应返回 next 响应（非重定向）', async () => {
    const request = makeRequest()
    const response = await proxy(request)

    // 非受保护路由不应触发重定向（status 应为 200，非 307/308）
    expect(response.status).not.toBe(307)
    expect(response.status).not.toBe(308)
  })

  it('受保护路由 + 未登录时，应重定向到 /login', async () => {
    const request = new NextRequest('http://localhost/dashboard?tab=pending', {
      headers: {},
    })
    const response = await proxy(request)

    expect(response.status).toBeGreaterThanOrEqual(300)
    expect(response.status).toBeLessThan(400)
    const location = response.headers.get('location')
    expect(location).toContain('/login')
    expect(location).toContain('next=%2Fdashboard%3Ftab%3Dpending')
  })

  it('登录页 + 已登录时，应跳转到安全 next 路径', async () => {
    mockUser = { id: 'user-1', email: 'user@example.com' }
    const request = new NextRequest('http://localhost/login?next=%2Fprofile%3Fmode%3Dpassword')
    const response = await proxy(request)

    expect(response.status).toBeGreaterThanOrEqual(300)
    expect(response.headers.get('location')).toBe('http://localhost/profile?mode=password')
  })

  it('登录页 + 外部 next 时，应回退到首页', async () => {
    mockUser = { id: 'user-1', email: 'user@example.com' }
    const request = new NextRequest('http://localhost/login?next=https%3A%2F%2Fevil.example')
    const response = await proxy(request)

    expect(response.headers.get('location')).toBe('http://localhost/')
  })
})
