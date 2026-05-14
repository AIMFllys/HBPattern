import type { ApiErrorCode } from './errors'

/**
 * 错误码 → 多语言消息映射。
 * 未来可通过 Accept-Language header 或 ?locale= 参数选择语言。
 */
export const ERROR_MESSAGES: Record<ApiErrorCode, { zh: string; en: string }> = {
  VALIDATION_ERROR: { zh: '请求参数校验失败', en: 'Validation failed' },
  BAD_REQUEST: { zh: '请求格式错误', en: 'Bad request' },
  UNAUTHORIZED: { zh: '请先登录', en: 'Authentication required' },
  FORBIDDEN: { zh: '无权限执行此操作', en: 'Forbidden' },
  NOT_FOUND: { zh: '资源不存在', en: 'Not found' },
  PATTERN_NOT_FOUND: { zh: '纹样不存在', en: 'Pattern not found' },
  CONFLICT: { zh: '资源冲突', en: 'Conflict' },
  FILE_TOO_LARGE: { zh: '文件过大', en: 'File too large' },
  UNSUPPORTED_MEDIA_TYPE: { zh: '不支持的文件类型', en: 'Unsupported media type' },
  RATE_LIMIT_EXCEEDED: { zh: '请求过于频繁，请稍后再试', en: 'Rate limit exceeded' },
  INTERNAL_ERROR: { zh: '服务器内部错误', en: 'Internal server error' },
  SERVICE_UNAVAILABLE: { zh: '服务暂时不可用', en: 'Service unavailable' },
}

export type Locale = 'zh' | 'en'

export function getErrorMessage(code: ApiErrorCode, locale: Locale = 'zh'): string {
  return ERROR_MESSAGES[code][locale]
}
