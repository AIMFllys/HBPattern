import type { Theme, ResolvedTheme } from '@/types/theme'

export const STORAGE_KEY = 'theme'
export const DEFAULT_THEME: ResolvedTheme = 'light'

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') return getSystemTheme()
  return theme
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  root.style.colorScheme = resolved
}

export function persistTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, theme)
}

export function createThemeScript(): string {
  return `
    (function() {
      try {
        const storageKey = '${STORAGE_KEY}';
        const stored = window.localStorage.getItem(storageKey);
        const theme = stored === 'dark' || stored === 'light' ? stored : 'system';
        const resolved = theme === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;
        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.style.colorScheme = resolved;
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  `.trim()
}
