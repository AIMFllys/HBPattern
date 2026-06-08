'use client'

import { useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxHeight?: string
  title?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  maxHeight = '80vh',
  title,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overscrollBehavior = 'contain'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overscrollBehavior = ''
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[var(--z-overlay)] bg-ink/50"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? '底部面板'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[var(--z-modal)] flex flex-col rounded-t-2xl bg-rice"
            style={{ maxHeight }}
          >
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            >
              <div className="h-1 w-10 rounded-full bg-ink-faint/60" />
            </div>

            {title && (
              <div className="flex items-center justify-between border-b border-rice-deep px-4 pb-3">
                <h2 className="font-serif text-lg font-bold text-ink">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-rice-warm hover:text-ink"
                  aria-label="关闭"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
