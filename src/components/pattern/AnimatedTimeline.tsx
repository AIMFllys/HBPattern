'use client'

import { motion } from 'motion/react'

interface TimelineItem {
  id: string
  label: string
  era?: string
  description?: string
}

interface AnimatedTimelineProps {
  items?: TimelineItem[]
}

const placeholderItems: TimelineItem[] = [
  { id: '1', label: '起源', era: '先秦', description: '楚地纹饰初现，以凤鸟、云纹为代表' },
  { id: '2', label: '发展', era: '秦汉', description: '丝织技术进步，纹样更加精细繁复' },
  { id: '3', label: '鼎盛', era: '唐宋', description: '刺绣工艺达到高峰，纹样风格多元融合' },
  { id: '4', label: '传承', era: '明清', description: '形成地方特色流派，技法体系趋于完善' },
  { id: '5', label: '复兴', era: '近现代', description: '数字化保护与创新设计相结合' },
]

export function AnimatedTimeline({ items }: AnimatedTimelineProps) {
  const data = items && items.length > 0 ? items : placeholderItems

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-gold uppercase tracking-widest">历史演化</h3>
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gold/30" />

        <div className="flex flex-col gap-8">
          {data.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative"
            >
              {/* Dot */}
              <div className="absolute -left-8 top-1.5 w-3 h-3 rounded-full bg-gold border-2 border-surface shadow-sm" />

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-text">{item.label}</span>
                  {item.era && (
                    <span className="text-xs text-gold font-serif italic px-2 py-0.5 bg-gold/10 rounded-full">
                      {item.era}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-text-muted leading-relaxed">{item.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AnimatedTimeline
