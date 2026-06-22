import Link from 'next/link'
import { Icon } from '@/components/icons/Icon'
import { Logo } from '@/components/icons/Logo'
import NavLinks from './NavLinks'
import MobileDrawer from './MobileDrawer'
import UserMenu from './UserMenu'
import { ThemeToggle } from './ThemeToggle'

interface SiteHeaderProps {
  siteName?: string
  primaryColor?: 'cinnabar' | 'gold'
}

const navItems = [
  { name: '首页', path: '/' },
  { name: '纹样画廊', path: '/gallery' },
  { name: 'AI 创作', path: '/create' },
  { name: '跨界工坊', path: '/workshop' },
  { name: '3D 地图', path: '/map' },
]

export default function SiteHeader({
  siteName = '湖北传统纹样库',
  primaryColor = 'cinnabar',
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-header-border bg-header-bg backdrop-blur-md px-6 lg:px-10 py-2 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-6 h-6 transition-transform group-hover:scale-110">
            <Logo size={24} />
          </div>
          <span className="text-lg font-bold tracking-tight text-text group-hover:text-cinnabar transition-colors">
            {siteName}
          </span>
        </Link>
        <NavLinks items={navItems} primaryColor={primaryColor} />
      </div>

      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="relative">
          <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            className="pl-10 pr-4 py-1 w-64 bg-surface-elevated border-none rounded-lg focus:ring-1 focus:ring-cinnabar text-sm transition-all focus:w-72 outline-none placeholder:text-text-faint"
            placeholder="搜索纹样..."
            type="text"
          />
        </div>
        <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-elevated text-text-secondary hover:text-cinnabar hover:bg-cinnabar/10 transition-colors" aria-label="管理后台">
          <Icon name="dashboard" />
        </Link>
        <ThemeToggle />
        <UserMenu />
      </div>

      {/* Mobile */}
      <MobileDrawer navItems={navItems} primaryColor={primaryColor} />
    </header>
  )
}
