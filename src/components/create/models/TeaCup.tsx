'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TexturedMaterial } from '../TexturedMaterial'

export default function TeaCup() {
  const groupRef = useRef<THREE.Group>(null)

  const cupGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, -0.8),
      new THREE.Vector2(0.5, -0.8),
      new THREE.Vector2(0.48, -0.72),
      new THREE.Vector2(0.45, -0.45),
      new THREE.Vector2(0.5, 0.05),
      new THREE.Vector2(0.6, 0.52),
      new THREE.Vector2(0.66, 0.72),
      new THREE.Vector2(0.62, 0.78),
      new THREE.Vector2(0.54, 0.78),
      new THREE.Vector2(0.5, 0.72),
    ]
    return new THREE.LatheGeometry(points, 64)
  }, [])

  const baseGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, -0.86),
      new THREE.Vector2(0.35, -0.86),
      new THREE.Vector2(0.39, -0.8),
      new THREE.Vector2(0.34, -0.76),
      new THREE.Vector2(0, -0.76),
    ]
    return new THREE.LatheGeometry(points, 64)
  }, [])

  // 手动 new 的几何体不会被 R3F 自动释放，卸载时显式 dispose 以回收 GPU 资源。
  useEffect(() => {
    return () => {
      cupGeometry.dispose()
      baseGeometry.dispose()
    }
  }, [cupGeometry, baseGeometry])

  useFrame(state => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.015
  })

  return (
    <group ref={groupRef} position={[0, 0.08, 0]}>
      <mesh geometry={cupGeometry}>
        <TexturedMaterial roughnessOverride={32} metalnessOverride={5} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={baseGeometry}>
        <TexturedMaterial roughnessOverride={35} metalnessOverride={5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.755, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.53, 48]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
    </group>
  )
}
