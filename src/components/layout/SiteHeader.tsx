'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from '@/components/icons/Icon'

interface SiteHeaderProps {
  logoIcon?: string
  siteName?: string
  primaryColor?: 'cinnabar' | 'gold'
}

export default function SiteHeader({ 
  logoIcon = 'filter_vintage', 
  siteName = '湖北传统纹样库', 
  primaryColor = 'cinnabar' 
}: SiteHeaderProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const colorClass = primaryColor === 'cinnabar' ? 'text-cinnabar' : 'text-gold'
  const borderClass = primaryColor === 'cinnabar' ? 'border-cinnabar' : 'border-gold'
  const bgClass = primaryColor === 'cinnabar' ? 'bg-cinnabar' : 'bg-gold'
  
  const navItems = [
    { name: '首页', path: '/' },
    { name: '纹样画廊', path: '/gallery' },
    { name: 'AI 创作', path: '/create' },
    { name: '跨界工坊', path: '/workshop' },
    { name: '3D 地图', path: '/map' },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-rice-deep/50 bg-rice/80 backdrop-blur-md px-6 lg:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`${colorClass} transition-transform group-hover:scale-110`}>
              <Icon name={logoIcon} size={36} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink group-hover:text-cinnabar transition-colors">{siteName}</h1>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = item.path === '/' 
                ? pathname === '/' 
                : pathname?.startsWith(item.path)

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-sm font-medium transition-colors py-1 ${
                    isActive
                      ? `${colorClass} border-b-2 ${borderClass}`
                      : 'text-ink-medium hover:text-cinnabar'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="relative">
            <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="pl-10 pr-4 py-1.5 w-64 bg-rice-warm border-none rounded-lg focus:ring-1 focus:ring-cinnabar text-sm transition-all focus:w-72 outline-none"
              placeholder="搜索纹样..."
              type="text"
            />
          </div>
          <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium hover:text-cinnabar hover:bg-cinnabar/10 transition-colors" title="管理后台">
            <Icon name="dashboard" />
          </Link>
          <Link href="/login" className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium hover:text-cinnabar hover:bg-cinnabar/10 transition-colors">
            <Icon name="person" />
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex lg:hidden items-center gap-4">
          <Link href="/login" className="text-ink-medium">
            <Icon name="person" size={24} />
          </Link>
          <button 
            className={`w-10 h-10 rounded-full flex items-center justify-center bg-rice-warm text-ink`}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="打开菜单"
          >
            <Icon name="menu" size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-rice shadow-2xl z-50 flex flex-col lg:hidden"
            >
              <div className="p-6 border-b border-rice-deep flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={colorClass}>
                    <Icon name={logoIcon} size={28} />
                  </div>
                  <span className="font-bold font-serif text-ink tracking-widest">导航菜单</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-rice-warm text-ink-medium hover:bg-rice-deep"
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
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 ${
                        isActive ? `${bgClass}/10 ${colorClass}` : 'text-ink-medium hover:bg-rice-warm'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              <div className="p-6 border-t border-rice-deep bg-rice-warm/50">
                <Link 
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-rice-deep rounded-lg text-ink font-bold shadow-sm mb-3"
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
