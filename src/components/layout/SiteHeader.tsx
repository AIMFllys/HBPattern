'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/icons'

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
  
  const colorClass = primaryColor === 'cinnabar' ? 'text-cinnabar' : 'text-gold'
  const borderClass = primaryColor === 'cinnabar' ? 'border-cinnabar' : 'border-gold'
  
  const navItems = [
    { name: '首页', path: '/' },
    { name: '纹样画廊', path: '/gallery' },
    { name: 'AI 创作', path: '/create' },
    { name: '跨界工坊', path: '/workshop' },
    { name: '3D 地图', path: '/map' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rice-deep/50 bg-rice/80 backdrop-blur-md px-6 lg:px-10 py-4 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <Link href="/" className="flex items-center gap-3 group">
          <div className={`${colorClass} transition-transform group-hover:scale-110`}>
            <Icon name={logoIcon} size={36} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink group-hover:text-cinnabar transition-colors">{siteName}</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            // 判断是否激活：精确匹配首页，或者以该路径开头（如 /gallery/1 也算 /gallery 激活）
            const isActive = item.path === '/' 
              ? pathname === '/' 
              : pathname?.startsWith(item.path)

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-medium transition-colors py-1 ${
                  isActive
                    ? `text-${primaryColor === 'cinnabar' ? 'cinnabar' : 'gold'} border-b-2 ${borderClass}`
                    : 'text-ink-medium hover:text-cinnabar'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative hidden sm:block">
          <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            className="pl-10 pr-4 py-1.5 w-64 bg-rice-warm border-none rounded-lg focus:ring-1 focus:ring-cinnabar text-sm transition-all focus:w-72"
            placeholder="搜索纹样..."
            type="text"
          />
        </div>
        <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium hover:text-cinnabar hover:bg-cinnabar/10 transition-colors" title="管理后台">
          <Icon name="dashboard" />
        </Link>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium hover:text-cinnabar hover:bg-cinnabar/10 transition-colors">
          <Icon name="person" />
        </button>
      </div>
    </header>
  )
}
