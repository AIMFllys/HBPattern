export const AUTH_ROUTES = {
  login: '/login',
  callback: '/auth/callback',
  updatePassword: '/profile?mode=password',
} as const

export const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/upload', '/profile'] as const

export function isProtectedPagePath(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function canonicalOrigin(origin?: string) {
  if (!origin) return 'http://localhost'
  try {
    return new URL(origin).origin
  } catch {
    return 'http://localhost'
  }
}

export function resolveSafeNextPath(value: string | null | undefined, fallback = '/', origin?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback

  const base = canonicalOrigin(origin)
  try {
    const parsed = new URL(value, base)
    if (parsed.origin !== base) return fallback
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`
    if (!path.startsWith('/') || path.startsWith('//')) return fallback
    if (new URL(path, base).origin !== base) return fallback
    return path
  } catch {
    return fallback
  }
}

/** 服务端会话 cookie。secure 只在 production 打开，本地 http 仍能写入。 */
export function sessionCookieOptions() {
  return {
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }
}
