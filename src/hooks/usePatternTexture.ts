'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useCreateStore } from '@/stores/useCreateStore'
import { getCachedTexture } from '@/lib/textures/textureCache'

export function usePatternTexture(): THREE.Texture | null {
  const selectedPattern = useCreateStore(state => state.selectedPattern)
  const textureParams = useCreateStore(state => state.textureParams)

  const texture = useMemo(() => {
    if (!selectedPattern) return null

    const cachedTexture = getCachedTexture(selectedPattern.generatorConfig)
    const nextTexture = cachedTexture.clone()
    nextTexture.image = cachedTexture.image
    nextTexture.colorSpace = THREE.SRGBColorSpace
    configureTexture(nextTexture, textureParams)
    nextTexture.needsUpdate = true
    return nextTexture
  }, [selectedPattern, textureParams])

  useEffect(() => {
    return () => {
      texture?.dispose()
    }
  }, [texture])

  return texture
}

function configureTexture(texture: THREE.Texture, textureParams: ReturnType<typeof useCreateStore.getState>['textureParams']) {
  const repeatValue = 100 / Math.max(10, textureParams.scale)
  texture.repeat.set(repeatValue, repeatValue)
  texture.rotation = (textureParams.rotation * Math.PI) / 180
  texture.center.set(0.5, 0.5)
  texture.offset.set(textureParams.offsetX / 100, textureParams.offsetY / 100)

  if (textureParams.tiling === 'repeat') {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
  } else if (textureParams.tiling === 'mirror') {
    texture.wrapS = THREE.MirroredRepeatWrapping
    texture.wrapT = THREE.MirroredRepeatWrapping
  } else {
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
  }
}
