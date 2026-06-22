'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { Theme, ResolvedTheme, ThemeContextValue } from '@/types/theme'
import { applyTheme, getStoredTheme, persistTheme, resolveTheme } from '@/lib/theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

const listeners = new Set<() => void>()
let currentResolved: ResolvedTheme = 'light'

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

function getSnapshot(): ResolvedTheme {
  return currentResolved
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    return getStoredTheme()
  })

  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => resolveTheme(theme)
  )

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    persistTheme(next)
    const resolved = resolveTheme(next)
    currentResolved = resolved
    applyTheme(resolved)
    for (const listener of listeners) listener()
  }, [])

  const toggleTheme = useCallback(() => {
    const next: Theme = resolvedTheme === 'light' ? 'dark' : 'light'
    setTheme(next)
  }, [resolvedTheme, setTheme])

  useEffect(() => {
    const stored = getStoredTheme()
    setThemeState(stored)
    currentResolved = resolveTheme(stored)
    applyTheme(currentResolved)
  }, [])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = resolveTheme('system')
      currentResolved = resolved
      applyTheme(resolved)
      for (const listener of listeners) listener()
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
