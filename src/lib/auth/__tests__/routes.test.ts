import { describe, expect, it } from 'vitest'
import { isProtectedPagePath, resolveSafeNextPath } from '../routes'

describe('auth routes', () => {
  it('识别受保护页面前缀', () => {
    expect(isProtectedPagePath('/profile')).toBe(true)
    expect(isProtectedPagePath('/profile/settings')).toBe(true)
    expect(isProtectedPagePath('/gallery')).toBe(false)
  })

  it('只允许站内 next 路径', () => {
    expect(resolveSafeNextPath('/upload?from=gallery')).toBe('/upload?from=gallery')
    expect(resolveSafeNextPath('//evil.example')).toBe('/')
    expect(resolveSafeNextPath('https://evil.example')).toBe('/')
  })
})
