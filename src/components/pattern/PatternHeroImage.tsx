'use client'

import { motion } from 'motion/react'

interface PatternHeroImageProps {
  imageUrl?: string
  patternName: string
  isAiGenerated?: boolean
  palette: string[]
}

export function PatternHeroImage({ imageUrl, patternName, isAiGenerated, palette }: PatternHeroImageProps) {
  return (
    <section className="relative h-[70vh] min-h-[480px] max-h-[800px] overflow-hidden bg-ink/5">
      {/* Full-bleed image */}
      <motion.div
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        {imageUrl ? (
          <div
            className="w-full h-full bg-cover bg-center"
            role="img"
            aria-label={patternName}
            style={{ backgroundImage: `url("${imageUrl}")` }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: palette[0] ?? '#2a1f0e' }}
          />
        )}
      </motion.div>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

      {/* Title overlay */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute bottom-0 left-0 right-0 p-8 lg:p-16"
      >
        <h1 className="text-4xl lg:text-6xl font-black text-rice font-serif leading-tight drop-shadow-lg">
          {patternName}
        </h1>
      </motion.div>

      {/* AI badge */}
      {isAiGenerated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute top-6 right-6 bg-cinnabar text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg"
        >
          AI 生成
        </motion.div>
      )}
    </section>
  )
}

export default PatternHeroImage
