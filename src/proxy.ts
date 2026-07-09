import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { resolveRequestId } from "@/lib/api/requestId"
import { SECURITY_HEADERS } from "@/lib/security/headers"
import { buildCsp, generateNonce } from "@/lib/security/csp"
import { corsHeaders } from "@/lib/api/cors"
import { AUTH_ROUTES, isProtectedPagePath, resolveSafeNextPath } from "@/lib/auth/routes"

/**
 * 判断 Supabase 环境变量是否已配置。
 * EdgeOne / Vercel 等 serverless 平台经常出现：
 *   - NEXT_PUBLIC_* 只在「构建环境变量」配置 → 运行时 process.env 拿不到
 *   - 控制台把变量配在错误的作用域
 * 这种情况下 createServerClient 会抛错或发出无效请求，
 * 进而让整个中间件 500/超时 → 首页永久 loading。
 *
 * 此时让 proxy 退化为「只注入安全头 + 透传」，保证页面至少能渲染。
 */
function hasSupabaseEnv(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function proxy(request: NextRequest) {
  // ── X-Request-Id 前置注入（失败安全，不得抛错）──────────────────────────
  // 必须在 Supabase 会话校验之前执行，以便下游 Route_Handler 通过
  // request.headers.get('x-request-id') 读取到合法 UUID v4。
  let requestId: string
  try {
    requestId = resolveRequestId(request.headers)
  } catch {
    // resolveRequestId 本身已是失败安全，此处仅作双重保险
    requestId = crypto.randomUUID()
  }
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)

  // ── 生成 CSP nonce ────────────────────────────────────────────────────────
  // 每个请求一个独立 nonce，注入到响应头 x-nonce 供 layout.tsx 通过 headers()
  // 读取，并写入 CSP 的 script-src。这样 Next.js 注入的内联 RSC 脚本可执行，
  // 否则生产环境 hydration 失败 → 页面永久卡在 loading.tsx。
  let nonce: string
  try {
    nonce = generateNonce()
  } catch {
    nonce = ''
  }
  if (nonce) {
    requestHeaders.set('x-nonce', nonce)
  }

  // 用携带新 header 的 request 初始化 supabaseResponse，
  // NextResponse.next({ request: { headers } }) 会将修改后的 headers 透传给下游。
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // ── Supabase 会话校验（容错降级）─────────────────────────────────────────
  // 环境变量缺失 / Supabase 不可达时，跳过鉴权让请求继续。
  // 受保护页面的鉴权仍由各 route handler / page 内的 server-side 校验兜底，
  // 这里只做"提前重定向"的优化，失败不应导致全站白屏。
  if (hasSupabaseEnv()) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request: { headers: requestHeaders },
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      // getUser() 超时/失败时返回 null user，不抛错
      const { data: { user } } = await supabase.auth.getUser()

      const pathname = request.nextUrl.pathname

      if (isProtectedPagePath(pathname) && !user) {
        const url = request.nextUrl.clone()
        url.pathname = AUTH_ROUTES.login
        url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
        return withSecurityHeaders(NextResponse.redirect(url), nonce)
      }

      if (pathname === AUTH_ROUTES.login && user) {
        const nextPath = resolveSafeNextPath(request.nextUrl.searchParams.get('next'))
        return withSecurityHeaders(NextResponse.redirect(new URL(nextPath, request.nextUrl.origin)), nonce)
      }
    } catch {
      // Supabase 异常（网络/超时/auth 端点不可达）：降级为匿名请求继续。
      // 避免单个外部依赖故障导致全站白屏。
    }
  }

  // 注入安全 headers
  withSecurityHeaders(supabaseResponse, nonce)

  // 为公开 API (v1) 注入 CORS headers。
  // 使用 corsHeaders() 作为单一真相源，使实际响应与 OPTIONS 预检
  // (lib/api/cors.ts) 行为一致，并尊重 CORS_ALLOWED_ORIGINS 白名单
  // （未配置时默认 '*'，适用于公开只读 API）。
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    const origin = request.headers.get('origin')
    Object.entries(corsHeaders(origin)).forEach(([k, v]) =>
      supabaseResponse.headers.set(k, v)
    )
  }

  return supabaseResponse
}

function withSecurityHeaders(response: NextResponse, nonce?: string) {
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
  response.headers.set('Content-Security-Policy', buildCsp(nonce))
  // HSTS 仅在生产环境注入（HTTPS 部署）。浏览器仅在 HTTPS 响应上处理该头，
  // 但开发环境（http）下显式跳过以避免本地自签名场景的副作用。
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains',
    )
  }
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
