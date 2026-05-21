'use client'

import { memo, useCallback } from 'react'
import { Icon } from '@/components/icons/Icon'
import { PRODUCT_CONFIGS } from '@/lib/textures/productConfigs'
import { useCreateStore } from '@/stores/useCreateStore'
import type { ProductId } from '@/types/create'

export const ProductSelector = memo(function ProductSelector() {
  const selectedProduct = useCreateStore(state => state.selectedProduct)
  const setProduct = useCreateStore(state => state.setProduct)

  const handleSelect = useCallback(
    (productId: ProductId) => {
      if (productId !== selectedProduct) {
        setProduct(productId)
      }
    },
    [selectedProduct, setProduct]
  )

  return (
    <div className="custom-scrollbar flex items-center gap-1 overflow-x-auto border-b border-rice-deep bg-rice-warm/55 px-3 py-2">
      <span className="flex-shrink-0 px-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
        载体
      </span>
      {PRODUCT_CONFIGS.map(product => {
        const isActive = selectedProduct === product.id

        return (
          <button
            key={product.id}
            id={`product-${product.id}`}
            type="button"
            disabled={!product.available}
            onClick={() => handleSelect(product.id)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              isActive
                ? 'bg-cinnabar text-white shadow-sm'
                : 'text-ink-light hover:bg-rice-warm hover:text-ink-medium'
            } ${product.available ? '' : 'cursor-not-allowed opacity-50'}`}
            title={product.description}
          >
            <Icon name={product.icon} size={16} />
            {product.name}
          </button>
        )
      })}
    </div>
  )
})
