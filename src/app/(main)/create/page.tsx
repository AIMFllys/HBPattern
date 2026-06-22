'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import SiteHeader from '@/components/layout/SiteHeader'
import { MobileToolbar, type MobileCreateTab } from '@/components/create/MobileToolbar'
import { DownloadMenu } from '@/components/create/DownloadMenu'
import { ModelInfo } from '@/components/create/ModelInfo'
import { ParameterPanel } from '@/components/create/ParameterPanel'
import { PatternPanel } from '@/components/create/PatternPanel'
import { ProductSelector } from '@/components/create/ProductSelector'
import { ViewportToolbar } from '@/components/create/ViewportToolbar'

const Canvas3D = dynamic(() => import('@/components/create/Canvas3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[400px] flex-1 items-center justify-center bg-surface-elevated">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="text-sm font-medium text-text-muted">加载 3D 引擎...</span>
      </div>
    </div>
  ),
})

export default function CreatePage() {
  const [activeMobileTab, setActiveMobileTab] = useState<MobileCreateTab>('viewport')

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface pb-16 lg:pb-0 transition-colors">
      <SiteHeader logoIcon="storm" siteName="AI 创意中心" primaryColor="cinnabar" />
      <ProductSelector />
      <main className="flex flex-1 overflow-hidden">
        <section className="relative flex flex-1 flex-col">
          <div className="relative flex-1 bg-surface-elevated">
            <Canvas3D />
            <ModelInfo />
            <DownloadMenu />
            <ViewportToolbar />
          </div>
          <div className="hidden lg:block">
            <ParameterPanel />
          </div>
        </section>
        <div className="hidden lg:flex">
          <PatternPanel />
        </div>
      </main>

      {activeMobileTab === 'pattern' && (
        <div className="fixed inset-x-0 bottom-16 z-30 max-h-[72vh] overflow-hidden border-t border-border bg-surface shadow-modal lg:hidden">
          <PatternPanel className="h-[72vh] w-full border-l-0" />
        </div>
      )}

      {activeMobileTab === 'params' && (
        <div className="fixed inset-x-0 bottom-16 z-30 max-h-[72vh] overflow-y-auto border-t border-border bg-surface-inset shadow-modal lg:hidden">
          <ParameterPanel />
        </div>
      )}

      <MobileToolbar activeTab={activeMobileTab} onTabChange={setActiveMobileTab} />
    </div>
  )
}
