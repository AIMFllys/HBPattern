'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'

export function HeroContent() {
  return (
    <div className="flex-1 flex flex-col gap-8 z-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex gap-3"
      >
        <div className="seal-tag writing-vertical text-xs font-bold px-1 border-cinnabar/40 text-cinnabar">数字新生</div>
        <div className="seal-tag writing-vertical text-xs font-bold px-1 border-cinnabar/40 text-cinnabar">荆楚遗韵</div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-5xl lg:text-7xl font-black text-ink font-serif leading-tight"
      >
        探索千年<br />
        <span className="text-cinnabar">传统纹样</span>之美
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-lg text-ink-light max-w-xl leading-relaxed"
      >
        致力于通过数字技术保存和复兴荆楚大地数千年的文化遗产，为设计师、学者提供精准的传统美学资源与 AI 创作工具。
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-wrap gap-4 mt-4"
      >
        <Link href="/gallery" className="btn-primary text-base px-8 py-3">
          探索纹样库
          <Icon name="arrow_forward" size={16} />
        </Link>
        <Link href="/create" className="btn-ghost text-base px-8 py-3">
          开启 AI 创作
        </Link>
      </motion.div>
    </div>
  )
}

export default HeroContent
