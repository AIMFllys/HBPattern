'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCreateStore } from '@/stores/useCreateStore'

export default function Scarf() {
  const meshRef = useRef<THREE.Mesh>(null)
  const baseColor = useCreateStore(state => state.materialParams.baseColor)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2.25, 2.25, 36, 36)
    const positions = geo.attributes.position

    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index)
      const y = positions.getY(index)
      const distance = Math.sqrt(x * x + y * y)
      const edgeDrop = Math.max(0, distance - 0.82) * 0.16
      positions.setZ(index, -edgeDrop + Math.sin(x * 3.2) * Math.cos(y * 3.2) * 0.025)
    }

    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame(state => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = -0.32 + Math.sin(state.clock.elapsedTime * 0.4) * 0.03
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
  })

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-0.32, 0, 0]}>
      <meshStandardMaterial
        color={baseColor}
        roughness={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
