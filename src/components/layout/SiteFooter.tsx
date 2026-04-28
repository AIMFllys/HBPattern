import Link from 'next/link'
import { Icon } from '@/components/icons'

interface SiteFooterProps {
  variant?: 'light' | 'dark'
  className?: string
}

export default function SiteFooter({ variant = 'light', className = '' }: SiteFooterProps) {
  const isDark = variant === 'dark'
  
  const bgClass = isDark ? 'bg-ink' : 'bg-rice-warm'
  const textMainClass = isDark ? 'text-white' : 'text-ink'
  const textMutedClass = isDark ? 'text-ink-faint' : 'text-ink-light'
  const textHoverClass = isDark ? 'hover:text-gold' : 'hover:text-cinnabar'
  const iconColorClass = isDark ? 'text-gold' : 'text-cinnabar'
  const borderClass = isDark ? 'border-white/10' : 'border-rice-deep'

  return (
    <footer className={`${bgClass} py-12 px-6 lg:px-20 ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="max-w-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className={iconColorClass}>
              <Icon name="filter_vintage" size={24} />
            </div>
            <h2 className={`text-lg font-bold font-serif ${textMainClass}`}>湖北传统纹样库</h2>
          </div>
          <p className={`text-sm ${textMutedClass} leading-relaxed`}>
            致力于通过数字技术保存和复兴荆楚大地数千年的文化遗产，为设计师、学者提供精准的传统美学资源。
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 md:gap-16">
          <div className="flex flex-col gap-4">
            <h4 className={`text-xs font-bold ${textMainClass} uppercase tracking-widest`}>快速链接</h4>
            <Link className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="/">首页</Link>
            <Link className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="/gallery">纹样大观</Link>
            <Link className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="/map">3D 文化地图</Link>
            <Link className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="/create">AI 创作中心</Link>
            <Link className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="/workshop">跨界工坊</Link>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className={`text-xs font-bold ${textMainClass} uppercase tracking-widest`}>研究资源</h4>
            <Link className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="/dashboard">学术文章</Link>
            <a className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="#">工艺溯源</a>
            <a className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="#">出版物</a>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className={`text-xs font-bold ${textMainClass} uppercase tracking-widest`}>合作支持</h4>
            <a className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="#">湖北省博物馆</a>
            <a className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="#">武汉美术馆</a>
            <a className={`text-sm ${textMutedClass} ${textHoverClass} transition-colors`} href="#">非遗研究所</a>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className={`text-xs font-bold ${textMainClass} uppercase tracking-widest`}>联系我们</h4>
            <p className={`text-sm ${textMutedClass}`}>contact@hubeipattern.org</p>
            <div className="flex gap-4 mt-2">
              <Icon name="language" className={`${textMutedClass} ${textHoverClass} cursor-pointer transition-colors`} />
              <Icon name="share" className={`${textMutedClass} ${textHoverClass} cursor-pointer transition-colors`} />
            </div>
          </div>
        </div>
      </div>
      
      <div className={`max-w-7xl mx-auto mt-12 pt-8 border-t ${borderClass} text-center`}>
        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-ink-faint'}`}>
          © {new Date().getFullYear()} 湖北传统纹样库. 鄂ICP备2024XXXX号. 保留所有权利.
        </p>
      </div>
    </footer>
  )
}
