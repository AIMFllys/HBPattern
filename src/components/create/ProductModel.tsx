'use client'

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import type { ProductId } from '@/types/create'

const modelComponents: Record<
  ProductId,
  LazyExoticComponent<ComponentType>
> = {
  frame: lazy(() => import('./models/Frame')),
  scarf: lazy(() => import('./models/Scarf')),
  'phone-case': lazy(() => import('./models/PhoneCase')),
  fan: lazy(() => import('./models/Fan')),
  'tea-cup': lazy(() => import('./models/TeaCup')),
  tshirt: lazy(() => import('./models/TShirt')),
}

interface Props {
  productId: ProductId
}

export function ProductModel({ productId }: Props) {
  const ModelComponent = modelComponents[productId]

  return (
    <Suspense fallback={<FallbackMesh />}>
      <ModelComponent />
    </Suspense>
  )
}

function FallbackMesh() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ede7d9" opacity={0.5} transparent wireframe />
    </mesh>
  )
}
