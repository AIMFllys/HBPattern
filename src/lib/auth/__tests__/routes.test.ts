import { describe, expect, it } from 'vitest'
import { isProtectedPagePath, resolveSafeNextPath, sessionCookieOptions } from '../routes'

describe('auth routes', () => {
  it('识别受保护页面前缀', () => {
    expect(isProtectedPagePath('/profile')).toBe(true)
    expect(isProtectedPagePath('/profile/settings')).toBe(true)
    expect(isProtectedPagePath('/gallery')).toBe(false)
  })

  it('只允许站内 next 路径', () => {
    expect(resolveSafeNextPath('/upload?from=gallery')).toBe('/upload?from=gallery')
    expect(resolveSafeNextPath('/profile')).toBe('/profile')
    expect(resolveSafeNextPath('//evil.example')).toBe('/')
    expect(resolveSafeNextPath('https://evil.example')).toBe('/')
    expect(resolveSafeNextPath('/\\evil.example')).toBe('/')
    expect(resolveSafeNextPath('')).toBe('/')
    expect(resolveSafeNextPath(null)).toBe('/')
    expect(resolveSafeNextPath(undefined)).toBe('/')
  })

  it('反斜杠、协议相对和不同源都回退，合法站内路径仍通过', () => {
    const origin = 'https://app.example'
    expect(resolveSafeNextPath('/upload?from=gallery', '/home', origin)).toBe('/upload?from=gallery')
    expect(resolveSafeNextPath('/profile', '/home', origin)).toBe('/profile')
    expect(resolveSafeNextPath('/\\evil.example', '/home', origin)).toBe('/home')
    expect(resolveSafeNextPath('/profile?x=\\', '/home', origin)).toBe('/home')
    expect(resolveSafeNextPath('//evil.example', '/home', origin)).toBe('/home')
    expect(resolveSafeNextPath(`/\t/evil.example`, '/home', origin)).toBe('/home')
    expect(resolveSafeNextPath('https://app.example/profile', '/home', origin)).toBe('/home')
    expect(resolveSafeNextPath('', '/home', origin)).toBe('/home')
    expect(resolveSafeNextPath(null, '/home', origin)).toBe('/home')
  })

  it('会话 cookie 为 httpOnly，secure 仅在 production', () => {
    const env = process.env as Record<string, string | undefined>
    const previous = env.NODE_ENV
    try {
      env.NODE_ENV = 'development'
      expect(sessionCookieOptions()).toEqual({
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: false,
      })
      env.NODE_ENV = 'production'
      expect(sessionCookieOptions()).toEqual({
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: true,
      })
    } finally {
      env.NODE_ENV = previous
    }
  })
})
