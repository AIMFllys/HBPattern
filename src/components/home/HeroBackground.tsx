'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { isPlaceholderMediaUrl } from '@/lib/patternMedia'

interface HeroBackgroundProps {
  imageUrl?: string
  imageAlt?: string
}

export function HeroBackground({ imageUrl, imageAlt = '湖北传统纹案' }: HeroBackgroundProps) {
  const showImage = imageUrl && !isPlaceholderMediaUrl(imageUrl)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {showImage ? (
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
          className="absolute inset-0"
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            priority
            className="object-cover"
            quality={75}
            sizes="100vw"
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink/5 via-rice to-cinnabar/5" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-rice via-rice/30 to-transparent" />
    </div>
  )
}

export default HeroBackground
