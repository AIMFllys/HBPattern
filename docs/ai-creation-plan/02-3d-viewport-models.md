# Round 2 — 3D 视口 + 产品几何体模型

## 目标
创建 R3F 3D 视口容器与 6 种文创产品的程序化几何体，实现基础的 3D 旋转查看体验。
本轮完成后用户可在 `/create` 页面看到可旋转的 3D 模型（暂无纹理）。

---

## 上下文摘要（执行前必读）

| 项目 | 值 |
|------|------|
| 依赖 | Round 1 已安装 three, @react-three/fiber, @react-three/drei |
| Store | `useCreateStore` 已创建，含 `selectedProduct`, `cameraPreset` |
| 类型 | `ProductId`, `ProductConfig`, `CameraPreset` 已定义 |
| 样式规则 | **禁止 inline style**（lint-guards 检查），只用 Tailwind 类名 |
| SSR 策略 | 所有 3D 组件必须 `'use client'` + `dynamic import({ ssr: false })` |
| 设计 token | 使用 `--color-rice`, `--color-ink` 等 CSS 变量（通过 Tailwind 类名） |
| Icon 组件 | 使用 `<Icon name="xxx" />` 调用 Material Symbols |

---

## Step 1：创建 Canvas3D 容器组件

**文件路径：** `src/components/create/Canvas3D.tsx`

```typescript
'use client'

/**
 * 3D 视口容器
 * 封装 R3F Canvas + 环境光照 + 交互控制器
 *
 * 设计要点：
 * - 使用 Suspense 包裹，显示加载占位
 * - OrbitControls 提供旋转/缩放/平移
 * - Environment preset 提供 IBL 环境光
 * - 响应 useCreateStore 中的 cameraPreset 切换视角
 */
import { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
} from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useCreateStore } from '@/stores/useCreateStore'
import { ProductModel } from './ProductModel'

/** 相机预设位置映射 */
const CAMERA_POSITIONS: Record<string, [number, number, number]> = {
  front: [0, 0, 4],
  side:  [4, 0, 0],
  top:   [0, 4, 0.1],  // 微偏避免万向锁
  free:  [2.5, 2, 3],
}

function Scene() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const cameraPreset = useCreateStore((s) => s.cameraPreset)
  const selectedProduct = useCreateStore((s) => s.selectedProduct)

  // 响应视角切换
  useEffect(() => {
    if (!controlsRef.current) return
    const pos = CAMERA_POSITIONS[cameraPreset]
    if (!pos) return

    // 平滑过渡到目标位置
    const controls = controlsRef.current
    const camera = controls.object as THREE.PerspectiveCamera
    camera.position.set(...pos)
    controls.target.set(0, 0, 0)
    controls.update()
  }, [cameraPreset])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />

      {/* 环境光照 */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />

      {/* IBL 环境（柔和室内光） */}
      <Environment preset="apartment" />

      {/* 产品模型 */}
      <Suspense fallback={null}>
        <ProductModel productId={selectedProduct} />
      </Suspense>

      {/* 接触阴影 */}
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={5}
        blur={2.5}
      />

      {/* 交互控制 */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.85}
      />
    </>
  )
}

/** 加载占位 — 纯 CSS 动画 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-rice/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-ink-light">加载 3D 视图…</span>
      </div>
    </div>
  )
}

export default function Canvas3D() {
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-rice-cool">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            preserveDrawingBuffer: true, // 导出截图需要
          }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  )
}
```

**设计决策说明：**
- `preserveDrawingBuffer: true` — Round 6 导出截图依赖此配置，提前设置
- `dpr={[1, 2]}` — 自动适配高 DPI 屏幕但限制上限保证性能
- `ACES Filmic` 色调映射 — 让模型色彩更自然，接近影视级质感
- `ContactShadows` — 无需地面几何体即可生成柔和阴影
- `Environment preset="apartment"` — 柔和的室内光环境，适合展示产品

---

## Step 2：创建 ProductModel 路由器组件

**文件路径：** `src/components/create/ProductModel.tsx`

