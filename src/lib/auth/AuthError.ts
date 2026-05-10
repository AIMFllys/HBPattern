import { AppError } from '@/lib/api/errors'

/**
 * 鉴权异常。
 * - UNAUTHORIZED (401)：未登录或 token 无效。
 * - FORBIDDEN (403)：已登录但权限不足。
 *
 * 继承 AppError，因此会被 withApi() 的统一 catch 分支自动映射为对应 HTTP 状态。
 *
 * _Validates: Requirements 5.3, 5.5, 5.6_
 */
export class AuthError extends AppError {
  constructor(kind: 'UNAUTHORIZED' | 'FORBIDDEN', message?: string) {
    super(kind, message ?? (kind === 'UNAUTHORIZED' ? '请先登录' : '无权限'))
    this.name = 'AuthError'
  }

  /** 便于调用方直接读取；等价于 codeToStatus(this.code)。 */
  get status(): 401 | 403 {
    return this.code === 'UNAUTHORIZED' ? 401 : 403
  }
}
