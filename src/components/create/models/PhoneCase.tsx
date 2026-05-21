'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useCreateStore } from '@/stores/useCreateStore'

export default function PhoneCase() {
  const groupRef = useRef<THREE.Group>(null)
  const baseColor = useCreateStore(state => state.materialParams.baseColor)

  useFrame(state => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02
  })

  return (
    <group ref={groupRef}>
      <RoundedBox args={[1.18, 2.35, 0.16]} radius={0.09} smoothness={4}>
        <meshStandardMaterial color={baseColor} roughness={0.42} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[1.02, 2.17, 0.08]} radius={0.07} smoothness={4} position={[0, 0, -0.06]}>
        <meshStandardMaterial color="#1a1a14" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0.32, 0.78, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.045, 24]} />
        <meshStandardMaterial color="#2a2a24" roughness={0.5} metalness={0.25} />
      </mesh>
    </group>
  )
}
