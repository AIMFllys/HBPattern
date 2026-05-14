import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Icon } from '@/components/icons/Icon'
import { getFeaturedPatterns, getStats } from '@/lib/queries'

export const metadata: Metadata = {
  title: '湖北纹案文化展示平台 — 千年纹饰之美',
  description: '探索湖北传统纹绣文化的数字化平台。浏览纹样画廊、3D文化地图、AI创作中心。',
  openGraph: {
    title: '湖北纹案文化展示平台',
    description: '探索湖北传统纹绣文化的数字化平台。浏览纹样画廊、3D文化地图、AI创作中心。',
  },
}

export default async function HomePage() {
  const [stats, featured] = await Promise.all([getStats(), getFeaturedPatterns(4)])

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-rice">
      <SiteHeader logoIcon="filter_vintage" siteName="湖北传统纹样库" primaryColor="cinnabar" />

      <main className="flex flex-col w-full">
        {/* Hero Section */}
        <section className="relative w-full max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 flex flex-col gap-8 z-10">
            <div className="flex gap-3">
              <div className="seal-tag writing-vertical text-xs font-bold px-1 border-cinnabar/40 text-cinnabar">数字新生</div>
              <div className="seal-tag writing-vertical text-xs font-bold px-1 border-cinnabar/40 text-cinnabar">荆楚遗韵</div>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-ink font-serif leading-tight">
              探索千年<br />
              <span className="text-cinnabar">传统纹样</span>之美
            </h1>
            <p className="text-lg text-ink-light max-w-xl leading-relaxed">
              致力于通过数字技术保存和复兴荆楚大地数千年的文化遗产，为设计师、学者提供精准的传统美学资源与 AI 创作工具。
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <Link href="/gallery" className="btn-primary text-base px-8 py-3">
                探索纹样库
                <Icon name="arrow_forward" size={16} />
              </Link>
              <Link href="/create" className="btn-ghost text-base px-8 py-3">
                开启 AI 创作
              </Link>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-md lg:max-w-none">
            <div className="absolute inset-0 bg-gradient-radial from-cinnabar/20 to-transparent rounded-full blur-3xl opacity-50"></div>
            <div className="museum-frame bg-white overflow-hidden rounded-lg relative z-10 transform rotate-2 hover:rotate-0 transition-transform duration-700">
              <div
                className="w-full aspect-[4/5] bg-cover bg-center"
                style={{ backgroundColor: '#2a1f0e', backgroundImage: featured[0]?.media?.[0]?.url ? `url("${featured[0].media[0].url}")` : undefined }}
              />
            </div>
            {featured[0] && (
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-rice-deep z-20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cinnabar/10 flex items-center justify-center text-cinnabar">
                  <Icon name="auto_awesome" />
                </div>
                <div>
                  <p className="text-xs text-ink-faint font-bold uppercase">最新收录</p>
                  <p className="text-sm font-bold text-ink">{featured[0].name}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Core Modules Section */}
        <section className="w-full bg-rice-warm py-24 border-y border-rice-deep/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-serif text-ink mb-4">核心功能模块</h2>
              <p className="text-ink-light max-w-2xl mx-auto">从数字档案浏览到 AI 辅助创作，提供一站式传统纹样数字化解决方案。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/gallery" className="card p-8 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-cinnabar/10 text-cinnabar flex items-center justify-center mb-6 group-hover:bg-cinnabar group-hover:text-white transition-colors">
                  <Icon name="landscape" size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-cinnabar transition-colors">纹样大观</h3>
                <p className="text-sm text-ink-light leading-relaxed mb-6 flex-1">浏览高清数字档案，支持按年代、地域、工艺多维检索。</p>
                <span className="text-cinnabar text-sm font-bold flex items-center gap-1">
                  进入画廊 <Icon name="arrow_forward" size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link href="/create" className="card p-8 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-cinnabar/10 text-cinnabar flex items-center justify-center mb-6 group-hover:bg-cinnabar group-hover:text-white transition-colors">
                  <Icon name="storm" size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-cinnabar transition-colors">AI 创意中心</h3>
                <p className="text-sm text-ink-light leading-relaxed mb-6 flex-1">将传统纹样与 3D 模型智能融合，实时预览应用效果。</p>
                <span className="text-cinnabar text-sm font-bold flex items-center gap-1">
                  开始创作 <Icon name="arrow_forward" size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link href="/workshop" className="card p-8 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-white transition-colors">
                  <Icon name="grid_view" size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-gold transition-colors">跨界工坊</h3>
                <p className="text-sm text-ink-light leading-relaxed mb-6 flex-1">参数化调节纹样密度、金属感与光泽，实现高端定制设计。</p>
                <span className="text-gold text-sm font-bold flex items-center gap-1">
                  进入工坊 <Icon name="arrow_forward" size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link href="/map" className="card p-8 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-white transition-colors">
                  <Icon name="map" size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-gold transition-colors">3D 文化地图</h3>
                <p className="text-sm text-ink-light leading-relaxed mb-6 flex-1">探索荆楚大地的非遗分布，查看各地区详细数据洞察。</p>
                <span className="text-gold text-sm font-bold flex items-center gap-1">
                  探索地图 <Icon name="arrow_forward" size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
              <div>
                <h2 className="text-3xl font-bold font-serif text-ink mb-2">平台数据概览</h2>
                <p className="text-ink-light">实时监控平台核心指标</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-rice-deep shadow-sm">
                <Icon name="schema" size={40} className="text-cinnabar/40 mb-4" />
                <p className="text-5xl font-black text-ink tabular-nums mb-2">{stats.patternCount}</p>
                <p className="text-sm font-bold text-ink-light uppercase tracking-widest">收录纹样</p>
              </div>
              <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-rice-deep shadow-sm">
                <Icon name="map" size={40} className="text-cinnabar/40 mb-4" />
                <p className="text-5xl font-black text-ink tabular-nums mb-2">{stats.regionCount}</p>
                <p className="text-sm font-bold text-ink-light uppercase tracking-widest">覆盖地区</p>
              </div>
              <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-rice-deep shadow-sm">
                <Icon name="brush" size={40} className="text-cinnabar/40 mb-4" />
                <p className="text-5xl font-black text-ink tabular-nums mb-2">{stats.techniqueCount}</p>
                <p className="text-sm font-bold text-ink-light uppercase tracking-widest">工艺类别</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Patterns */}
        <section className="w-full bg-ink py-24 text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold font-serif">精选珍品</h2>
              <Link href="/gallery" className="text-sm text-gold font-bold flex items-center gap-1 hover:underline">
                浏览全部 <Icon name="arrow_forward" size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p) => {
                const palette = (p.color_palette as string[] | null) ?? []
                return (
                  <Link key={p.id} href={`/gallery/${p.id}`} className="flex flex-col gap-4 group">
                    <div className="aspect-[4/5] bg-white/5 rounded-xl overflow-hidden border border-white/10 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div
                        className="w-full h-full group-hover:scale-110 transition-transform duration-700 bg-cover bg-center"
                        style={{ backgroundColor: palette[0] ?? '#2a1f0e', backgroundImage: p.media?.[0]?.url ? `url("${p.media[0].url}")` : undefined }}
                      />
                      <div className="absolute bottom-4 left-4 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="text-xs font-bold bg-cinnabar text-white px-2 py-1 rounded">查看详情</span>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg group-hover:text-gold transition-colors">{p.name}</h5>
                      <span className="text-sm text-white/60">{p.era}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter variant="light" />
    </div>
  )
}
