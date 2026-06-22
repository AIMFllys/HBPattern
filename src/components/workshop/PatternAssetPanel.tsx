'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { generateBlurDataURL } from '@/lib/image-placeholder'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopPatterns } from '@/hooks/queries/useWorkshopPatterns'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { PatternListItem } from '@/types/pattern'
import { PatternAssetCard } from './PatternAssetCard'

const ERA_FILTERS = ['全部', '战国', '汉代', '明清', '清代', '近现代', '当代']

interface PatternAssetPanelProps {
  initialPatterns: PatternListItem[]
  initialTotal: number
  className?: string
  compact?: boolean
}

export function PatternAssetPanel({
  initialPatterns,
  initialTotal,
  className = '',
  compact = false,
}: PatternAssetPanelProps) {
  const selectedPattern = useWorkshopStore(state => state.selectedSourcePattern)
  const searchQuery = useWorkshopStore(state => state.patternSearchQuery)
  const setSearchQuery = useWorkshopStore(state => state.setPatternSearchQuery)
  const filterEra = useWorkshopStore(state => state.patternFilterEra)
  const setFilterEra = useWorkshopStore(state => state.setPatternFilterEra)
  const addPatternLayer = useWorkshopStore(state => state.addPatternLayer)

  const query = useWorkshopPatterns(compact ? 20 : 30)
  const hasActiveFilter = searchQuery.trim().length > 0 || filterEra !== null
  const patterns = hasActiveFilter ? query.data?.data ?? [] : initialPatterns
  const total = hasActiveFilter ? query.data?.pagination.total ?? 0 : initialTotal
  const isLoading = hasActiveFilter && query.isLoading
  const isFetching = hasActiveFilter && query.isFetching

  const handleSelectPattern = useCallback(
    (pattern: PatternListItem) => {
      addPatternLayer(pattern, { activateOnly: true })
    },
    [addPatternLayer]
  )

  const handleAddAnotherLayer = useCallback(() => {
    if (selectedPattern) addPatternLayer(selectedPattern)
  }, [addPatternLayer, selectedPattern])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setFilterEra(null)
  }, [setFilterEra, setSearchQuery])

  return (
    <aside className={`flex w-80 flex-col border-l border-border-subtle bg-surface-inset xl:w-96 ${className}`}>
      <div className="border-b border-border-subtle p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-text">
            <Icon name="auto_awesome" className="text-gold" />
            纹样素材库
          </h2>
          <span className="rounded bg-gold/10 px-2 py-0.5 text-xs font-bold text-gold">
            {total} 件
          </span>
        </div>

        <div className="relative mb-3">
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
          />
          <input
            id="workshop-pattern-search"
            type="text"
            className="w-full rounded-lg border border-border bg-surface-elevated py-2 pl-9 pr-9 text-sm outline-none transition-all placeholder:text-text-faint focus:border-gold/40 focus:ring-1 focus:ring-gold/30"
            placeholder="搜索纹样名称..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          )}
        </div>

        <div className="custom-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {ERA_FILTERS.map(era => {
            const isActive = filterEra === null ? era === '全部' : filterEra === era
            return (
              <button
                key={era}
                type="button"
                onClick={() => setFilterEra(era === '全部' ? null : era)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-gold text-white shadow-sm'
                    : 'bg-surface-elevated text-text-muted hover:bg-border hover:text-text'
                }`}
              >
                {era}
              </button>
            )
          })}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {query.isError && hasActiveFilter ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-faint">
            <Icon name="sync_problem" size={32} className="mb-2 text-cinnabar/70" />
            <p className="text-sm">纹样加载失败</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-2 text-xs font-bold text-gold hover:text-text"
            >
              重试
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-faint">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <p className="text-sm">加载纹样...</p>
          </div>
        ) : patterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-faint">
            <Icon name="search_off" size={32} className="mb-2" />
            <p className="text-sm">未找到匹配的纹样</p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-2 text-xs font-bold text-gold hover:text-text"
            >
              清除筛选
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {patterns.map(pattern => (
              <PatternAssetCard
                key={pattern.id}
                pattern={pattern}
                isSelected={selectedPattern?.id === pattern.id}
                onSelect={handleSelectPattern}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-subtle bg-surface-elevated/40 p-4">
        {selectedPattern ? (
          <div className="space-y-3">
            <SelectedPatternInfo pattern={selectedPattern} />
            <button
              type="button"
              onClick={handleAddAnotherLayer}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold/30 bg-surface-inset px-3 py-2 text-xs font-bold text-gold transition-colors hover:bg-gold/10"
            >
              <Icon name="add" size={14} />
              再添加一层
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-text-faint">选择纹样素材开始创作</p>
        )}
      </div>
    </aside>
  )
}

function SelectedPatternInfo({ pattern }: { pattern: PatternListItem }) {
  const palette = pattern.color_palette ?? []

  return (
    <div className="flex items-center gap-3">
      <PatternThumb pattern={pattern} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text">{pattern.name}</p>
        <p className="truncate text-xs text-text-faint">
          {[pattern.era, pattern.region?.name, pattern.technique?.name].filter(Boolean).join(' · ') || '湖北纹样'}
        </p>
      </div>
      <div className="flex flex-shrink-0 gap-1">
        {palette.slice(0, 4).map(color => (
          <ColorDot key={color} color={color} />
        ))}
      </div>
    </div>
  )
}

function PatternThumb({ pattern }: { pattern: PatternListItem }) {
  const thumbUrl = pattern.media?.[0]?.thumbnail_url ?? pattern.media?.[0]?.url ?? null
  const palette = pattern.color_palette ?? []
  const fallbackStyle =
    palette.length >= 2
      ? { backgroundImage: `linear-gradient(135deg, ${palette.join(', ')})` }
      : { backgroundColor: palette[0] ?? '#ede7d9' }

  return (
    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface-elevated" style={fallbackStyle}>
      {thumbUrl && (
        <Image
          src={thumbUrl}
          alt={pattern.name}
          fill
          sizes="40px"
          className="object-cover"
          loading="lazy"
          placeholder="blur"
          blurDataURL={generateBlurDataURL(palette[0] ?? '#ede7d9')}
        />
      )}
    </div>
  )
}

function ColorDot({ color }: { color: string }) {
  return <span className="h-3.5 w-3.5 rounded-full border border-surface-inset shadow-sm" style={{ backgroundColor: color }} />
}
