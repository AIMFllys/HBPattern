import type { z } from 'zod'
import { ValidationError } from '@/lib/api/errors'

/**
 * 用指定 Zod schema 解析 input；成功返回推导类型，失败抛 ValidationError。
 *
 * Validates: Requirements 3.3, 3.4, 3.4.a, 3.4.b；Property 7
 */
export function parseOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
  message = '请求参数校验失败',
): z.infer<S> {
  const r = schema.safeParse(input)
  if (!r.success) throw new ValidationError(message, r.error.issues)
  return r.data
}