```typescript
'use client'

/**
 * 产品模型路由器
 * 根据 productId 懒加载对应的几何体组件
 */
import { Suspense, lazy } from 'react'
import type { ProductId } from '@/types/create'

// 懒加载各产品模型，按需加载减小初始包体积
const modelComponents: Record<ProductId, React.LazyExoticComponent<React.ComponentType<ProductModelProps>>> = {
  frame:        lazy(() => import('./models/Frame')),
  scarf:        lazy(() => import('./models/Scarf')),
  'phone-case': lazy(() => import('./models/PhoneCase')),
  fan:          lazy(() => import('./models/Fan')),
  'tea-cup':    lazy(() => import('./models/TeaCup')),
  tshirt:       lazy(() => import('./models/TShirt')),
}

export interface ProductModelProps {
  /** 来自 useCreateStore 的材质参数（Round 3 接入） */
}

interface Props {
  productId: ProductId
}

export function ProductModel({ productId }: Props) {
  const ModelComponent = modelComponents[productId]

  return (
    <Suspense fallback={<FallbackMesh />}>
      <ModelComponent />
    </Suspense>
  )
}

/** 模型加载中的占位几何体 */
function FallbackMesh() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ede7d9" transparent opacity={0.5} wireframe />
    </mesh>
  )
}
```

---

## Step 3：创建 6 个产品几何体模型

### 3.1 画框 — Frame.tsx

**文件路径：** `src/components/create/models/Frame.tsx`

```typescript
'use client'

/**
 * 画框/屏风 — 最简产品
 * 使用 PlaneGeometry 作为主画面 + 4 条 BoxGeometry 作为边框
 * UV 映射：标准平面 UV，直接映射纹理
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCreateStore } from '@/stores/useCreateStore'
import * as THREE from 'three'

export default function Frame() {
  const groupRef = useRef<THREE.Group>(null)
  const baseColor = useCreateStore((s) => s.materialParams.baseColor)

  // 微妙的悬浮呼吸动画
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02
  })

  return (
    <group ref={groupRef}>
      {/* 画面主体 */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2.4, 1.8]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.5}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 边框 — 4 条深色木质边 */}
      {/* 上边 */}
      <mesh position={[0, 0.975, 0.02]}>
        <boxGeometry args={[2.6, 0.15, 0.06]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* 下边 */}
      <mesh position={[0, -0.975, 0.02]}>
        <boxGeometry args={[2.6, 0.15, 0.06]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* 左边 */}
      <mesh position={[-1.225, 0, 0.02]}>
        <boxGeometry args={[0.15, 2.1, 0.06]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* 右边 */}
      <mesh position={[1.225, 0, 0.02]}>
        <boxGeometry args={[0.15, 2.1, 0.06]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  )
}
```

### 3.2 丝巾 — Scarf.tsx

**文件路径：** `src/components/create/models/Scarf.tsx`

```typescript
'use client'

/**
 * 丝巾/方巾
 * PlaneGeometry + 顶点位移模拟轻微褶皱感
 * 4:4 方形比例，边缘微微下垂
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCreateStore } from '@/stores/useCreateStore'
import * as THREE from 'three'

export default function Scarf() {
  const meshRef = useRef<THREE.Mesh>(null)
  const baseColor = useCreateStore((s) => s.materialParams.baseColor)

  // 创建带细分的平面几何体（用于顶点变形）
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2.2, 2.2, 32, 32)
    const positions = geo.attributes.position

    // 边缘下垂效果 + 微妙褶皱
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const distFromCenter = Math.sqrt(x * x + y * y)
      const edgeFactor = Math.max(0, distFromCenter - 0.8) * 0.15
      positions.setZ(i, -edgeFactor + Math.sin(x * 3) * Math.cos(y * 3) * 0.02)
    }

    geo.computeVertexNormals()
    return geo
  }, [])

  // 轻柔的飘动动画
  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = -0.3 + Math.sin(state.clock.elapsedTime * 0.4) * 0.03
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
  })

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-0.3, 0, 0]}>
      <meshStandardMaterial
        color={baseColor}
        roughness={0.85}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
```

