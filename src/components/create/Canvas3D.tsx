'use client'

import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  ContactShadows,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useCreateStore } from '@/stores/useCreateStore'
import { ProductModel } from './ProductModel'
import type { CameraPreset } from '@/types/create'

const CAMERA_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  front: [0, 0.2, 4],
  side: [4, 0.2, 0.2],
  top: [0, 4, 0.1],
  free: [2.5, 2, 3],
}

function Scene() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const cameraPreset = useCreateStore(state => state.cameraPreset)
  const selectedProduct = useCreateStore(state => state.selectedProduct)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const position = CAMERA_POSITIONS[cameraPreset]
    const camera = controls.object as THREE.PerspectiveCamera
    camera.position.set(...position)
    camera.lookAt(0, 0, 0)
    controls.target.set(0, 0, 0)
    controls.update()
  }, [cameraPreset])

  return (
    <>
      <PerspectiveCamera makeDefault position={CAMERA_POSITIONS.front} fov={45} />
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#f5f0e8', '#3a2a1a', 0.55]} />
      <directionalLight position={[5, 5, 5]} intensity={0.85} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />
      <Suspense fallback={null}>
        <ProductModel productId={selectedProduct} />
      </Suspense>
      <ContactShadows position={[0, -1.55, 0]} opacity={0.35} scale={5} blur={2.5} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.88}
      />
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center bg-rice-warm/60">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="text-sm font-medium text-ink-light">加载 3D 视图...</span>
      </div>
    </div>
  )
}

export default function Canvas3D() {
  return (
    <div className="canvas-3d-container relative h-full min-h-[400px] w-full overflow-hidden bg-rice-warm">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          shadows
          role="img"
          aria-label="3D 文创产品预览"
          dpr={[1, 2]}
          performance={{ min: 0.5, max: 1, debounce: 200 }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
            powerPreference: 'high-performance',
          }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  )
}
