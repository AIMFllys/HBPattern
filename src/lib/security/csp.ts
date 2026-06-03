/**
 * Content Security Policy 生成器。
 * 开发环境允许 eval（Next.js HMR 需要），生产环境严格限制。
 */
export function buildCsp(): string {
  const isDev = process.env.NODE_ENV !== 'production'

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', '*.supabase.co', 'lh3.googleusercontent.com'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", '*.supabase.co', ...(isDev ? ['ws://localhost:*'] : [])],
    'frame-ancestors': ["'none'"],
    // 防御性收紧：禁止 <object>/<embed> 插件与 <base> 标签劫持。
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}
