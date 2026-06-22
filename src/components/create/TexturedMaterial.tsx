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

  const opacity = texture ? textureParams.opacity / 100 : 1

  return (
    <meshStandardMaterial
      color="#ffffff"
      map={texture}
      metalness={(metalnessOverride ?? materialParams.metalness) / 100}
      opacity={opacity}
      roughness={(roughnessOverride ?? materialParams.roughness) / 100}
      side={side}
      transparent={Boolean(texture) && opacity < 1}
      alphaTest={0}
      polygonOffset
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
    />
  )
}
