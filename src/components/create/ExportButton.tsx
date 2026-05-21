'use client'

import { useCallback, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { PRODUCT_CONFIGS } from '@/lib/textures/productConfigs'
import { saveCreation } from '@/lib/createStorage'
import { useAuthModal } from '@/stores/useAuthModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCreateStore } from '@/stores/useCreateStore'

function createSafeDate() {
  return new Date().toISOString().slice(0, 10)
}

export function ExportButton() {
  const isExporting = useCreateStore(state => state.isExporting)
  const setIsExporting = useCreateStore(state => state.setIsExporting)
  const selectedProduct = useCreateStore(state => state.selectedProduct)
  const selectedPattern = useCreateStore(state => state.selectedPattern)
  const user = useAuthStore(state => state.user)
  const openModal = useAuthModal(state => state.openModal)

  const handleExport = useCallback(() => {
    if (!user) {
      openModal('登录后即可导出高清设计稿')
      return
    }

    const canvas = document.querySelector<HTMLCanvasElement>('.canvas-3d-container canvas')
    if (!canvas) return

    const product = PRODUCT_CONFIGS.find(item => item.id === selectedProduct)
    const filename = `湖北纹案_${product?.name ?? selectedProduct}_${selectedPattern?.name ?? '无纹样'}_${createSafeDate()}.png`

    setIsExporting(true)
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      window.setTimeout(() => setIsExporting(false), 800)
    }
  }, [openModal, selectedPattern, selectedProduct, setIsExporting, user])

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold shadow-lg transition-all active:scale-95 ${
        isExporting
          ? 'cursor-wait bg-ink-light text-white'
          : 'bg-cinnabar text-white shadow-cinnabar/20 hover:bg-cinnabar-deep'
      }`}
    >
      <Icon name={isExporting ? 'hourglass_empty' : 'download'} size={16} />
      {isExporting ? '导出中...' : '导出 PNG'}
    </button>
  )
}

export function SaveCreationButton() {
  const [saved, setSaved] = useState(false)
  const selectedProduct = useCreateStore(state => state.selectedProduct)
  const selectedPattern = useCreateStore(state => state.selectedPattern)
  const textureParams = useCreateStore(state => state.textureParams)
  const materialParams = useCreateStore(state => state.materialParams)
  const user = useAuthStore(state => state.user)
  const openModal = useAuthModal(state => state.openModal)

  const handleSave = useCallback(() => {
    if (!user) {
      openModal('登录后即可保存您的创作配置')
      return
    }
    if (!selectedPattern) return

    saveCreation(selectedProduct, selectedPattern.id, textureParams, materialParams)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }, [materialParams, openModal, selectedPattern, selectedProduct, textureParams, user])

  return (
    <button
      type="button"
      onClick={handleSave}
      className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
        saved
          ? 'border-success bg-success/5 text-success'
          : 'border-cinnabar text-cinnabar hover:bg-cinnabar/5'
      }`}
    >
      <Icon name={saved ? 'check_circle' : 'bookmark'} size={16} />
      {saved ? '已保存' : '保存配置'}
    </button>
  )
}
