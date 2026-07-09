/**
 * Content Security Policy 生成器。
 *
 * 生产环境必须为每个请求生成一次性 nonce，并通过响应头
 * `x-nonce` 透传给 Next.js layout（layout.tsx 通过 headers() 读取）。
 * nonce 会被注入到 <script> 标签的 nonce 属性以及 CSP 的 script-src 中，
 * 从而允许 Next.js App Router 内联的 RSC payload 脚本（self.__next_f.push）
 * 在浏览器执行 —— 否则生产环境 hydration 失败，页面永久停在 loading。
 *
 * 开发环境保留 'unsafe-eval'（Next.js HMR 需要）。
 */
export function buildCsp(nonce?: string): string {
  const isDev = process.env.NODE_ENV !== 'production'

  const scriptSrc: string[] = [
    "'self'",
    // 允许 Next.js 注入的 inline script（RSC payload / theme script 等）
    // 通过 nonce 精确放行，避免使用 'unsafe-inline'
    ...(nonce ? [`'nonce-${nonce}'`] : []),
    // dev 环境 HMR 需要 eval
    ...(isDev ? ["'unsafe-eval'"] : []),
    // 兜底：nonce 机制意外失效时也允许 inline，避免再次白屏
    //（仅在 dev 模式生效，生产环境靠 nonce）
    ...(isDev ? ["'unsafe-inline'"] : []),
  ]

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      '*.supabase.co',
      'lh3.googleusercontent.com',
      'tiles.openfreemap.org',
      'elevation-tiles-prod.s3.amazonaws.com',
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      '*.supabase.co',
      'tiles.openfreemap.org',
      'elevation-tiles-prod.s3.amazonaws.com',
      'geo.datav.aliyun.com',
      'lh3.googleusercontent.com',
      ...(isDev ? ['ws://localhost:*'] : []),
    ],
    'worker-src': ["'self'", 'blob:'],
    'frame-ancestors': ["'none'"],
    // 防御性收紧：禁止 <object>/<embed> 插件与 <base> 标签劫持。
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

/** 生成符合 CSP 规范的 base64 nonce（>=128 bits，18 chars）。 */
export function generateNonce(): string {
  // crypto.randomUUID 在 Edge / Node 18+ Web Crypto 上均可用；
  // 去掉连字符得到 32 hex chars，再 base64url 编码 → 22 chars，远超 128 bit 要求。
  const raw = crypto.randomUUID().replace(/-/g, '')
  // 转 bytes 后 base64
  const bytes = new Uint8Array(raw.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16)
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
