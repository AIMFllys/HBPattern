'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TexturedMaterial } from '../TexturedMaterial'

export default function Fan() {
  const groupRef = useRef<THREE.Group>(null)

  const fanGeometry = useMemo(() => {
    const theta = Math.PI * 0.72
    return new THREE.CircleGeometry(2, 64, -theta / 2 + Math.PI / 2, theta)
  }, [])

  // 手动 new 的几何体不会被 R3F 自动释放，卸载时显式 dispose 以回收 GPU 资源。
  useEffect(() => () => fanGeometry.dispose(), [fanGeometry])

  const boneAngles = useMemo(() => {
    const theta = Math.PI * 0.72
    return Array.from({ length: 13 }, (_, index) => {
      return -theta / 2 + Math.PI / 2 + (theta * index) / 12
    })
  }, [])

  useFrame(state => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.015
  })

  return (
    <group ref={groupRef} position={[0, -0.45, 0]}>
      <mesh geometry={fanGeometry}>
        <TexturedMaterial roughnessOverride={72} side={THREE.DoubleSide} />
      </mesh>
      {boneAngles.map(angle => (
        <mesh
          key={angle}
          position={[Math.cos(angle), Math.sin(angle), 0.025]}
          rotation={[0, 0, angle - Math.PI / 2]}
        >
          <boxGeometry args={[0.035, 2.02, 0.018]} />
          <meshStandardMaterial color="#5a4a2a" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.07, 0.07, 0.05, 24]} />
        <meshStandardMaterial color="#c9a84c" roughness={0.35} metalness={0.55} />
      </mesh>
    </group>
  )
}
