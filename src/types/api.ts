/**
 * API 类型统一导出入口。
 *
 * 类型定义的单一真相源在 src/lib/api/*；本文件通过 re-export
 * 将它们纳入 @/types 统一入口，供业务模块使用。
 * 禁止在本文件重复声明已在 @/lib/api/* 中定义的类型。
 *
 * Validates: Requirements 2.x 的类型层 + Requirement 4.1, 4.7
 */

export type { ApiErrorCode, HttpStatus } from '@/lib/api/errors'

export type {
  ResponseMeta,
  PaginationMeta,
  ApiSuccess,
  PaginatedResponse,
  ApiError,
} from '@/lib/api/response'

/** 向后兼容：旧代码里用的 ApiResult<T>。 */
export type ApiResult<T> =
  | import('@/lib/api/response').ApiSuccess<T>
  | import('@/lib/api/response').ApiError
