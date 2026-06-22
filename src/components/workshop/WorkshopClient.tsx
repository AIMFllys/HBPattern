'use client'

import { useEffect } from 'react'
import SiteHeader from '@/components/layout/SiteHeader'
import { useCanvasHistory } from '@/hooks/useCanvasHistory'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { PatternListItem } from '@/types/pattern'
import { AdjustPanel } from './AdjustPanel'
import { ExportDialog } from './ExportDialog'
import { LayerPanel } from './LayerPanel'
import { PatternAssetPanel } from './PatternAssetPanel'
import { ToolBar } from './ToolBar'
import { WorkshopMobileBar } from './WorkshopMobileBar'
import { WorkshopCanvas } from './WorkshopCanvas'
import { WorkshopTopBar } from './WorkshopTopBar'

interface WorkshopClientProps {
  initialPatterns: PatternListItem[]
  initialTotal: number
}

export default function WorkshopClient({ initialPatterns, initialTotal }: WorkshopClientProps) {
  const selectedPattern = useWorkshopStore(state => state.selectedSourcePattern)
  const layers = useWorkshopStore(state => state.layers)
  const canvasSize = useWorkshopStore(state => state.canvasSize)
  const setCanvasSize = useWorkshopStore(state => state.setCanvasSize)
  const resetViewport = useWorkshopStore(state => state.resetViewport)
  const setActiveTool = useWorkshopStore(state => state.setActiveTool)
  const setIsExporting = useWorkshopStore(state => state.setIsExporting)
  const addColorLayer = useWorkshopStore(state => state.addColorLayer)
  const activeLayerId = useWorkshopStore(state => state.activeLayerId)
  const removeLayer = useWorkshopStore(state => state.removeLayer)
  const zoom = useWorkshopStore(state => state.zoom)
  const setZoom = useWorkshopStore(state => state.setZoom)
  const history = useCanvasHistory()

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return

      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && key === 'e') {
        event.preventDefault()
        setIsExporting(true)
        return
      }
      if ((event.ctrlKey || event.metaKey) && (key === '+' || key === '=')) {
        event.preventDefault()
        setZoom(zoom + 0.1)
        return
      }
      if ((event.ctrlKey || event.metaKey) && key === '-') {
        event.preventDefault()
        setZoom(zoom - 0.1)
        return
      }
      if ((event.ctrlKey || event.metaKey) && key === '0') {
        event.preventDefault()
        resetViewport()
        return
      }
      if (event.key === 'Delete' && activeLayerId) {
        event.preventDefault()
        removeLayer(activeLayerId)
        return
      }

      const toolMap: Record<string, Parameters<typeof setActiveTool>[0]> = {
        v: 'select',
        h: 'pan',
        t: 'transform',
        c: 'color',
        s: 'symmetry',
      }
      const nextTool = toolMap[key]
      if (nextTool) setActiveTool(nextTool)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeLayerId, removeLayer, resetViewport, setActiveTool, setIsExporting, setZoom, zoom])

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-surface pb-14 lg:pb-0 transition-colors">
      <SiteHeader logoIcon="grid_view" siteName="纹样+ 跨界创作工坊" primaryColor="gold" />

      <main className="relative flex flex-1 overflow-hidden">
        <ToolBar />
        <section className="relative flex flex-1 flex-col overflow-hidden bg-surface-elevated">
          <WorkshopTopBar
            selectedPattern={selectedPattern}
            canvasSize={canvasSize}
            setCanvasSize={setCanvasSize}
            layerCount={layers.length}
            resetViewport={resetViewport}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            undo={history.undo}
            redo={history.redo}
            addColorLayer={addColorLayer}
            openExport={() => setIsExporting(true)}
          />

          <WorkshopCanvas />
          <AdjustPanel />
          <LayerPanel />
        </section>

        <PatternAssetPanel
          initialPatterns={initialPatterns}
          initialTotal={initialTotal}
          className="hidden lg:flex"
        />
      </main>
      <WorkshopMobileBar initialPatterns={initialPatterns} initialTotal={initialTotal} />
      <ExportDialog />
    </div>
  )
}
