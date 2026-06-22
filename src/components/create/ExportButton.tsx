'use client'

import { useCallback, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { saveCreation } from '@/lib/createStorage'
import { useAuthModal } from '@/stores/useAuthModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCreateStore } from '@/stores/useCreateStore'

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
