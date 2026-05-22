export const AUTH_ROUTES = {
  login: '/login',
  callback: '/auth/callback',
  updatePassword: '/profile?mode=password',
} as const

export const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/upload', '/profile'] as const

export function isProtectedPagePath(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function resolveSafeNextPath(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}
