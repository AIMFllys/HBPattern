'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Icon } from '@/components/icons/Icon'

interface FeaturedPattern {
  id: string
  name: string
  era: string | null
  color_palette: unknown
  media?: { url: string }[]
}

interface FeaturedPatternsProps {
  patterns: FeaturedPattern[]
}

export function FeaturedPatterns({ patterns }: FeaturedPatternsProps) {
  const { ref, isInView } = useScrollReveal()

  return (
    <section className="w-full bg-surface-elevated py-24 text-text border-y border-border-subtle transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold font-serif text-text">精选珍品</h2>
          <Link href="/gallery" className="text-sm text-gold font-bold flex items-center gap-1 hover:underline">
            浏览全部 <Icon name="arrow_forward" size={16} />
          </Link>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {patterns.map((p, i) => {
            const palette = (p.color_palette as string[] | null) ?? []
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.4,
                  delay: i * 0.05,
                }}
              >
                <Link href={`/gallery/${p.id}`} className="flex flex-col gap-4 group">
                  <div className="aspect-[4/5] bg-surface-inset rounded-xl overflow-hidden border border-border relative">
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
                    <span className="text-sm text-text-muted">{p.era}</span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
