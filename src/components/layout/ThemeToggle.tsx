'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { motion } from 'motion/react'

type Theme = 'light' | 'dark'

// Module-level singleton for theme state
let currentTheme: Theme = 'light'
const listeners = new Set<() => void>()
let initialized = false

function ensureInit() {
  if (initialized || typeof window === 'undefined') return
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored === 'dark' || stored === 'light') {
    currentTheme = stored
  } else {
    currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.setAttribute('data-theme', currentTheme)
  initialized = true
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  // Initialize on first subscriber
  ensureInit()
  return () => { listeners.delete(callback) }
}

function getSnapshot(): Theme {
  ensureInit()
  return currentTheme
}

function getServerSnapshot(): Theme {
  return 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const prevThemeRef = useRef<Theme>(theme)

  // Sync DOM attribute when theme changes
  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      applyTheme(theme)
      prevThemeRef.current = theme
    }
  }, [theme])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    currentTheme = next
    localStorage.setItem('theme', next)
    applyTheme(next)
    // Notify all subscribers
    for (const listener of listeners) listener()
  }, [theme])

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium hover:text-cinnabar hover:bg-cinnabar/10 transition-colors"
      aria-label={theme === 'light' ? '切换为深色模式' : '切换为浅色模式'}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="material-symbols-outlined"
        style={{ fontSize: 20 }}
        aria-hidden="true"
      >
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </motion.span>
    </motion.button>
  )
}

export default ThemeToggle
