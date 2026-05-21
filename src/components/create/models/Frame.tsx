'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCreateStore } from '@/stores/useCreateStore'

export default function Frame() {
  const groupRef = useRef<THREE.Group>(null)
  const baseColor = useCreateStore(state => state.materialParams.baseColor)

  useFrame(state => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2.4, 1.8]} />
        <meshStandardMaterial color={baseColor} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.975, 0.03]}>
        <boxGeometry args={[2.65, 0.16, 0.08]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.975, 0.03]}>
        <boxGeometry args={[2.65, 0.16, 0.08]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[-1.245, 0, 0.03]}>
        <boxGeometry args={[0.16, 2.1, 0.08]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[1.245, 0, 0.03]}>
        <boxGeometry args={[0.16, 2.1, 0.08]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  )
}
