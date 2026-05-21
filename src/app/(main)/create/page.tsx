'use client'

import dynamic from 'next/dynamic'
import SiteHeader from '@/components/layout/SiteHeader'
import { ModelInfo } from '@/components/create/ModelInfo'
import { ParameterPanel } from '@/components/create/ParameterPanel'
import { PatternPanel } from '@/components/create/PatternPanel'
import { ProductSelector } from '@/components/create/ProductSelector'
import { ViewportToolbar } from '@/components/create/ViewportToolbar'

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
      <ProductSelector />
      <main className="flex flex-1 overflow-hidden">
        <section className="relative flex flex-1 flex-col">
          <div className="relative flex-1 bg-rice-warm">
            <Canvas3D />
            <ModelInfo />
            <ViewportToolbar />
          </div>
          <ParameterPanel />
        </section>
        <PatternPanel />
      </main>
    </div>
  )
}
