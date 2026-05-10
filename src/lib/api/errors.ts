/**
 * 业务错误码字面量联合。新增错误码必须同时更新 ERROR_CODE_TO_STATUS。
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'PATTERN_NOT_FOUND'
  | 'CONFLICT'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'

export type HttpStatus = 400 | 401 | 403 | 404 | 409 | 413 | 415 | 429 | 500

/** Requirement 2.7 的单一真相表。 */
export const ERROR_CODE_TO_STATUS: Record<ApiErrorCode, HttpStatus> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PATTERN_NOT_FOUND: 404,
  CONFLICT: 409,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
}

export function codeToStatus(code: ApiErrorCode): HttpStatus {
  return ERROR_CODE_TO_STATUS[code]
}

/** 业务异常基类。所有 Route_Handler 内部只 throw AppError 或其子类。 */
export class AppError extends Error {
  readonly code: ApiErrorCode
  readonly details?: unknown
  /** 可选 Header（如 429 的 Retry-After）。 */
  readonly headers?: Readonly<Record<string, string>>

  constructor(
    code: ApiErrorCode,
    message: string,
    opts?: {
      details?: unknown
      headers?: Record<string, string>
      cause?: unknown
    },
  ) {
    super(message, { cause: opts?.cause })
    this.name = 'AppError'
    this.code = code
    this.details = opts?.details
    this.headers = opts?.headers
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, { details })
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSec: number, message = '请求过于频繁，请稍后再试') {
    super('RATE_LIMIT_EXCEEDED', message, {
      headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSec))) },
    })
    this.name = 'RateLimitError'
  }
}
