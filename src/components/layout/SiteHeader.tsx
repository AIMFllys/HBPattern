interface SiteHeaderProps {
  logoIcon: string
  siteName: string
  primaryColor: 'cinnabar' | 'gold'
  activeNav?: number
}

export default function SiteHeader({ logoIcon, siteName, primaryColor, activeNav = 0 }: SiteHeaderProps) {
  const colorClass = primaryColor === 'cinnabar' ? 'text-cinnabar' : 'text-gold'
  const borderClass = primaryColor === 'cinnabar' ? 'border-cinnabar' : 'border-gold'
  
  const navItems = ['首页', '纹样专题', '学术研究', '数字档案']

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rice-deep/50 bg-rice/80 backdrop-blur-md px-6 lg:px-10 py-4 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-3">
          <div className={colorClass}>
            <span className="material-symbols-outlined text-3xl">{logoIcon}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">{siteName}</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item, index) => (
            <a
              key={item}
              className={`text-sm font-medium transition-colors ${
                index === activeNav
                  ? `text-${primaryColor === 'cinnabar' ? 'cinnabar' : 'gold'} border-b-2 ${borderClass}`
                  : 'text-ink-medium hover:text-cinnabar'
              }`}
              href="#"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-xl">search</span>
          <input
            className="pl-10 pr-4 py-1.5 w-64 bg-rice-warm border-none rounded-lg focus:ring-1 focus:ring-cinnabar text-sm"
            placeholder="搜索纹样..."
            type="text"
          />
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium">
          <span className="material-symbols-outlined">person</span>
        </button>
      </div>
    </header>
  )
}
