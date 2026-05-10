/**
 * API 响应构造工具
 *
 * 导出响应相关接口与辅助函数。
 * ok / okList / fail 返回中间载荷对象（携带 kind 判别字段），
 * 真正的 HTTP Response 由 withApi() 统一构造。
 *
 * Validates: Requirements 2.1, 2.8, 2.9, 2.10.a; Property 6
 */

import type { ApiErrorCode } from './errors'

/** 响应元数据：Requirement 2.8 / 2.9 */
export interface ResponseMeta {
  requestId: string
  /** ISO 8601 时间戳 */
  timestamp: string
}

/** 分页元数据：Requirement 2.8 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/** 单资源成功响应体 */
export interface ApiSuccess<T> {
  data: T
  meta: ResponseMeta
}

/** 分页列表成功响应体 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
  meta: ResponseMeta
}

/** 错误响应体 */
export interface ApiError {
  error: {
    code: ApiErrorCode
    message: string
    requestId: string
    details?: unknown
  }
}

/**
 * 构造单资源成功响应载荷（不含 HTTP 封装，由 withApi 负责）。
 * opts.status 可覆盖默认 200（如 201 用于创建、204 用于无内容）。
 */
export function ok<T>(
  data: T,
  opts?: { status?: 200 | 201 | 204 },
): { kind: 'ok'; data: T; status?: number } {
  return { kind: 'ok', data, status: opts?.status }
}

/**
 * 构造分页列表成功响应载荷。
 *
 * 分页计算规则（Property 6）：
 * - totalPages = Math.max(1, Math.ceil(total / limit))
 * - hasNext = page < totalPages
 * - hasPrev = page > 1
 */
export function okList<T>(
  items: T[],
  p: { page: number; limit: number; total: number },
): { kind: 'okList'; items: T[]; pagination: PaginationMeta } {
  const { page, limit, total } = p
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return {
    kind: 'okList',
    items,
    pagination: { page, limit, total, totalPages, hasNext, hasPrev },
  }
}

/**
 * 构造显式失败载荷（Requirement 2.10.a 的显式失败分支）。
 *
 * Route_Handler 通常不直接调用此函数，而是 throw AppError / AuthError；
 * fail() 用于 withApi 内部以及少数不希望抛异常的边界场景。
 */
export function fail(
  code: ApiErrorCode,
  message: string,
  opts?: { details?: unknown; headers?: Record<string, string> },
): {
  kind: 'fail'
  code: ApiErrorCode
  message: string
  details?: unknown
  headers?: Record<string, string>
} {
  return {
    kind: 'fail',
    code,
    message,
    details: opts?.details,
    headers: opts?.headers,
  }
}
