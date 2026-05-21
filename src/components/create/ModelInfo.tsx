'use client'

import { PRODUCT_CONFIGS } from '@/lib/textures/productConfigs'
import { useCreateStore } from '@/stores/useCreateStore'

export function ModelInfo() {
  const selectedProduct = useCreateStore(state => state.selectedProduct)
  const selectedPattern = useCreateStore(state => state.selectedPattern)
  const product = PRODUCT_CONFIGS.find(item => item.id === selectedProduct)

  return (
    <div className="absolute left-4 top-4 z-10 rounded-lg border border-white/50 bg-white/75 px-4 py-2.5 shadow-card backdrop-blur-sm">
      <span className="block text-xs font-bold uppercase tracking-widest text-ink-faint">
        当前模型
      </span>
      <p className="text-sm font-bold text-ink">
        {product?.name ?? '未知产品'}
        {selectedPattern && (
          <span className="font-normal text-ink-light"> · {selectedPattern.name}</span>
        )}
      </p>
    </div>
  )
}
