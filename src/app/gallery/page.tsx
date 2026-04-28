import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Icon } from '@/components/icons'
import { mockPatterns, filterOptions } from '../_mock/patterns'

export default function GalleryPage() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <SiteHeader logoIcon="filter_vintage" siteName="湖北传统纹样库" primaryColor="cinnabar" />
      
      <main className="flex flex-1 w-full max-w-7xl mx-auto px-6 lg:px-10 py-10 gap-10">
        <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold border-l-4 border-cinnabar pl-3 mb-4">筛选检索</h2>
            
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">年代分类</h3>
              <div className="flex flex-col gap-1">
                {filterOptions.eras.map((era) => (
                  <label key={era} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-rice-warm cursor-pointer group">
                    <input className="rounded-sm border-slate-300 text-cinnabar focus:ring-cinnabar" type="checkbox" />
                    <span className="text-sm text-ink-medium group-hover:text-cinnabar">{era}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">地域分布</h3>
              <div className="flex flex-col gap-1">
                {filterOptions.regions.map((region) => (
                  <label key={region} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-rice-warm cursor-pointer group">
                    <input className="rounded-sm border-slate-300 text-cinnabar focus:ring-cinnabar" type="checkbox" />
                    <span className="text-sm text-ink-medium group-hover:text-cinnabar">{region}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">工艺类别</h3>
              <div className="flex flex-col gap-1">
                {filterOptions.techniques.map((technique) => (
                  <label key={technique} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-rice-warm cursor-pointer group">
                    <input className="rounded-sm border-slate-300 text-cinnabar focus:ring-cinnabar" type="checkbox" />
                    <span className="text-sm text-ink-medium group-hover:text-cinnabar">{technique}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-cinnabar/5 p-6 rounded-xl border border-cinnabar/10">
            <p className="text-sm text-cinnabar font-medium mb-2">学术研究征集</p>
            <p className="text-xs text-ink-light leading-relaxed">欢迎提供更多湖北地方传统纹样线索与学术文章，共同丰富档案库。</p>
            <button className="mt-4 text-xs font-bold text-cinnabar underline">立即参与</button>
          </div>
        </aside>
        
        <section className="flex-1">
          <div className="flex items-baseline justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold font-serif">纹样画廊</h2>
              <span className="text-sm text-ink-faint">共 1,248 件作品</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 bg-rice-warm rounded-lg text-sm text-ink-medium hover:text-cinnabar">
                <Icon name="sort" size={18} />
                最新上传
              </button>
            </div>
          </div>
          
          <div className="masonry-grid">
            {mockPatterns.map((pattern) => (
              <Link key={pattern.id} href={`/gallery/${pattern.id}`} className="masonry-item group cursor-pointer">
                <div 
                  className="relative overflow-hidden rounded-xl bg-rice-warm"
                  style={{ aspectRatio: pattern.aspectRatio }}
                >
                  <div 
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundColor: pattern.imagePlaceholderColor }}
                  />
                  {pattern.isAiGenerated && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-cinnabar uppercase tracking-tight">
                      AI 生成
                    </div>
                  )}
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-base font-bold text-ink group-hover:text-cinnabar transition-colors">{pattern.name}</h3>
                  <p className="text-sm text-ink-light font-serif italic">{pattern.region}</p>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-16 py-10 border-t border-cinnabar/10">
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-faint hover:text-cinnabar transition-colors">
              <Icon name="chevron_left" />
            </button>
            <button className="w-10 h-10 rounded-full bg-cinnabar text-white text-sm font-bold">1</button>
            <button className="w-10 h-10 rounded-full hover:bg-rice-warm text-ink-medium text-sm font-medium">2</button>
            <button className="w-10 h-10 rounded-full hover:bg-rice-warm text-ink-medium text-sm font-medium">3</button>
            <span className="px-2 text-ink-faint">...</span>
            <button className="w-10 h-10 rounded-full hover:bg-rice-warm text-ink-medium text-sm font-medium">12</button>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium hover:text-cinnabar transition-colors">
              <Icon name="chevron_right" />
            </button>
          </div>
        </section>
      </main>
      
      <SiteFooter variant="light" className="mt-10" />
    </div>
  )
}
