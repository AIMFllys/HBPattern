'use client'

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { CanvasEngine } from '@/lib/workshop/canvasEngine'
import { useWorkshopStore } from '@/stores/useWorkshopStore'

export function WorkshopCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<CanvasEngine | null>(null)
  const renderFrameRef = useRef<number | null>(null)
  const lastPanRef = useRef({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  const layers = useWorkshopStore(state => state.layers)
  const canvasSize = useWorkshopStore(state => state.canvasSize)
  const zoom = useWorkshopStore(state => state.zoom)
  const setZoom = useWorkshopStore(state => state.setZoom)
  const panOffset = useWorkshopStore(state => state.panOffset)
  const setPanOffset = useWorkshopStore(state => state.setPanOffset)
  const symmetry = useWorkshopStore(state => state.symmetry)
  const updateLayer = useWorkshopStore(state => state.updateLayer)
  const activeTool = useWorkshopStore(state => state.activeTool)
  const initialCanvasSizeRef = useRef<{ width: number; height: number } | null>(null)

  if (initialCanvasSizeRef.current === null) initialCanvasSizeRef.current = canvasSize

  const loadingCount = useMemo(
    () => layers.filter(layer => layer.type === 'pattern' && layer.loadStatus === 'loading').length,
    [layers]
  )
  const errorCount = useMemo(
    () => layers.filter(layer => layer.type === 'pattern' && layer.loadStatus === 'error').length,
    [layers]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const initialCanvasSize = initialCanvasSizeRef.current
    if (!canvas || !initialCanvasSize) return

    const engine = new CanvasEngine(canvas, initialCanvasSize.width, initialCanvasSize.height)
    engineRef.current = engine

    return () => {
      if (renderFrameRef.current !== null) cancelAnimationFrame(renderFrameRef.current)
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    for (const layer of layers) {
      if (layer.type !== 'pattern' || !layer.sourceImageUrl || layer.loadStatus !== 'idle') continue
      updateLayer(layer.id, { loadStatus: 'loading', errorMessage: undefined })
      void engine
        .loadImage(layer.id, layer.sourceImageUrl)
        .then(() => updateLayer(layer.id, { loadStatus: 'loaded', errorMessage: undefined }))
        .catch(() => updateLayer(layer.id, { loadStatus: 'error', errorMessage: '图片加载失败' }))
    }
  }, [layers, updateLayer])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    if (renderFrameRef.current !== null) cancelAnimationFrame(renderFrameRef.current)
    renderFrameRef.current = requestAnimationFrame(() => {
      engine.resize(canvasSize.width, canvasSize.height)
      engine.render(layers, symmetry, { showGuides: symmetry.showGuides })
      renderFrameRef.current = null
    })

    return () => {
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current)
        renderFrameRef.current = null
      }
    }
  }, [canvasSize, layers, symmetry])

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? -0.08 : 0.08
      setZoom(zoom + delta)
    },
    [setZoom, zoom]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activeTool !== 'pan' && event.button !== 1) return
      event.currentTarget.setPointerCapture(event.pointerId)
      lastPanRef.current = { x: event.clientX, y: event.clientY }
      setIsPanning(true)
    },
    [activeTool]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isPanning) return
      const dx = event.clientX - lastPanRef.current.x
      const dy = event.clientY - lastPanRef.current.y
      lastPanRef.current = { x: event.clientX, y: event.clientY }
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
    },
    [isPanning, panOffset, setPanOffset]
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsPanning(false)
  }, [])

  return (
    <div
      className={`relative flex flex-1 items-center justify-center overflow-hidden bg-surface-elevated ${
        isPanning ? 'cursor-grabbing' : activeTool === 'pan' ? 'cursor-grab' : 'cursor-default'
      }`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute inset-0 bg-[length:24px_24px] bg-[image:linear-gradient(45deg,_rgba(214,204,186,0.35)_25%,_transparent_25%,_transparent_75%,_rgba(214,204,186,0.35)_75%),linear-gradient(45deg,_rgba(214,204,186,0.35)_25%,_transparent_25%,_transparent_75%,_rgba(214,204,186,0.35)_75%)] bg-[position:0_0,_12px_12px]" />

      <CanvasShell ref={canvasRef} zoom={zoom} panX={panOffset.x} panY={panOffset.y} />

      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-surface-overlay px-3 py-1.5 text-xs font-bold text-text-muted shadow-card backdrop-blur">
        <Icon name="zoom_in" size={14} className="text-gold" />
        {Math.round(zoom * 100)}%
      </div>

      <div className="absolute bottom-4 right-4 rounded-lg bg-surface-overlay px-3 py-1.5 text-xs font-bold text-text-muted shadow-card backdrop-blur">
        {canvasSize.width} × {canvasSize.height}
      </div>

      {(loadingCount > 0 || errorCount > 0) && (
        <div className="absolute top-4 right-4 rounded-lg bg-surface-overlay px-3 py-2 text-xs font-bold text-text-muted shadow-card backdrop-blur">
          {loadingCount > 0 && <span>{loadingCount} 个图层加载中</span>}
          {errorCount > 0 && <span className="text-cinnabar">{errorCount} 个图层加载失败</span>}
        </div>
      )}
    </div>
  )
}

interface CanvasShellProps {
  zoom: number
  panX: number
  panY: number
}

const CanvasShell = forwardRef<HTMLCanvasElement, CanvasShellProps>(function CanvasShell(
  { zoom, panX, panY },
  ref
) {
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = shellRef.current
    if (!element) return
    element.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`
  }, [panX, panY, zoom])

  return (
    <div ref={shellRef} className="relative origin-center transition-transform duration-75">
      <canvas ref={ref} className="workshop-canvas block rounded-sm bg-surface-inset shadow-hover" />
    </div>
  )
})
