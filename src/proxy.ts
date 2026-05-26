import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { resolveRequestId } from "@/lib/api/requestId"
import { SECURITY_HEADERS } from "@/lib/security/headers"
import { buildCsp } from "@/lib/security/csp"
import { corsHeaders } from "@/lib/api/cors"
import { AUTH_ROUTES, isProtectedPagePath, resolveSafeNextPath } from "@/lib/auth/routes"

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

  // 用携带新 header 的 request 初始化 supabaseResponse，
  // NextResponse.next({ request: { headers } }) 会将修改后的 headers 透传给下游。
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

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

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (isProtectedPagePath(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = AUTH_ROUTES.login
    url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return withSecurityHeaders(NextResponse.redirect(url))
  }

  if (pathname === AUTH_ROUTES.login && user) {
    const nextPath = resolveSafeNextPath(request.nextUrl.searchParams.get('next'))
    return withSecurityHeaders(NextResponse.redirect(new URL(nextPath, request.nextUrl.origin)))
  }

  // 注入安全 headers
  withSecurityHeaders(supabaseResponse)

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

function withSecurityHeaders(response: NextResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
  response.headers.set('Content-Security-Policy', buildCsp())
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
