'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuthModal } from '@/stores/useAuthModal'
import AuthForm from './AuthForm'
import { Icon } from '@/components/icons/Icon'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function AuthModal() {
  const { open, message, closeModal } = useAuthModal()
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const handleClose = useCallback(() => closeModal(), [closeModal])

  // Focus trap + ESC
  useEffect(() => {
    if (!open) {
      previousFocusRef.current?.focus()
      return
    }

    previousFocusRef.current = document.activeElement as HTMLElement

    // 延迟聚焦，等 motion 动画渲染完成
    const raf = requestAnimationFrame(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()
    })

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { handleClose(); return }
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    // 阻止背景滚动
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-backdrop backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal 主体 */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="登录或注册"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.3,
              ease: [0, 0, 0.2, 1],
            }}
            className="relative z-10 w-full max-w-md mx-4 bg-surface rounded-xl shadow-modal p-8 transition-colors"
          >
            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-text-faint transition-colors hover:bg-surface-elevated hover:text-text"
              aria-label="关闭"
            >
              <Icon name="close" size={20} />
            </button>

            <AuthForm
              redirectAfterOAuth={typeof window !== 'undefined' ? window.location.pathname : '/'}
              onLoginSuccess={handleClose}
              message={message || undefined}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