### 3.3 手机壳 — PhoneCase.tsx

**文件路径：** `src/components/create/models/PhoneCase.tsx`

```typescript
'use client'

/**
 * 手机壳
 * RoundedBox (drei) 或 BoxGeometry 做圆角矩形体
 * 比例参照主流手机壳尺寸（约 7:15）
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useCreateStore } from '@/stores/useCreateStore'
import * as THREE from 'three'

export default function PhoneCase() {
  const groupRef = useRef<THREE.Group>(null)
  const baseColor = useCreateStore((s) => s.materialParams.baseColor)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02
  })

  return (
    <group ref={groupRef}>
      {/* 壳体 */}
      <RoundedBox args={[1.2, 2.4, 0.15]} radius={0.08} smoothness={4}>
        <meshStandardMaterial
          color={baseColor}
          roughness={0.4}
          metalness={0.05}
        />
      </RoundedBox>

      {/* 壳体内侧凹槽（模拟手机放入的空间） */}
      <RoundedBox args={[1.1, 2.3, 0.12]} radius={0.06} smoothness={4} position={[0, 0, -0.025]}>
        <meshStandardMaterial color="#1a1a14" roughness={0.9} metalness={0} />
      </RoundedBox>

      {/* 摄像头开孔 */}
      <mesh position={[0, 0.7, 0.08]}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
        <meshStandardMaterial color="#2a2a24" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  )
}
```

### 3.4 折扇 — Fan.tsx

**文件路径：** `src/components/create/models/Fan.tsx`

```typescript
'use client'

/**
 * 折扇
 * CircleGeometry 裁切为扇形（thetaLength < 2π）
 * 扇骨使用 BoxGeometry 阵列
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCreateStore } from '@/stores/useCreateStore'
import * as THREE from 'three'

export default function Fan() {
  const groupRef = useRef<THREE.Group>(null)
  const baseColor = useCreateStore((s) => s.materialParams.baseColor)

  // 扇面几何体（半圆扇形）
  const fanGeometry = useMemo(() => {
    const theta = Math.PI * 0.7 // 扇面展开角度（约126°）
    const geo = new THREE.CircleGeometry(2, 48, -theta / 2 + Math.PI / 2, theta)
    return geo
  }, [])

  // 扇骨位置（均匀分布在扇面上）
  const boneAngles = useMemo(() => {
    const theta = Math.PI * 0.7
    const count = 12
    const angles: number[] = []
    for (let i = 0; i <= count; i++) {
      angles.push(-theta / 2 + Math.PI / 2 + (theta * i) / count)
    }
    return angles
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.015
  })

  return (
    <group ref={groupRef} rotation={[0, 0, 0]} position={[0, -0.3, 0]}>
      {/* 扇面 */}
      <mesh geometry={fanGeometry}>
        <meshStandardMaterial
          color={baseColor}
          roughness={0.7}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 扇骨 */}
      {boneAngles.map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(angle) * 1.0,
            Math.sin(angle) * 1.0,
            0.01,
          ]}
          rotation={[0, 0, angle - Math.PI / 2]}
        >
          <boxGeometry args={[0.03, 2.0, 0.01]} />
          <meshStandardMaterial color="#5a4a2a" roughness={0.9} metalness={0} />
        </mesh>
      ))}

      {/* 扇轴铆钉 */}
      <mesh position={[0, 0, 0.02]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
        <meshStandardMaterial color="#c9a84c" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  )
}
```

### 3.5 茶杯 — TeaCup.tsx

**文件路径：** `src/components/create/models/TeaCup.tsx`

