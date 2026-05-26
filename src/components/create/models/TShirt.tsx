'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TexturedMaterial } from '../TexturedMaterial'

export default function TShirt() {
  const groupRef = useRef<THREE.Group>(null)

  const tshirtGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.7, -1.2)
    shape.lineTo(-0.7, 0.28)
    shape.lineTo(-1.25, 0.58)
    shape.lineTo(-1.35, 0.9)
    shape.lineTo(-0.72, 0.72)
    shape.lineTo(-0.5, 1.02)
    shape.lineTo(-0.18, 1.12)
    shape.quadraticCurveTo(0, 1.2, 0.18, 1.12)
    shape.lineTo(0.5, 1.02)
    shape.lineTo(0.72, 0.72)
    shape.lineTo(1.35, 0.9)
    shape.lineTo(1.25, 0.58)
    shape.lineTo(0.7, 0.28)
    shape.lineTo(0.7, -1.2)
    shape.lineTo(-0.7, -1.2)
    return new THREE.ShapeGeometry(shape, 32)
  }, [])

  // 手动 new 的几何体不会被 R3F 自动释放，卸载时显式 dispose 以回收 GPU 资源。
  useEffect(() => () => tshirtGeometry.dispose(), [tshirtGeometry])

  useFrame(state => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.015
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={tshirtGeometry}>
        <TexturedMaterial roughnessOverride={90} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.06, 0.015]}>
        <ringGeometry args={[0.11, 0.22, 32]} />
        <meshStandardMaterial color="#2a2a24" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
