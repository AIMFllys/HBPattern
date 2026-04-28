'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinksProps {
  items: { name: string; path: string }[]
  primaryColor: 'cinnabar' | 'gold'
}

export default function NavLinks({ items, primaryColor }: NavLinksProps) {
  const pathname = usePathname()
  const colorClass = primaryColor === 'cinnabar' ? 'text-cinnabar' : 'text-gold'
  const borderClass = primaryColor === 'cinnabar' ? 'border-cinnabar' : 'border-gold'

  return (
    <nav className="hidden lg:flex items-center gap-8">
      {items.map((item) => {
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
  )
}
