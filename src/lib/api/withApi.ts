/**
 * Route Handler 组合包装器
 *
 * 负责：生成/透传 Request_Id；捕获 AppError 子类；统一写 X-Request-Id header；
 * 非 production 下透出 error.details；production 下丢弃 details（Requirement 2.5）。
 * 不负责：读 body、解析 query、鉴权 —— 这些由被包装函数自己完成。
 *
 * Validates: Requirements 2.1, 2.4, 2.5, 2.7, 2.8, 2.9, 2.10, 2.11, 3.8, 5.6, 6.9, 7.6
 * Property 2, 3, 4, 5
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AppError, codeToStatus, type ApiErrorCode } from './errors'
import { resolveRequestId } from './requestId'
import type { ApiError, ApiSuccess, PaginatedResponse, PaginationMeta } from './response'

/** 业务 handler 可返回的形状，由 ok/okList/fail 产生。 */
export type HandlerResult<T> =
  | { kind: 'ok'; data: T; status?: number }
  | { kind: 'okList'; items: T[]; pagination: PaginationMeta }
  | { kind: 'fail'; code: ApiErrorCode; message: string; details?: unknown; headers?: Record<string, string> }

/**
 * Route Handler 包装器。
 *
 * Ctx 对应 Next.js 16 的第二个参数（含 `params: Promise<...>`）。
 */
export function withApi<T, Ctx = unknown>(
  handler: (req: NextRequest, ctx: Ctx) => Promise<HandlerResult<T>>,
): (req: NextRequest, ctx: Ctx) => Promise<NextResponse<ApiSuccess<T> | PaginatedResponse<T> | ApiError>> {
  return async (req: NextRequest, ctx: Ctx) => {
    // 步骤 1：生成/透传 requestId
    const requestId = resolveRequestId(req.headers)

    try {
      // 步骤 2：执行业务 handler
      const result = await handler(req, ctx)

      const timestamp = new Date().toISOString()
      const meta = { requestId, timestamp }

      // 步骤 3：根据 kind 构造成功响应体
      if (result.kind === 'ok') {
        const body: ApiSuccess<T> = { data: result.data, meta }
        const status = result.status ?? 200
        const response = NextResponse.json(body, { status })
        response.headers.set('X-Request-Id', requestId)
        return response
      }

      if (result.kind === 'okList') {
        const body: PaginatedResponse<T> = {
          data: result.items,
          pagination: result.pagination,
          meta,
        }
        const response = NextResponse.json(body, { status: 200 })
        response.headers.set('X-Request-Id', requestId)
        return response
      }

      // kind === 'fail'：显式失败分支（Requirement 2.10.a）
      const failResult = result as { kind: 'fail'; code: ApiErrorCode; message: string; details?: unknown; headers?: Record<string, string> }
      const status = codeToStatus(failResult.code)
      const errorBody: ApiError = {
        error: {
          code: failResult.code,
          message: failResult.message,
          requestId,
          details: process.env.NODE_ENV === 'production' ? undefined : failResult.details,
        },
      }
      const response = NextResponse.json(errorBody, { status })
      response.headers.set('X-Request-Id', requestId)
      if (failResult.headers) {
        for (const [key, value] of Object.entries(failResult.headers)) {
          response.headers.set(key, value)
        }
      }
      return response

    } catch (err) {
      // 步骤 4a：AppError（含 ValidationError、RateLimitError、AuthError 等子类）
      if (err instanceof AppError) {
        const status = codeToStatus(err.code)
        const errorBody: ApiError = {
          error: {
            code: err.code,
            message: err.message,
            requestId,
            details: process.env.NODE_ENV === 'production' ? undefined : err.details,
          },
        }
        const response = NextResponse.json(errorBody, { status })
        response.headers.set('X-Request-Id', requestId)
        // 合并 err.headers（如 Retry-After）
        if (err.headers) {
          for (const [key, value] of Object.entries(err.headers)) {
            response.headers.set(key, value)
          }
        }
        return response
      }

      // 步骤 4b：未知异常 → 映射为 INTERNAL_ERROR / 500
      const ts = new Date().toISOString()
      const name = err instanceof Error ? err.constructor.name : 'UnknownError'
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      console.error(
        JSON.stringify({ ts, level: 'error', requestId, name, message, stack }),
      )

      const errorBody: ApiError = {
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
          requestId,
        },
      }
      const response = NextResponse.json(errorBody, { status: 500 })
      response.headers.set('X-Request-Id', requestId)
      return response
    }
  }
}
