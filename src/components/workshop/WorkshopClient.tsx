'use client'

import { useEffect, useRef } from 'react'
import SiteHeader from '@/components/layout/SiteHeader'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { PatternListItem } from '@/types/pattern'
import { PatternAssetPanel } from './PatternAssetPanel'

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
        <section className="relative flex flex-1 flex-col items-center justify-center bg-rice-warm p-6 lg:p-8">
          <div className="absolute left-6 top-4 flex items-center gap-2 text-sm">
            <span className="font-medium text-gold/70">跨界工坊</span>
            <Icon name="chevron_right" size={12} className="text-ink-faint" />
            <span className="font-bold text-ink">
              {selectedPattern?.name ?? '选择纹样开始创作'}
            </span>
            <span className="rounded bg-white/70 px-2 py-0.5 text-xs font-bold text-ink-faint">
              {layers.length} 图层
            </span>
          </div>

          <div className="relative flex aspect-square w-full max-w-2xl items-center justify-center rounded-2xl border border-rice-deep bg-white p-4 shadow-card">
            {selectedPattern ? (
              <PatternPreview pattern={selectedPattern} />
            ) : (
              <div className="text-center">
                <Icon name="brush" size={56} className="mx-auto mb-4 text-gold/30" />
                <p className="text-base font-bold text-ink-light">选择右侧纹样开始创作</p>
                <p className="mt-1 text-sm text-ink-faint">真实素材已接入，Canvas 引擎将在下一阶段替换此预览。</p>
              </div>
            )}
          </div>
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

function PatternPreview({ pattern }: { pattern: PatternListItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const imageUrl = pattern.media?.[0]?.url ?? null

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const palette = pattern.color_palette ?? []
    element.style.backgroundImage = ''
    element.style.background = ''
    element.style.backgroundColor = ''

    if (imageUrl) {
      element.style.backgroundImage = `url("${imageUrl}")`
      element.style.backgroundSize = 'contain'
      element.style.backgroundPosition = 'center'
      element.style.backgroundRepeat = 'no-repeat'
    } else if (palette.length >= 2) {
      element.style.background = `linear-gradient(135deg, ${palette.join(', ')})`
    } else {
      element.style.backgroundColor = palette[0] ?? '#ede7d9'
    }
  }, [imageUrl, pattern.color_palette])

  return (
    <div className="flex h-full w-full items-center justify-center p-3">
      <div
        ref={ref}
        role="img"
        aria-label={pattern.name}
        className="flex h-full w-full items-center justify-center rounded-lg bg-rice-warm shadow-lg"
      >
        {!imageUrl && (
          <span className="px-4 text-center text-lg font-bold text-white drop-shadow-sm">
            {pattern.name}
          </span>
        )}
      </div>
    </div>
  )
}