```typescript
'use client'

/**
 * 茶杯/陶瓷杯
 * LatheGeometry（旋转体）— 通过轮廓线旋转生成
 * UV 映射为圆柱面展开，适合环绕贴图
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCreateStore } from '@/stores/useCreateStore'
import * as THREE from 'three'

export default function TeaCup() {
  const groupRef = useRef<THREE.Group>(null)
  const baseColor = useCreateStore((s) => s.materialParams.baseColor)

  // 杯体轮廓线 — 定义茶杯的侧面截面
  const cupGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.0, -0.8),   // 杯底中心
      new THREE.Vector2(0.5, -0.8),   // 杯底外缘
      new THREE.Vector2(0.48, -0.75), // 底部圆角
      new THREE.Vector2(0.45, -0.5),  // 下部收窄
      new THREE.Vector2(0.5, 0.0),    // 杯身中部
      new THREE.Vector2(0.6, 0.5),    // 上部微张
      new THREE.Vector2(0.65, 0.7),   // 杯口外缘
      new THREE.Vector2(0.62, 0.75),  // 杯口圆唇
      new THREE.Vector2(0.55, 0.75),  // 杯口内缘
      new THREE.Vector2(0.52, 0.7),   // 内壁起始
    ]
    return new THREE.LatheGeometry(points, 48)
  }, [])

  // 底座几何体
  const baseGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.0, -0.85),
      new THREE.Vector2(0.35, -0.85),
      new THREE.Vector2(0.38, -0.8),
      new THREE.Vector2(0.35, -0.78),
      new THREE.Vector2(0.0, -0.78),
    ]
    return new THREE.LatheGeometry(points, 48)
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.015
  })

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {/* 杯体 */}
      <mesh geometry={cupGeometry}>
        <meshStandardMaterial
          color={baseColor}
          roughness={0.3}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 底座 */}
      <mesh geometry={baseGeometry}>
        <meshStandardMaterial
          color={baseColor}
          roughness={0.3}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 杯内深色 */}
      <mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
    </group>
  )
}
```

### 3.6 T恤 — TShirt.tsx

**文件路径：** `src/components/create/models/TShirt.tsx`

```typescript
'use client'

/**
 * T恤展开图
 * 使用多个 PlaneGeometry 拼接：躯干 + 两袖
 * 近似展开效果，纹理主要贴在正面躯干区域
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCreateStore } from '@/stores/useCreateStore'
import * as THREE from 'three'

export default function TShirt() {
  const groupRef = useRef<THREE.Group>(null)
  const baseColor = useCreateStore((s) => s.materialParams.baseColor)

  // 躯干轮廓（使用 Shape 创建 T 恤形状）
  const tshirtGeometry = useMemo(() => {
    const shape = new THREE.Shape()

    // T恤轮廓（从左下角开始顺时针）
    shape.moveTo(-0.7, -1.2)   // 左下摆
    shape.lineTo(-0.7, 0.3)    // 左侧身
    shape.lineTo(-1.3, 0.6)    // 左袖下边
    shape.lineTo(-1.3, 0.9)    // 左袖外侧
    shape.lineTo(-0.7, 0.7)    // 左袖上边回到肩部
    shape.lineTo(-0.5, 1.0)    // 左肩
    shape.lineTo(-0.2, 1.1)    // 左领
    shape.quadraticCurveTo(0, 1.2, 0.2, 1.1) // 领口曲线
    shape.lineTo(0.5, 1.0)     // 右领→右肩
    shape.lineTo(0.7, 0.7)     // 右肩→右袖
    shape.lineTo(1.3, 0.9)     // 右袖外侧
    shape.lineTo(1.3, 0.6)     // 右袖下边
    shape.lineTo(0.7, 0.3)     // 右侧身
    shape.lineTo(0.7, -1.2)    // 右下摆
    shape.lineTo(-0.7, -1.2)   // 底边

    const geo = new THREE.ShapeGeometry(shape, 32)
    return geo
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.015
  })

  return (
    <group ref={groupRef}>
      {/* T恤正面 */}
      <mesh geometry={tshirtGeometry}>
        <meshStandardMaterial
          color={baseColor}
          roughness={0.9}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 领口内侧（稍微凹陷+深色） */}
      <mesh position={[0, 1.05, -0.01]}>
        <ringGeometry args={[0.12, 0.22, 16]} />
        <meshStandardMaterial
          color="#2a2a24"
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </group>
  )
}
```

