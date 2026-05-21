'use client'

import dynamic from 'next/dynamic'
import SiteHeader from '@/components/layout/SiteHeader'

const Canvas3D = dynamic(() => import('@/components/create/Canvas3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[400px] flex-1 items-center justify-center bg-rice-warm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="text-sm font-medium text-ink-light">加载 3D 引擎...</span>
      </div>
    </div>
  ),
})

export default function CreatePage() {
  return (
    <div className="flex min-h-screen flex-col bg-rice">
      <SiteHeader logoIcon="storm" siteName="AI 创意中心" primaryColor="cinnabar" />
      <main className="flex flex-1 overflow-hidden bg-rice-warm">
        <section className="relative flex flex-1 flex-col">
          <div className="absolute left-6 top-6 z-10 rounded-lg border border-white/50 bg-white/70 px-4 py-2.5 shadow-card backdrop-blur-sm">
            <span className="block text-xs font-bold uppercase tracking-widest text-ink-faint">
              当前模型
            </span>
            <p className="text-sm font-bold text-ink">画框 / 3D 预览基础视口</p>
          </div>
          <Canvas3D />
        </section>
      </main>
    </div>
  )
}
