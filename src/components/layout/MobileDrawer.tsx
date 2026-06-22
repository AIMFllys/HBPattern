'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { Logo } from '@/components/icons/Logo'

interface MobileDrawerProps {
  navItems: { name: string; path: string }[]
  primaryColor: 'cinnabar' | 'gold'
}

export default function MobileDrawer({ navItems, primaryColor }: MobileDrawerProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const colorClass = primaryColor === 'cinnabar' ? 'text-cinnabar' : 'text-gold'
  const bgMutedClass = primaryColor === 'cinnabar' ? 'bg-cinnabar/10' : 'bg-gold/10'

  return (
    <>
      <div className="flex lg:hidden items-center gap-4">
        <Link href="/login" className="text-text-secondary" aria-label="登录">
          <Icon name="person" size={24} />
        </Link>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-elevated text-text"
          onClick={() => setIsOpen(true)}
          aria-label="打开导航菜单"
          aria-expanded={isOpen}
        >
          <Icon name="menu" size={24} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-backdrop backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-surface shadow-2xl z-50 flex flex-col lg:hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7">
                    <Logo size={28} />
                  </div>
                  <span className="font-bold font-serif text-text tracking-widest">导航菜单</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-elevated text-text-secondary hover:bg-border"
                  aria-label="关闭导航菜单"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = item.path === '/'
                    ? pathname === '/'
                    : pathname?.startsWith(item.path)

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 ${
                        isActive ? `${bgMutedClass} ${colorClass}` : 'text-text-secondary hover:bg-surface-elevated'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              <div className="p-6 border-t border-border bg-surface-elevated/50">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-surface-inset border border-border rounded-lg text-text font-bold shadow-sm"
                >
                  <Icon name="dashboard" size={18} />
                  管理后台
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
