import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { resolveRequestId } from "@/lib/api/requestId"

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

  const protectedPaths = ["/dashboard", "/upload", "/profile"]
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
