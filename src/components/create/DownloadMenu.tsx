'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { useCreateStore } from '@/stores/useCreateStore'
import { PRODUCT_CONFIGS } from '@/lib/textures/productConfigs'
import {
  exportCreationJson,
  exportModelGlb,
  exportPatternPng,
  exportPreviewPng,
} from '@/lib/create/exportAssets'
import * as THREE from 'three'

type ExportKind = 'preview' | 'pattern-512' | 'pattern-1024' | 'pattern-2048' | 'glb' | 'json'
type Status = 'idle' | 'processing' | 'error'

interface MenuItem {
  kind: ExportKind
  label: string
  desc: string
  icon: string
}

const MENU_ITEMS: MenuItem[] = [
  { kind: 'preview', label: '预览图 PNG', desc: '当前 3D 视口截图', icon: 'image' },
  { kind: 'pattern-512', label: '纹样贴图 512px', desc: '印花/印刷素材', icon: 'texture' },
  { kind: 'pattern-1024', label: '纹样贴图 1024px', desc: '高清印刷素材', icon: 'texture' },
  { kind: 'pattern-2048', label: '纹样贴图 2048px', desc: '超高清印刷素材', icon: 'texture' },
  { kind: 'glb', label: '3D 模型 GLB', desc: '可在 Blender/Three.js 打开', icon: 'view_in_ar' },
  { kind: 'json', label: '工程配置 JSON', desc: '产品+纹样+参数', icon: 'data_object' },
]

function findExportableRoot(scene: THREE.Scene | null): THREE.Object3D | null {
  if (!scene) return null
  let found: THREE.Object3D | null = null
  scene.traverse(obj => {
    if (found) return
    if (obj.userData?.exportableRoot === true) found = obj
  })
  return found
}

export function DownloadMenu() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Record<ExportKind, Status>>({
    preview: 'idle',
    'pattern-512': 'idle',
    'pattern-1024': 'idle',
    'pattern-2048': 'idle',
    glb: 'idle',
    json: 'idle',
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedProduct = useCreateStore(state => state.selectedProduct)
  const selectedPattern = useCreateStore(state => state.selectedPattern)
  const textureParams = useCreateStore(state => state.textureParams)
  const materialParams = useCreateStore(state => state.materialParams)
  const threeScene = useCreateStore(state => state.threeScene)

  const productName = useMemo(
    () => PRODUCT_CONFIGS.find(item => item.id === selectedProduct)?.name ?? selectedProduct,
    [selectedProduct]
  )

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const runExport = useCallback(
    async (kind: ExportKind) => {
      setStatus(prev => ({ ...prev, [kind]: 'processing' }))
      setErrorMessage(null)
      try {
        if (kind === 'preview') {
          const canvas = document.querySelector<HTMLCanvasElement>('.canvas-3d-container canvas')
          if (!canvas) throw new Error('未找到 3D 画布')
          await exportPreviewPng(canvas, productName, selectedPattern?.name ?? null)
        } else if (kind.startsWith('pattern-')) {
          if (!selectedPattern) throw new Error('请先选择纹样')
          const size = Number(kind.split('-')[1]) as 512 | 1024 | 2048
          await exportPatternPng(selectedPattern.generatorConfig, size, productName, selectedPattern.name)
        } else if (kind === 'glb') {
          const root = findExportableRoot(threeScene)
          if (!root) throw new Error('未找到可导出的模型')
          await exportModelGlb(root, productName, selectedPattern?.name ?? null)
        } else if (kind === 'json') {
          if (!selectedPattern) throw new Error('请先选择纹样')
          exportCreationJson(
            selectedProduct,
            selectedPattern.id,
            selectedPattern.name,
            textureParams,
            materialParams,
            productName
          )
        }
        setStatus(prev => ({ ...prev, [kind]: 'idle' }))
      } catch (error) {
        setStatus(prev => ({ ...prev, [kind]: 'error' }))
        setErrorMessage(error instanceof Error ? error.message : '导出失败')
        window.setTimeout(() => {
          setStatus(prev => ({ ...prev, [kind]: 'idle' }))
        }, 2000)
      }
    },
    [materialParams, productName, selectedPattern, selectedProduct, textureParams, threeScene]
  )

  return (
    <div ref={containerRef} className="absolute right-4 top-4 z-20">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-light shadow-card transition-all hover:text-cinnabar hover:shadow-hover"
        title="下载"
        aria-label="下载"
        aria-expanded={open}
      >
        <Icon name="download" size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-rice-deep bg-white shadow-modal">
          <div className="border-b border-rice-deep/50 bg-rice-warm/40 px-4 py-2.5">
            <span className="block text-xs font-bold uppercase tracking-widest text-ink-faint">下载导出</span>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {MENU_ITEMS.map(item => {
              const itemStatus = status[item.kind]
              const disabled = itemStatus === 'processing'
              return (
                <li key={item.kind}>
                  <button
                    type="button"
                    onClick={() => runExport(item.kind)}
                    disabled={disabled}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-rice-warm/60 disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-rice-warm text-ink-light">
                      {itemStatus === 'processing' ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-faint/30 border-t-ink-light" />
                      ) : itemStatus === 'error' ? (
                        <Icon name="error" size={18} className="text-cinnabar" />
                      ) : (
                        <Icon name={item.icon} size={18} />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-sm font-bold text-ink">{item.label}</span>
                      <span className="text-[11px] text-ink-faint">{item.desc}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {errorMessage && (
            <div className="border-t border-rice-deep/50 bg-cinnabar/5 px-4 py-2 text-xs font-bold text-cinnabar">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
