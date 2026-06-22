import Link from 'next/link'
import { Icon } from '@/components/icons/Icon'

interface SiteFooterProps {
  className?: string
  /** 向后兼容：传入会被忽略，Footer 现在自动跟随全局主题 */
  variant?: 'light' | 'dark'
}

export default function SiteFooter({ className = '', variant }: SiteFooterProps) {
  // variant 参数保留以向后兼容，但不再影响样式——Footer 自动跟随全局主题
  void variant

  return (
    <footer
      role="contentinfo"
      className={`bg-surface-elevated py-12 px-6 lg:px-20 ${className} transition-colors`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="max-w-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-cinnabar">
              <Icon name="filter_vintage" size={24} />
            </div>
            <h2 className="text-lg font-bold font-serif text-text">湖北传统纹样库</h2>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            致力于通过数字技术保存和复兴荆楚大地数千年的文化遗产，为设计师、学者提供精准的传统美学资源。
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 md:gap-16">
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-text uppercase tracking-widest">快速链接</h4>
            <Link className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="/">首页</Link>
            <Link className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="/gallery">纹样大观</Link>
            <Link className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="/map">3D 文化地图</Link>
            <Link className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="/create">AI 创作中心</Link>
            <Link className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="/workshop">跨界工坊</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-text uppercase tracking-widest">研究资源</h4>
            <Link className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="/dashboard">学术文章</Link>
            <a className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="#">工艺溯源</a>
            <a className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="#">出版物</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-text uppercase tracking-widest">合作支持</h4>
            <a className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="#">湖北省博物馆</a>
            <a className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="#">武汉美术馆</a>
            <a className="text-sm text-text-muted hover:text-cinnabar transition-colors" href="#">非遗研究所</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-text uppercase tracking-widest">联系我们</h4>
            <p className="text-sm text-text-muted">contact@hubeipattern.org</p>
            <div className="flex gap-4 mt-2">
              <Icon name="language" className="text-text-muted hover:text-cinnabar cursor-pointer transition-colors" />
              <Icon name="share" className="text-text-muted hover:text-cinnabar cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center`}>
        <p className="text-xs text-text-faint">
          © {new Date().getFullYear()} 湖北传统纹样库. 鄂ICP备2024XXXX号. 保留所有权利.
        </p>
      </div>
    </footer>
  )
}
