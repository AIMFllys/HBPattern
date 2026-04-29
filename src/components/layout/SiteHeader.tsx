import Link from 'next/link'
import { Icon } from '@/components/icons/Icon'
import NavLinks from './NavLinks'
import MobileDrawer from './MobileDrawer'
import UserMenu from './UserMenu'

interface SiteHeaderProps {
  logoIcon?: string
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
  logoIcon = 'filter_vintage',
  siteName = '湖北传统纹样库',
  primaryColor = 'cinnabar',
}: SiteHeaderProps) {
  const colorClass = primaryColor === 'cinnabar' ? 'text-cinnabar' : 'text-gold'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rice-deep/50 bg-rice/80 backdrop-blur-md px-6 lg:px-10 py-4 flex items-center justify-between">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className={`${colorClass} transition-transform group-hover:scale-110`}>
            <Icon name={logoIcon} size={28} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-ink group-hover:text-cinnabar transition-colors">
            {siteName}
          </h1>
        </Link>
        <NavLinks items={navItems} primaryColor={primaryColor} />
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
        <UserMenu />
      </div>

      {/* Mobile */}
      <MobileDrawer navItems={navItems} primaryColor={primaryColor} logoIcon={logoIcon} />
    </header>
  )
}
