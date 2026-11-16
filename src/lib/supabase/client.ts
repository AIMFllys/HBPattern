import { createBrowserClient } from "@supabase/ssr"
import { parse, serialize } from "cookie"
import { sessionCookieOptions } from "@/lib/auth/routes"

function isSessionCredentialCookie(name: string) {
  return name.includes("-auth-token") && !name.includes("code-verifier")
}

export function createClient() {
  const { path, sameSite, secure } = sessionCookieOptions()
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { path, sameSite, secure },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: true,
      },
      cookies: {
        getAll() {
          if (typeof document === "undefined") return []
          const parsed = parse(document.cookie)
          return Object.keys(parsed)
            .map((name) => ({ name, value: parsed[name] ?? "" }))
            .filter((cookie) => !isSessionCredentialCookie(cookie.name))
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return
          cookiesToSet.forEach(({ name, value, options }) => {
            if (isSessionCredentialCookie(name)) return
            document.cookie = serialize(name, value, options)
          })
        },
      },
    }
  )
}
