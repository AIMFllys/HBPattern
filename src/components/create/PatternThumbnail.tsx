'use client'

import { memo, useEffect, useRef } from 'react'
import type { PatternGeneratorConfig } from '@/types/create'
import { generatePatternCanvas } from '@/lib/textures/generatePattern'

const THUMBNAIL_SIZE = 128

interface Props {
  config: PatternGeneratorConfig
  bgColor: string
  className?: string
}

function PatternThumbnailInner({ config, bgColor, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)

    const patternCanvas = generatePatternCanvas(config)
    ctx.globalAlpha = 0.86
    ctx.drawImage(patternCanvas, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)
    ctx.globalAlpha = 1
  }, [config, bgColor])

  return (
    <canvas
      ref={canvasRef}
      width={THUMBNAIL_SIZE}
      height={THUMBNAIL_SIZE}
      className={`h-full w-full object-cover ${className}`}
    />
  )
}

export const PatternThumbnail = memo(PatternThumbnailInner)