---

## Step 4：在 Create 页面中集成 3D 视口（临时测试用）

**文件路径：** `src/app/(main)/create/page.tsx`

> ⚠️ 本步仅在 create page 中添加最小化的 3D 视口入口用于验证。
> 完整页面布局在 Round 5 中实现。此处使用 dynamic import 避免 SSR 问题。

```typescript
'use client'

import dynamic from 'next/dynamic'

/**
 * 动态导入 Canvas3D，禁用 SSR
 * R3F 依赖浏览器 API（WebGL/Canvas），不可服务端渲染
 */
const Canvas3D = dynamic(
  () => import('@/components/create/Canvas3D'),
  { ssr: false }
)

export default function CreatePage() {
  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)]">
      <div className="flex-1 relative">
        <Canvas3D />
      </div>
    </div>
  )
}
```

**注意：** 此处临时替换原有 mockup 页面。原始 mockup 代码可从 git 历史恢复。

---

## Step 5：添加 Canvas3D 的 CSS 类名

**文件修改：** `src/app/globals.css` — 追加以下内容

```css
/* ── 3D Canvas 容器 ─────────────────────────────────────── */
/* 确保 R3F canvas 填满父容器 */
.canvas-3d-container canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
```

> 仅在确实需要覆盖 R3F 默认行为时才使用 `!important`，此处是合理的特例。

---

## 验证步骤

```bash
# 1. 构建检查
npm run build

# 2. 代码规范检查
npm run lint

# 3. 手动验证
npm run dev
# 访问 http://localhost:6427/create
# 预期：看到默认的画框 3D 模型，可用鼠标旋转/缩放
```

验证要点：
- [ ] 3D 视口正确渲染，背景为 rice-cool 色
- [ ] 画框模型可见，有边框+底色
- [ ] OrbitControls 鼠标交互正常（左键旋转、滚轮缩放、右键平移）
- [ ] 无 SSR hydration 错误
- [ ] 控制台无 Three.js 警告
- [ ] 移动端触控正常

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/components/create/Canvas3D.tsx` | 新建 | R3F 视口容器 |
| `src/components/create/ProductModel.tsx` | 新建 | 模型路由器 |
| `src/components/create/models/Frame.tsx` | 新建 | 画框几何体 |
| `src/components/create/models/Scarf.tsx` | 新建 | 丝巾几何体 |
| `src/components/create/models/PhoneCase.tsx` | 新建 | 手机壳几何体 |
| `src/components/create/models/Fan.tsx` | 新建 | 折扇几何体 |
| `src/components/create/models/TeaCup.tsx` | 新建 | 茶杯几何体 |
| `src/components/create/models/TShirt.tsx` | 新建 | T恤几何体 |
| `src/app/(main)/create/page.tsx` | 修改 | 临时接入 3D 视口 |
| `src/app/globals.css` | 追加 | Canvas 容器样式 |

---

## 技术深度说明

### UV 映射策略

每种几何体的 UV 映射决定了纹理如何贴合产品表面：

| 产品 | UV 类型 | 纹理映射特点 |
|------|---------|-------------|
| Frame | 标准平面 UV | 纹理直接平铺，无变形 |
| Scarf | 平面 UV + 顶点偏移 | 纹理整体平铺，边缘有微变形 |
| PhoneCase | Box UV (RoundedBox) | 正面 UV 区域用于纹理 |
| Fan | 径向 UV | 纹理从扇轴向外放射 |
| TeaCup | 圆柱 UV (Lathe) | 纹理环绕杯身，上下无明显拉伸 |
| TShirt | Shape UV | 纹理映射到 T 恤正面区域 |

### 性能考量

- 所有几何体面数控制在 1000-5000 面以内
- `useMemo` 缓存几何体创建，避免每帧重建
- `useFrame` 动画使用简单三角函数，零 GC 压力
- 模型通过 `lazy()` 懒加载，仅加载当前选中的产品

---

**下一步：执行 Round 3 (`03-texture-system.md`)**
