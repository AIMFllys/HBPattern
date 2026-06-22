'use client'

import * as THREE from 'three'
import { useCreateStore } from '@/stores/useCreateStore'

interface Props {
  side?: THREE.Side
}

export function BaseSurfaceMaterial({ side = THREE.FrontSide }: Props) {
  const baseColor = useCreateStore(state => state.materialParams.baseColor)
  const showBaseSurface = useCreateStore(state => state.materialParams.showBaseSurface)
  const roughness = useCreateStore(state => state.materialParams.roughness)
  const metalness = useCreateStore(state => state.materialParams.metalness)

  return (
    <meshStandardMaterial
      color={showBaseSurface ? baseColor : '#000000'}
      roughness={roughness / 100}
      metalness={metalness / 100}
      side={side}
      transparent={!showBaseSurface}
      opacity={showBaseSurface ? 1 : 0}
      depthWrite={showBaseSurface}
      polygonOffset
      polygonOffsetFactor={1}
      polygonOffsetUnits={1}
    />
  )
}
