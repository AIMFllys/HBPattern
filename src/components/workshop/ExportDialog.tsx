'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { downloadBlob, estimateFileSize, exportWorkshopBlob, generateExportFilename } from '@/lib/workshop/exportUtils'
import { useAuthModal } from '@/stores/useAuthModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { ExportConfig, ExportFormat } from '@/types/workshop'

const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string }[] = [
  { value: 'png', label: 'PNG', desc: '无损透明' },
  { value: 'jpeg', label: 'JPEG', desc: '体积较小' },
  { value: 'webp', label: 'WebP', desc: '高压缩' },
  { value: 'svg', label: 'SVG', desc: '容器导出' },
]

const SCALE_OPTIONS = [1, 2, 4]

export function ExportDialog() {
  const isExporting = useWorkshopStore(state => state.isExporting)
  const setIsExporting = useWorkshopStore(state => state.setIsExporting)
  const layers = useWorkshopStore(state => state.layers)
  const symmetry = useWorkshopStore(state => state.symmetry)
  const canvasSize = useWorkshopStore(state => state.canvasSize)
  const selectedPattern = useWorkshopStore(state => state.selectedSourcePattern)
  const user = useAuthStore(state => state.user)
  const openModal = useAuthModal(state => state.openModal)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [config, setConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 0.92,
    scale: 2,
    includeBackground: true,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const outputWidth = canvasSize.width * config.scale
  const outputHeight = canvasSize.height * config.scale
  const estimate = estimateFileSize(outputWidth, outputHeight, config.format, config.quality)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isExporting && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!isExporting && dialog.open) {
      dialog.close()
    }
  }, [isExporting])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    function handleClose() {
      setIsExporting(false)
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [setIsExporting])

  const handleExport = useCallback(async () => {
    if (!user) {
      setIsExporting(false)
      openModal('登录后即可导出高清设计稿')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const blob = await exportWorkshopBlob({ layers, symmetry, canvasSize, config })
      downloadBlob(blob, generateExportFilename(selectedPattern?.name ?? null, config))
      setIsExporting(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '导出失败')
    } finally {
      setIsProcessing(false)
    }
  }, [canvasSize, config, layers, openModal, selectedPattern, setIsExporting, symmetry, user])

  return (
    <dialog
      ref={dialogRef}
      className="workshop-export-dialog w-[min(28rem,calc(100vw-2rem))] max-w-md rounded-2xl border-0 bg-white p-0 text-left shadow-modal backdrop:bg-ink/55 backdrop:backdrop-blur-sm"
      aria-labelledby="workshop-export-title"
      onClick={(event) => {
        if (event.target === dialogRef.current) setIsExporting(false)
      }}
    >
      <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="workshop-export-title" className="flex items-center gap-2 text-lg font-bold text-ink">
                <Icon name="download" className="text-gold" />
                导出设计稿
              </h2>
              <button
                type="button"
                onClick={() => setIsExporting(false)}
                className="text-ink-faint transition-colors hover:text-ink-medium"
                aria-label="关闭导出对话框"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-faint">格式</p>
                <div className="grid grid-cols-4 gap-2">
                  {FORMAT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setConfig(current => ({ ...current, format: option.value }))}
                      className={`rounded-lg px-2 py-2 text-center transition-colors ${
                        config.format === option.value
                          ? 'bg-gold text-white shadow-sm'
                          : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
                      }`}
                    >
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className="block text-[10px] opacity-80">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-faint">分辨率</p>
                <div className="grid grid-cols-3 gap-2">
                  {SCALE_OPTIONS.map(scale => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setConfig(current => ({ ...current, scale }))}
                      className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                        config.scale === scale
                          ? 'bg-gold text-white shadow-sm'
                          : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
                      }`}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-faint">
                  输出 {outputWidth} × {outputHeight}px，{estimate}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-ink-light">
                <input
                  type="checkbox"
                  checked={config.includeBackground}
                  onChange={event => setConfig(current => ({ ...current, includeBackground: event.target.checked }))}
                  className="accent-gold"
                />
                包含宣纸底色
              </label>

              <div>
                <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-faint">
                  质量
                  <span>{Math.round(config.quality * 100)}%</span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={Math.round(config.quality * 100)}
                  onChange={event => setConfig(current => ({ ...current, quality: Number(event.target.value) / 100 }))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-rice-deep accent-gold"
                />
              </div>

              {config.format === 'svg' && (
                <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs text-ink-light">
                  SVG 为嵌入位图的容器格式，用于排版和转存，不是可编辑矢量图层。
                </p>
              )}

              {errorMessage && (
                <p className="rounded-lg bg-cinnabar/10 px-3 py-2 text-xs font-bold text-cinnabar">
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handleExport}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 font-bold text-white shadow-lg shadow-gold/20 transition-all hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Icon name="download" size={18} />
                    导出 {config.format.toUpperCase()}
                  </>
                )}
              </button>
            </div>
      </div>
    </dialog>
  )
}
