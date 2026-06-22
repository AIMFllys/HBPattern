import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Icon } from '@/components/icons/Icon'
import { FeaturedPatterns } from '@/components/home/FeaturedPatterns'
import { HeroContent } from '@/components/home/HeroContent'
import { getFeaturedPatterns, getStats } from '@/lib/queries'
import { resolveFeaturedFrameImageUrl } from '@/lib/patternMedia'

export const metadata: Metadata = {
  title: '湖北纹案文化展示平台 — 千年纹饰之美',
  description: '探索湖北传统纹绣文化的数字化平台。浏览纹样画廊、3D文化地图、AI创作中心。',
  keywords: ['湖北纹案', '传统纹绣', '荆楚文化', '非遗', '文化遗产', '数字化展示'],
  openGraph: {
    title: '湖北纹案文化展示平台',
    description: '探索湖北传统纹绣文化的数字化平台。浏览纹样画廊、3D文化地图、AI创作中心。',
    images: ['/images/og-home.jpg'],
  },
}

export default async function HomePage() {
  const [stats, featured] = await Promise.all([getStats(), getFeaturedPatterns(4)])
  const featuredFrameImage = resolveFeaturedFrameImageUrl(featured[0]?.media?.[0]?.url)

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-surface transition-colors">
      <SiteHeader logoIcon="filter_vintage" siteName="湖北传统纹样库" primaryColor="cinnabar" />

      <main id="main-content" className="flex flex-col w-full">
        {/* Hero Section — clean rice background; frame image only in museum card (see 01dbf8c) */}
        <section className="relative w-full max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16">
          <HeroContent />

          <div className="flex-1 relative w-full max-w-md lg:max-w-none">
            <div className="absolute inset-0 bg-gradient-radial from-cinnabar/20 to-transparent rounded-full blur-3xl opacity-50"></div>
            <div className="museum-frame bg-surface-inset overflow-hidden rounded-lg relative z-10 transform rotate-2 hover:rotate-0 transition-transform duration-700">
              <div
                className="w-full aspect-[4/5] bg-cover bg-center"
                style={{ backgroundColor: '#2a1f0e', backgroundImage: `url("${featuredFrameImage}")` }}
              />
            </div>
            {featured[0] && (
              <div className="absolute -bottom-6 -left-6 bg-surface-inset p-4 rounded-xl shadow-xl border border-border z-20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cinnabar/10 flex items-center justify-center text-cinnabar">
                  <Icon name="auto_awesome" />
                </div>
                <div>
                  <p className="text-xs text-text-faint font-bold uppercase">最新收录</p>
                  <p className="text-sm font-bold text-text">{featured[0].name}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Core Modules Section */}
        <section className="w-full bg-surface-elevated py-24 border-y border-border-subtle">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-serif text-text mb-4">核心功能模块</h2>
              <p className="text-text-muted max-w-2xl mx-auto">从数字档案浏览到 AI 辅助创作，提供一站式传统纹样数字化解决方案。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/gallery" className="card p-8 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-cinnabar/10 text-cinnabar flex items-center justify-center mb-6 group-hover:bg-cinnabar group-hover:text-white transition-colors">
                  <Icon name="landscape" size={32} />
                </div>
                <h3 className="text-xl font-bold text-text mb-3 group-hover:text-cinnabar transition-colors">纹样大观</h3>
                <p className="text-sm text-text-muted leading-relaxed mb-6 flex-1">浏览高清数字档案，支持按年代、地域、工艺多维检索。</p>
                <span className="text-cinnabar text-sm font-bold flex items-center gap-1">
                  进入画廊 <Icon name="arrow_forward" size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link href="/create" className="card p-8 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-cinnabar/10 text-cinnabar flex items-center justify-center mb-6 group-hover:bg-cinnabar group-hover:text-white transition-colors">
                  <Icon name="storm" size={32} />
                </div>
                <h3 className="text-xl font-bold text-text mb-3 group-hover:text-cinnabar transition-colors">AI 创意中心</h3>
                <p className="text-sm text-text-muted leading-relaxed mb-6 flex-1">将传统纹样与 3D 模型智能融合，实时预览应用效果。</p>
                <span className="text-cinnabar text-sm font-bold flex items-center gap-1">
                  开始创作 <Icon name="arrow_forward" size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link href="/workshop" className="card p-8 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-white transition-colors">
                  <Icon name="grid_view" size={32} />
                </div>
                <h3 className="text-xl font-bold text-text mb-3 group-hover:text-gold transition-colors">跨界工坊</h3>
                <p className="text-sm text-text-muted leading-relaxed mb-6 flex-1">参数化调节纹样密度、金属感与光泽，实现高端定制设计。</p>
                <span className="text-gold text-sm font-bold flex items-center gap-1">
                  进入工坊 <Icon name="arrow_forward" size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link href="/map" className="card p-8 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-white transition-colors">
                  <Icon name="map" size={32} />
                </div>
                <h3 className="text-xl font-bold text-text mb-3 group-hover:text-gold transition-colors">3D 文化地图</h3>
                <p className="text-sm text-text-muted leading-relaxed mb-6 flex-1">探索荆楚大地的非遗分布，查看各地区详细数据洞察。</p>
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
                <h2 className="text-3xl font-bold font-serif text-text mb-2">平台数据概览</h2>
                <p className="text-text-muted">实时监控平台核心指标</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center justify-center p-10 bg-surface-inset rounded-2xl border border-border shadow-sm">
                <Icon name="schema" size={40} className="text-cinnabar/40 mb-4" />
                <p className="text-5xl font-black text-text tabular-nums mb-2">{stats.patternCount}</p>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">收录纹样</p>
              </div>
              <div className="flex flex-col items-center justify-center p-10 bg-surface-inset rounded-2xl border border-border shadow-sm">
                <Icon name="map" size={40} className="text-cinnabar/40 mb-4" />
                <p className="text-5xl font-black text-text tabular-nums mb-2">{stats.regionCount}</p>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">覆盖地区</p>
              </div>
              <div className="flex flex-col items-center justify-center p-10 bg-surface-inset rounded-2xl border border-border shadow-sm">
                <Icon name="brush" size={40} className="text-cinnabar/40 mb-4" />
                <p className="text-5xl font-black text-text tabular-nums mb-2">{stats.techniqueCount}</p>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">工艺类别</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Patterns */}
        <FeaturedPatterns patterns={featured} />
      </main>

      <SiteFooter />
    </div>
  )
}
