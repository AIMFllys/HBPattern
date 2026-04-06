import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import { mockPatterns } from '../../_mock/patterns'

export default function PatternDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const pattern = mockPatterns[0]
  
  return (
    <div className="layout-container flex h-full grow flex-col bg-[#f8f8f6]">
      <SiteHeader logoIcon="landscape" siteName="纹样大观" primaryColor="gold" />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="relative group">
            <div className="museum-frame bg-white overflow-hidden rounded-lg">
              <div 
                className="w-full aspect-[4/5] hover:scale-105 transition-transform duration-700"
                style={{ backgroundColor: pattern.imagePlaceholderColor }}
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-cinnabar-deep text-white p-4 writing-vertical font-bold text-lg tracking-widest shadow-lg">
              凤穿牡丹 · 永恒之华
            </div>
          </div>
          
          <div className="flex flex-col gap-8 py-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <h1 className="text-5xl font-black text-ink leading-tight">{pattern.name}</h1>
                <p className="text-gold text-xl italic font-serif">Phoenix & Peony: An Eternal Visual Epic</p>
              </div>
              <div className="flex gap-2">
                <div className="seal-tag writing-vertical text-xs font-bold px-1 border-cinnabar-deep/40">珍藏珍品</div>
                <div className="seal-tag writing-vertical text-xs font-bold px-1 border-cinnabar-deep/40">宫廷御用</div>
              </div>
            </div>
            
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2 bg-gold/10 px-4 py-1 rounded-full border border-gold/20">
                <span className="material-symbols-outlined text-sm">history_edu</span>
                <span className="text-sm font-medium">{pattern.era}</span>
              </div>
              <div className="flex items-center gap-2 bg-gold/10 px-4 py-1 rounded-full border border-gold/20">
                <span className="material-symbols-outlined text-sm">museum</span>
                <span className="text-sm font-medium">{pattern.technique}</span>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none text-ink/80 leading-relaxed space-y-6">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-cinnabar-deep first-letter:mr-3 first-letter:float-left">
                此纹样以凤凰翱翔于盛开的牡丹花丛为主题，象征着权力的尊贵与生命的繁荣。凤凰的线条流转如云，牡丹的花瓣层叠若锦，展现了中国古代工匠对自然与神话的极致想象。
              </p>
              <p>
                在东方美学体系中，凤为鸟中之王，牡丹为花中之魁。两者的结合，不仅是视觉上的繁花似锦，更是对社会安定、富贵吉祥的深切期许。其艺术表现手法随着朝代更迭，由楚式的灵动诡谲演变为盛唐的雍容华贵。
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gold/20">
              <div>
                <span className="text-xs text-gold uppercase tracking-widest block mb-1">主色调</span>
                <div className="flex gap-2">
                  {pattern.colorPalette.map((color, index) => (
                    <div key={index} className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gold uppercase tracking-widest block mb-1">工艺类别</span>
                <span className="font-bold">{pattern.technique}</span>
              </div>
              <div>
                <span className="text-xs text-gold uppercase tracking-widest block mb-1">流行年代</span>
                <span className="font-bold">唐 - 清</span>
              </div>
            </div>
          </div>
        </div>
        
        <section className="mt-24">
          <div className="flex items-center gap-4 mb-12">
            <h3 className="text-2xl font-bold tracking-widest">演变历程</h3>
            <div className="h-[1px] grow bg-gold/20"></div>
          </div>
          
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gold/20 -translate-y-1/2 hidden md:block"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="relative group">
                <div className="bg-[#f8f8f6] p-6 rounded-lg border border-gold/10 hover:border-gold/50 transition-all z-10 relative">
                  <div className="text-cinnabar-deep font-serif text-4xl font-bold opacity-30 mb-2">楚</div>
                  <h4 className="font-bold mb-2">浪漫诡谲</h4>
                  <p className="text-sm text-ink/60">纹样初见雏形，线条细长，极具张力，多见于漆器纹饰。</p>
                </div>
                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gold z-20"></div>
              </div>
              <div className="relative group">
                <div className="bg-[#f8f8f6] p-6 rounded-lg border border-gold/10 hover:border-gold/50 transition-all z-10 relative">
                  <div className="text-cinnabar-deep font-serif text-4xl font-bold opacity-30 mb-2">汉</div>
                  <h4 className="font-bold mb-2">雄浑大气</h4>
                  <p className="text-sm text-ink/60">凤凰形体渐趋丰满，常与云气纹结合，呈现神性之美。</p>
                </div>
                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gold z-20"></div>
              </div>
              <div className="relative group">
                <div className="bg-gold/5 p-6 rounded-lg border-2 border-gold/50 shadow-xl z-10 relative">
                  <div className="text-cinnabar-deep font-serif text-4xl font-bold mb-2">唐</div>
                  <h4 className="font-bold mb-2">雍容华贵</h4>
                  <p className="text-sm text-ink">巅峰时期，牡丹与凤凰完美融合，色彩艳丽，尽显大国气度。</p>
                </div>
                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cinnabar-deep z-20 border-4 border-white"></div>
              </div>
              <div className="relative group">
                <div className="bg-[#f8f8f6] p-6 rounded-lg border border-gold/10 hover:border-gold/50 transition-all z-10 relative">
                  <div className="text-cinnabar-deep font-serif text-4xl font-bold opacity-30 mb-2">清</div>
                  <h4 className="font-bold mb-2">繁缛精巧</h4>
                  <p className="text-sm text-ink/60">细节雕琢至极，工艺精湛，成为宫廷等级的象征。</p>
                </div>
                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gold z-20"></div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="mt-24 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold tracking-widest">相关纹样</h3>
            <a className="text-sm text-gold font-bold flex items-center gap-1 hover:underline" href="#">
              查看更多 <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {mockPatterns.slice(1, 5).map((p) => (
              <Link key={p.id} href={`/gallery/${p.id}`} className="flex flex-col gap-3 group">
                <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gold/10">
                  <div className="w-full h-full group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: p.imagePlaceholderColor }} />
                </div>
                <div className="flex justify-between items-center">
                  <h5 className="font-bold">{p.name}</h5>
                  <span className="text-xs text-gold">{p.era} · {p.technique}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      
      <footer className="bg-ink text-ink-faint py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-ink">
              <span className="material-symbols-outlined text-gold">landscape</span>
              <span className="text-xl font-bold tracking-widest">纹样大观 · 数字化博物馆</span>
            </div>
            <p className="text-sm opacity-60">致力于中国传统纹样的数字化整理与美学传播</p>
          </div>
          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-ink font-bold">探索</span>
              <a className="hover:text-gold transition-colors" href="#">纹样全集</a>
              <a className="hover:text-gold transition-colors" href="#">工艺溯源</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-ink font-bold">研究</span>
              <a className="hover:text-gold transition-colors" href="#">学术论文</a>
              <a className="hover:text-gold transition-colors" href="#">出版物</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-ink font-bold">联络</span>
              <a className="hover:text-gold transition-colors" href="#">关于我们</a>
              <a className="hover:text-gold transition-colors" href="#">版权申明</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-xs text-center opacity-40">
          © 2024 纹样大观数字库. 保留所有权利.
        </div>
      </footer>
    </div>
  )
}
