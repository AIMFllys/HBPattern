'use client'

import { motion } from 'motion/react'
import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-elevated text-text-secondary hover:text-cinnabar hover:bg-cinnabar/10 transition-colors"
      aria-label={resolvedTheme === 'light' ? '切换为深色模式' : '切换为浅色模式'}
    >
      <motion.span
        key={resolvedTheme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="material-symbols-outlined"
        style={{ fontSize: 20 }}
        aria-hidden="true"
      >
        {resolvedTheme === 'light' ? 'dark_mode' : 'light_mode'}
      </motion.span>
    </motion.button>
  )
}

export default ThemeToggle
