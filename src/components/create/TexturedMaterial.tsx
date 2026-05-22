'use client'

import * as THREE from 'three'
import { usePatternTexture } from '@/hooks/usePatternTexture'
import { useCreateStore } from '@/stores/useCreateStore'

interface Props {
  roughnessOverride?: number
  metalnessOverride?: number
  side?: THREE.Side
}

export function TexturedMaterial({
  roughnessOverride,
  metalnessOverride,
  side = THREE.FrontSide,
}: Props) {
  const materialParams = useCreateStore(state => state.materialParams)
  const textureParams = useCreateStore(state => state.textureParams)
  const texture = usePatternTexture()
  const showBaseSurface = materialParams.showBaseSurface

  return (
    <meshStandardMaterial
      color={showBaseSurface ? materialParams.baseColor : '#ffffff'}
      map={texture}
      metalness={(metalnessOverride ?? materialParams.metalness) / 100}
      opacity={showBaseSurface ? 1 : texture ? textureParams.opacity / 100 : 1}
      roughness={(roughnessOverride ?? materialParams.roughness) / 100}
      side={side}
      transparent={Boolean(texture) && (!showBaseSurface || textureParams.opacity < 100)}
    />
  )
}
