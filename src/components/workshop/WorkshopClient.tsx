'use client'

import SiteHeader from '@/components/layout/SiteHeader'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { PatternListItem } from '@/types/pattern'
import { LayerPanel } from './LayerPanel'
import { PatternAssetPanel } from './PatternAssetPanel'
import { WorkshopCanvas } from './WorkshopCanvas'

interface WorkshopClientProps {
  initialPatterns: PatternListItem[]
  initialTotal: number
}

export default function WorkshopClient({ initialPatterns, initialTotal }: WorkshopClientProps) {
  const selectedPattern = useWorkshopStore(state => state.selectedSourcePattern)
  const layers = useWorkshopStore(state => state.layers)

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-rice">
      <SiteHeader logoIcon="grid_view" siteName="纹样+ 跨界创作工坊" primaryColor="gold" />

      <main className="relative flex flex-1 overflow-hidden">
        <section className="relative flex flex-1 flex-col overflow-hidden bg-rice-warm">
          <div className="flex items-center justify-between border-b border-rice-deep/40 bg-white/80 px-4 py-2 backdrop-blur">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gold/70">跨界工坊</span>
              <Icon name="chevron_right" size={12} className="text-ink-faint" />
              <span className="font-bold text-ink">
                {selectedPattern?.name ?? '选择纹样开始创作'}
              </span>
            </div>
            <span className="rounded bg-white/70 px-2 py-0.5 text-xs font-bold text-ink-faint">
              {layers.length} 图层
            </span>
          </div>

          <WorkshopCanvas />
          <LayerPanel />
        </section>

        <PatternAssetPanel
          initialPatterns={initialPatterns}
          initialTotal={initialTotal}
          className="hidden lg:flex"
        />
      </main>
    </div>
  )
}
