'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCreateStore } from '@/stores/useCreateStore'

export function OffsetPad() {
  const padRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const offsetX = useCreateStore(state => state.textureParams.offsetX)
  const offsetY = useCreateStore(state => state.textureParams.offsetY)
  const setTextureParam = useCreateStore(state => state.setTextureParam)

  const updateOffset = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current
      if (!pad) return

      const rect = pad.getBoundingClientRect()
      const nextX = ((clientX - rect.left) / rect.width) * 100 - 50
      const nextY = -(((clientY - rect.top) / rect.height) * 100 - 50)

      setTextureParam('offsetX', Math.round(Math.max(-50, Math.min(50, nextX))))
      setTextureParam('offsetY', Math.round(Math.max(-50, Math.min(50, nextY))))
    },
    [setTextureParam]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setIsDragging(true)
      updateOffset(event.clientX, event.clientY)
    },
    [updateOffset]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      updateOffset(event.clientX, event.clientY)
    },
    [isDragging, updateOffset]
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    setIsDragging(false)
  }, [])

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-tighter text-ink-faint">
        偏移 OFFSET
      </span>
      <div
        ref={padRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-16 w-16 touch-none select-none rounded border border-rice-deep bg-rice-warm cursor-crosshair"
        aria-label="纹样偏移控制"
      >
        <div className="absolute left-1/2 top-0 h-full w-px bg-rice-deep" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-rice-deep" />
        <OffsetDot offsetX={offsetX} offsetY={offsetY} isDragging={isDragging} />
      </div>
      <span className="text-xs text-ink-faint">
        {offsetX}, {offsetY}
      </span>
    </div>
  )
}

function OffsetDot({
  offsetX,
  offsetY,
  isDragging,
}: {
  offsetX: number
  offsetY: number
  isDragging: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    ref.current.style.left = `${offsetX + 50}%`
    ref.current.style.top = `${50 - offsetY}%`
  }, [offsetX, offsetY])

  return (
    <div
      ref={ref}
      className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-shadow ${
        isDragging
          ? 'bg-cinnabar shadow-md shadow-cinnabar/30'
          : 'bg-cinnabar/80 hover:bg-cinnabar'
      }`}
    />
  )
}
