'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { serializeWorkshopLayers } from '@/lib/workshop/layerCompositor'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { HistoryEntry, SerializableLayer, SymmetryConfig } from '@/types/workshop'

const MAX_HISTORY = 30
const DRAFT_STORAGE_KEY = 'hbpattern-workshop-draft'

interface WorkshopDraft {
  canvasSize: { width: number; height: number }
  layers: SerializableLayer[]
  symmetry: SymmetryConfig
  savedAt: string
}

export function useCanvasHistory() {
  const layers = useWorkshopStore(state => state.layers)
  const canvasSize = useWorkshopStore(state => state.canvasSize)
  const symmetry = useWorkshopStore(state => state.symmetry)
  const replaceLayers = useWorkshopStore(state => state.replaceLayers)
  const setCanvasSize = useWorkshopStore(state => state.setCanvasSize)
  const setSymmetry = useWorkshopStore(state => state.setSymmetry)

  const historyRef = useRef<HistoryEntry[]>([])
  const indexRef = useRef(-1)
  const lastSnapshotRef = useRef('')
  const isRestoringRef = useRef(false)
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
    historyLength: 0,
  })

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: indexRef.current > 0,
      canRedo: indexRef.current < historyRef.current.length - 1,
      historyLength: historyRef.current.length,
    })
  }, [])

  const restoreLayers = useCallback(
    (snapshot: SerializableLayer[]) => {
      const layersToRestore = snapshot.map(layer => ({
        ...layer,
        loadStatus: layer.type === 'pattern' ? 'idle' as const : layer.loadStatus,
        errorMessage: undefined,
      }))
      replaceLayers(layersToRestore, layersToRestore[layersToRestore.length - 1]?.id ?? null)
    },
    [replaceLayers]
  )

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return
    indexRef.current -= 1
    const entry = historyRef.current[indexRef.current]
    if (!entry) return
    isRestoringRef.current = true
    restoreLayers(entry.layersSnapshot)
    lastSnapshotRef.current = JSON.stringify(entry.layersSnapshot)
    window.setTimeout(() => {
      isRestoringRef.current = false
    }, 0)
    syncHistoryState()
  }, [restoreLayers, syncHistoryState])

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return
    indexRef.current += 1
    const entry = historyRef.current[indexRef.current]
    if (!entry) return
    isRestoringRef.current = true
    restoreLayers(entry.layersSnapshot)
    lastSnapshotRef.current = JSON.stringify(entry.layersSnapshot)
    window.setTimeout(() => {
      isRestoringRef.current = false
    }, 0)
    syncHistoryState()
  }, [restoreLayers, syncHistoryState])

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return

    try {
      const draft = JSON.parse(raw) as WorkshopDraft
      if (!draft.layers || draft.layers.length === 0) return
      isRestoringRef.current = true
      setCanvasSize(draft.canvasSize)
      setSymmetry(draft.symmetry)
      restoreLayers(draft.layers)
      window.setTimeout(() => {
        isRestoringRef.current = false
      }, 0)
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [restoreLayers, setCanvasSize, setSymmetry])

  useEffect(() => {
    const serializedLayers = serializeWorkshopLayers(layers)
    const snapshotKey = JSON.stringify(serializedLayers)

    if (!isRestoringRef.current && snapshotKey !== lastSnapshotRef.current) {
      const nextHistory = historyRef.current.slice(0, indexRef.current + 1)
      nextHistory.push({
        id: `history-${Date.now()}`,
        timestamp: Date.now(),
        description: '图层调整',
        layersSnapshot: serializedLayers,
      })
      if (nextHistory.length > MAX_HISTORY) nextHistory.shift()
      historyRef.current = nextHistory
      indexRef.current = nextHistory.length - 1
      lastSnapshotRef.current = snapshotKey
      syncHistoryState()
    }

    const draft: WorkshopDraft = {
      canvasSize,
      layers: serializedLayers.map(layer => ({
        ...layer,
        loadStatus: layer.type === 'pattern' ? 'idle' : layer.loadStatus,
        errorMessage: undefined,
      })),
      symmetry,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }, [canvasSize, layers, symmetry, syncHistoryState])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [redo, undo])

  return {
    undo,
    redo,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    historyLength: historyState.historyLength,
  }
}
