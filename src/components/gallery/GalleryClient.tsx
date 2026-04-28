'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import type { PatternListItem } from '@/lib/queries'

interface GalleryClientProps {
  patterns: PatternListItem[]
  total: number
  page: number
  totalPages: number
  currentEra?: string
  currentSort?: string
}

const eraOptions = ['战国', '汉代', '明清', '清代', '近现代', '当代']
const sortOptions = [
  { value: 'newest', label: '最新上传' },
  { value: 'popular', label: '最多浏览' },
  { value: 'likes', label: '最多点赞' },
]

export default function GalleryClient({ patterns, total, page, totalPages, currentEra, currentSort = 'newest' }: GalleryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/gallery?${params.toString()}`)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (p > 1) params.set('page', String(p))
    else params.delete('page')
    router.push(`/gallery?${params.toString()}`)
  }

  return (
    <main className="flex flex-1 w-full max-w-7xl mx-auto px-6 lg:px-10 py-10 gap-10">
      {/* Sidebar Filters */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold border-l-4 border-cinnabar pl-3 mb-4">筛选检索</h2>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">年代分类</h3>
            <div className="flex flex-col gap-1">
              {eraOptions.map((era) => (
                <button
                  key={era}
                  onClick={() => updateFilter('era', currentEra === era ? null : era)}
                  className={`text-left px-2 py-1.5 rounded text-sm ${currentEra === era ? 'bg-cinnabar/10 text-cinnabar font-bold' : 'text-ink-medium hover:bg-rice-warm hover:text-cinnabar'}`}
                >
                  {era}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1">
        <div className="flex items-baseline justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold font-serif">纹样画廊</h2>
            <span className="text-sm text-ink-faint">共 {total} 件作品</span>
          </div>
          <div className="flex items-center gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter('sort', opt.value === 'newest' ? null : opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm ${currentSort === opt.value ? 'bg-cinnabar/10 text-cinnabar font-bold' : 'bg-rice-warm text-ink-medium hover:text-cinnabar'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {patterns.length === 0 ? (
          <div className="text-center py-20 text-ink-faint">
            <Icon name="search_off" size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无符合条件的纹样</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {patterns.map((pattern, index) => {
              const palette = pattern.color_palette ?? []
              const imageUrl = pattern.media?.[0]?.url
              return (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="masonry-item"
                >
                  <Link href={`/gallery/${pattern.id}`} className="group cursor-pointer block">
                    <div className="relative overflow-hidden rounded-xl bg-rice-warm aspect-[4/5]">
                      <div
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105 bg-cover bg-center"
                        style={{ backgroundColor: palette[0] ?? '#3d3d30', backgroundImage: imageUrl ? `url("${imageUrl}")` : undefined }}
                      />
                      {pattern.is_ai_generated && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-cinnabar uppercase tracking-tight">
                          AI 生成
                        </div>
                      )}
                    </div>
                    <div className="mt-4 px-1">
                      <h3 className="text-base font-bold text-ink group-hover:text-cinnabar transition-colors">{pattern.name}</h3>
                      <p className="text-sm text-ink-light font-serif italic">
                        {pattern.region?.name ?? ''} · {pattern.technique?.name ?? ''}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-16 py-10 border-t border-cinnabar/10">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-faint hover:text-cinnabar transition-colors disabled:opacity-30"
            >
              <Icon name="chevron_left" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-10 h-10 rounded-full text-sm font-medium ${p === page ? 'bg-cinnabar text-white font-bold' : 'hover:bg-rice-warm text-ink-medium'}`}
              >
                {p}
              </button>
            ))}
            {totalPages > 5 && <span className="px-2 text-ink-faint">...</span>}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium hover:text-cinnabar transition-colors disabled:opacity-30"
            >
              <Icon name="chevron_right" />
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
