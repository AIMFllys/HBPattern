/**
 * Request ID 解析工具
 * 读取入站 X-Request-Id header；非法则回退到生成一个新的 UUID v4。
 *
 * Validates: Requirements 2.4, 2.11; Property 5
 */

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * 读取入站 X-Request-Id；非法则回退到生成一个新的 UUID v4。
 * 该函数"失败安全"：永不抛错。
 */
export function resolveRequestId(headers: Headers): string {
  try {
    const incoming = headers.get('x-request-id')
    if (incoming && UUID_V4_RE.test(incoming)) return incoming
    return crypto.randomUUID()
  } catch {
    return crypto.randomUUID()
  }
}
