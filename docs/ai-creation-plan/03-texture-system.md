# Round 3 — 动态纹理系统 + 参数化控制

## 目标
实现纹样的程序化生成、动态贴图和实时参数调节。本轮是整个系统的**技术核心**——
用户调整参数 → 纹理实时更新 → 3D 模型上即时可见。

**本轮完成后：** 3D 模型上可显示程序化生成的纹样纹理，且可通过参数实时控制。

---

## 上下文摘要（执行前必读）

| 项目 | 值 |
|------|------|
| Round 2 产出 | Canvas3D + 6 个产品几何体，模型可旋转查看 |
| 纹理参数 | `TextureParams`（scale/rotation/offset/opacity/tiling）已在 types/create.ts 定义 |
| 材质参数 | `MaterialParams`（baseColor/roughness/metalness）已定义 |
| Store | `useCreateStore` 已有 textureParams/materialParams 读写方法 |
| 纹样预设 | `PATTERN_PRESETS` 8 个预设已定义，含 `generatorConfig` |
| lint 规则 | 禁止 inline style / any / console.log |

---

## 核心技术方案

### 纹理生成流水线

```
PatternPreset.generatorConfig
        ↓
generatePattern() → OffscreenCanvas 2D 绘制
        ↓
canvas.toDataURL() or canvas → THREE.CanvasTexture
        ↓
应用 TextureParams (repeat/rotation/offset/wrap)
        ↓
赋给产品模型材质的 map 属性
        ↓
useFrame 循环中检测参数变化 → 更新 texture 属性
```

### 为什么用 OffscreenCanvas 而非图片文件

1. **零网络请求** — 纯前端生成，无需 `/public/images/` 下放大量纹理文件
2. **参数化可控** — 颜色、密度、线宽直接映射到 Canvas 2D API
3. **体积极小** — 一个生成函数 < 5KB gzip，替代数 MB 图片资源
4. **即时更新** — 切换纹样时无加载延迟

---

## Step 1：创建程序化纹理生成器

**文件路径：** `src/lib/textures/generatePattern.ts`

```typescript
/**
 * 程序化纹样纹理生成器
 *
 * 使用 Canvas 2D API 绘制传统纹样图案，
 * 返回可直接用于 Three.js CanvasTexture 的 HTMLCanvasElement。
 *
 * 每种 type 对应一种绘制算法，灵感来源于湖北传统纹样的几何特征。
 */
import type { PatternGeneratorConfig } from '@/types/create'

/** 纹理画布大小（正方形） */
const TEXTURE_SIZE = 512

/**
 * 根据配置生成纹样画布
 * @returns HTMLCanvasElement，可直接传入 THREE.CanvasTexture
 */
export function generatePatternCanvas(config: PatternGeneratorConfig): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  // 清空画布（透明或背景色）
  if (config.backgroundColor === 'transparent') {
    ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  } else {
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  }

  // 根据类型分发绘制
  switch (config.type) {
    case 'geometric':
      drawGeometric(ctx, config)
      break
    case 'floral':
      drawFloral(ctx, config)
      break
    case 'wave':
      drawWave(ctx, config)
      break
    case 'cloud':
      drawCloud(ctx, config)
      break
    case 'dragon':
      drawDragon(ctx, config)
      break
    case 'phoenix':
      drawPhoenix(ctx, config)
      break
  }

  return canvas
}

// ── 几何纹样（万字回纹/西兰卡普风格）─────────────────────────────────────

function drawGeometric(ctx: CanvasRenderingContext2D, config: PatternGeneratorConfig) {
  const { primaryColor, secondaryColor, lineWidth, density, style } = config
  const size = TEXTURE_SIZE
  const cellSize = size / density

  ctx.strokeStyle = primaryColor
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'square'

  for (let row = 0; row < density; row++) {
    for (let col = 0; col < density; col++) {
      const x = col * cellSize
      const y = row * cellSize
      const isEven = (row + col) % 2 === 0

      ctx.save()
      ctx.translate(x + cellSize / 2, y + cellSize / 2)

      if (style === 'bold') {
        // 粗犷的菱形嵌套
        drawDiamond(ctx, cellSize * 0.4, isEven ? primaryColor : secondaryColor, lineWidth)
        drawDiamond(ctx, cellSize * 0.2, isEven ? secondaryColor : primaryColor, lineWidth)
      } else if (style === 'minimal') {
        // 极简回纹
        drawSpiral(ctx, cellSize * 0.35, primaryColor, lineWidth, isEven ? 1 : -1)
      } else {
        // 默认：交错十字
        drawCross(ctx, cellSize * 0.3, isEven ? primaryColor : secondaryColor, lineWidth)
      }

      ctx.restore()
    }
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, halfSize: number, color: string, lw: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.beginPath()
  ctx.moveTo(0, -halfSize)
  ctx.lineTo(halfSize, 0)
  ctx.lineTo(0, halfSize)
  ctx.lineTo(-halfSize, 0)
  ctx.closePath()
  ctx.stroke()
}

function drawSpiral(ctx: CanvasRenderingContext2D, size: number, color: string, lw: number, dir: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.beginPath()
  const steps = 3
  let s = size
  let x = 0, y = -s
  ctx.moveTo(x, y)
  for (let i = 0; i < steps * 4; i++) {
    const angle = (i % 4)
    s *= 0.75
    if (angle === 0) { x += s * dir; ctx.lineTo(x, y) }
    else if (angle === 1) { y += s; ctx.lineTo(x, y) }
    else if (angle === 2) { x -= s * dir; ctx.lineTo(x, y) }
    else { y -= s; ctx.lineTo(x, y) }
  }
  ctx.stroke()
}

function drawCross(ctx: CanvasRenderingContext2D, size: number, color: string, lw: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.beginPath()
  ctx.moveTo(-size, 0); ctx.lineTo(size, 0)
  ctx.moveTo(0, -size); ctx.lineTo(0, size)
  ctx.stroke()
}

// ── 花卉纹样（刺绣牡丹/蓝印花风格）─────────────────────────────────────

function drawFloral(ctx: CanvasRenderingContext2D, config: PatternGeneratorConfig) {
  const { primaryColor, secondaryColor, density, style, lineWidth } = config
  const size = TEXTURE_SIZE
  const cellSize = size / Math.max(2, Math.floor(density / 2))

  for (let row = 0; row < Math.ceil(size / cellSize); row++) {
    for (let col = 0; col < Math.ceil(size / cellSize); col++) {
      const cx = col * cellSize + cellSize / 2 + (row % 2) * (cellSize / 2)
      const cy = row * cellSize + cellSize / 2

      ctx.save()
      ctx.translate(cx, cy)

      const petalCount = style === 'delicate' ? 8 : style === 'minimal' ? 5 : 6
      const petalSize = cellSize * 0.3

      // 花瓣
      for (let i = 0; i < petalCount; i++) {
        const angle = (Math.PI * 2 * i) / petalCount
        ctx.save()
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.ellipse(0, -petalSize * 0.5, petalSize * 0.25, petalSize * 0.5, 0, 0, Math.PI * 2)
        ctx.fillStyle = primaryColor
        ctx.globalAlpha = 0.8
        ctx.fill()
        ctx.strokeStyle = secondaryColor
        ctx.lineWidth = lineWidth * 0.5
        ctx.globalAlpha = 1
        ctx.stroke()
        ctx.restore()
      }

      // 花心
      ctx.beginPath()
      ctx.arc(0, 0, petalSize * 0.15, 0, Math.PI * 2)
      ctx.fillStyle = secondaryColor
      ctx.fill()

      ctx.restore()
    }
  }
}

// ── 水波纹 ───────────────────────────────────────────────────────────────

function drawWave(ctx: CanvasRenderingContext2D, config: PatternGeneratorConfig) {
  const { primaryColor, secondaryColor, density, lineWidth } = config
  const size = TEXTURE_SIZE
  const waveCount = density
  const waveHeight = size / waveCount

  for (let i = 0; i < waveCount + 2; i++) {
    const baseY = i * waveHeight - waveHeight
    ctx.strokeStyle = i % 2 === 0 ? primaryColor : secondaryColor
    ctx.lineWidth = lineWidth
    ctx.beginPath()

    for (let x = 0; x <= size; x += 2) {
      const y = baseY + Math.sin((x / size) * Math.PI * 4) * (waveHeight * 0.3)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

// ── 云纹（汉代流云纹风格）─────────────────────────────────────────────────

function drawCloud(ctx: CanvasRenderingContext2D, config: PatternGeneratorConfig) {
  const { primaryColor, secondaryColor, density, lineWidth, style } = config
  const size = TEXTURE_SIZE
  const cloudCount = Math.max(3, density)

  ctx.strokeStyle = primaryColor
  ctx.lineWidth = lineWidth

  for (let i = 0; i < cloudCount; i++) {
    const cx = ((i * 137.5) % size)  // 黄金角分布
    const cy = ((i * 89.3 + 50) % size)
    const cloudSize = (size / cloudCount) * (style === 'delicate' ? 0.8 : 1.2)

    ctx.save()
    ctx.translate(cx, cy)

    // 云头（卷曲的螺旋）
    ctx.beginPath()
    for (let t = 0; t < Math.PI * 3; t += 0.1) {
      const r = cloudSize * 0.15 * (1 + t * 0.15)
      const x = Math.cos(t) * r
      const y = Math.sin(t) * r
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // 云尾
    ctx.beginPath()
    ctx.moveTo(cloudSize * 0.4, 0)
    ctx.quadraticCurveTo(cloudSize * 0.6, cloudSize * 0.2, cloudSize * 0.8, 0)
    ctx.strokeStyle = secondaryColor
    ctx.stroke()

    ctx.restore()
  }
}

// ── 龙纹/神兽纹（抽象化的蜷曲线条）─────────────────────────────────────

function drawDragon(ctx: CanvasRenderingContext2D, config: PatternGeneratorConfig) {
  const { primaryColor, secondaryColor, density, lineWidth, style } = config
  const size = TEXTURE_SIZE
  const scale = size / 4

  ctx.strokeStyle = primaryColor
  ctx.lineWidth = lineWidth * 1.5
  ctx.lineCap = 'round'

  // 抽象化的 S 形蜷曲体态
  const segments = density * 2
  for (let s = 0; s < Math.max(1, Math.floor(density / 3)); s++) {
    const offsetX = (s * size) / Math.max(1, Math.floor(density / 3))
    const offsetY = (s * 73) % (size * 0.6)

    ctx.save()
    ctx.translate(offsetX, offsetY + size * 0.2)

    ctx.beginPath()
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      const x = Math.sin(t) * scale + Math.sin(t * 2) * (scale * 0.3)
      const y = t * scale * 0.4 - scale
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // 鳞片装饰
    if (style !== 'minimal') {
      ctx.strokeStyle = secondaryColor
      ctx.lineWidth = lineWidth * 0.5
      for (let i = 0; i < segments; i += 2) {
        const t = (i / segments) * Math.PI * 2
        const x = Math.sin(t) * scale + Math.sin(t * 2) * (scale * 0.3)
        const y = t * scale * 0.4 - scale
        ctx.beginPath()
        ctx.arc(x, y, scale * 0.05, 0, Math.PI, true)
        ctx.stroke()
      }
    }

    ctx.restore()
  }
}

// ── 凤鸟纹（抽象化的飞翔形态）─────────────────────────────────────────

function drawPhoenix(ctx: CanvasRenderingContext2D, config: PatternGeneratorConfig) {
  const { primaryColor, secondaryColor, density, lineWidth, style } = config
  const size = TEXTURE_SIZE

  const birdCount = Math.max(1, Math.floor(density / 2))

  for (let b = 0; b < birdCount; b++) {
    const cx = size * (0.3 + (b * 0.5) % 1)
    const cy = size * (0.3 + (b * 0.37) % 0.6)
    const birdScale = (size / birdCount) * 0.4

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((b * Math.PI) / 4)

    ctx.strokeStyle = primaryColor
    ctx.lineWidth = lineWidth * 1.5
    ctx.lineCap = 'round'

    // 凤身体曲线
    ctx.beginPath()
    ctx.moveTo(-birdScale, 0)
    ctx.quadraticCurveTo(0, -birdScale * 0.8, birdScale, -birdScale * 0.3)
    ctx.stroke()

    // 翅膀
    ctx.beginPath()
    ctx.moveTo(-birdScale * 0.2, -birdScale * 0.2)
    ctx.quadraticCurveTo(-birdScale * 0.8, -birdScale * 1.2, 0, -birdScale * 0.8)
    ctx.strokeStyle = style === 'bold' ? primaryColor : secondaryColor
    ctx.stroke()

    // 凤尾（长长的卷曲）
    ctx.strokeStyle = secondaryColor
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.moveTo(-birdScale, 0)
    for (let t = 0; t < Math.PI * 2; t += 0.1) {
      const r = birdScale * 0.3 * (1 + t * 0.2)
      ctx.lineTo(-birdScale - Math.cos(t) * r * 0.5, Math.sin(t) * r)
    }
    ctx.stroke()

    // 冠羽
    ctx.strokeStyle = primaryColor
    ctx.lineWidth = lineWidth * 0.8
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      const angle = -Math.PI / 4 + (i * Math.PI) / 12
      ctx.moveTo(birdScale * 0.8, -birdScale * 0.3)
      ctx.quadraticCurveTo(
        birdScale * 1.0 + Math.cos(angle) * birdScale * 0.3,
        -birdScale * 0.5 + Math.sin(angle) * birdScale * 0.3,
        birdScale * 0.9 + Math.cos(angle) * birdScale * 0.5,
        -birdScale * 0.6 + Math.sin(angle) * birdScale * 0.5
      )
      ctx.stroke()
    }

    ctx.restore()
  }
}
```

**设计决策说明：**
- 每种纹样的绘制算法提取了真实湖北传统纹样的**几何特征**进行抽象程序化
- `density` 参数控制疏密，`style` 参数控制笔触风格（粗犷/精细/极简）
- 纹理尺寸固定 512×512 — 在清晰度和性能间取得平衡
- 背景默认透明 — 通过 opacity 混合贴在产品底色上

---

## Step 2：创建纹理应用 Hook

**文件路径：** `src/hooks/usePatternTexture.ts`

```typescript
'use client'

/**
 * usePatternTexture
 *
 * 核心 Hook：将 PatternPreset + TextureParams 转化为可用的 THREE.Texture
 * 响应参数变化实时更新纹理属性
 *
 * 使用方式：
 *   const texture = usePatternTexture()
 *   <meshStandardMaterial map={texture} />
 */
import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useCreateStore } from '@/stores/useCreateStore'
import { generatePatternCanvas } from '@/lib/textures/generatePattern'

export function usePatternTexture(): THREE.CanvasTexture | null {
  const selectedPattern = useCreateStore((s) => s.selectedPattern)
  const textureParams = useCreateStore((s) => s.textureParams)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  // 当纹样切换时重新生成 Canvas 纹理
  const texture = useMemo(() => {
    // 清理旧纹理
    if (textureRef.current) {
      textureRef.current.dispose()
      textureRef.current = null
    }

    if (!selectedPattern) return null

    const canvas = generatePatternCanvas(selectedPattern.generatorConfig)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    textureRef.current = tex
    return tex
  }, [selectedPattern])

  // 当参数变化时更新纹理属性（不重建纹理）
  useEffect(() => {
    if (!texture) return

    // 缩放 → repeat（100% = repeat(1,1)，200% = repeat(0.5, 0.5)）
    const repeatVal = 100 / Math.max(10, textureParams.scale)
    texture.repeat.set(repeatVal, repeatVal)

    // 旋转（度转弧度）
    texture.rotation = (textureParams.rotation * Math.PI) / 180

    // 中心点设为纹理中心（旋转/缩放围绕中心）
    texture.center.set(0.5, 0.5)

    // 偏移（-50~50 映射到 -0.5~0.5）
    texture.offset.set(
      textureParams.offsetX / 100,
      textureParams.offsetY / 100
    )

    // 平铺模式
    switch (textureParams.tiling) {
      case 'repeat':
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        break
      case 'mirror':
        texture.wrapS = THREE.MirroredRepeatWrapping
        texture.wrapT = THREE.MirroredRepeatWrapping
        break
      case 'single':
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        break
    }

    texture.needsUpdate = true
  }, [texture, textureParams])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
      }
    }
  }, [])

  return texture
}
```

---

## Step 3：创建纹理化材质组件

**文件路径：** `src/components/create/TexturedMaterial.tsx`

```typescript
'use client'

/**
 * TexturedMaterial
 *
 * 封装了纹理 + 材质参数的 MeshStandardMaterial，
 * 被所有 ProductModel 共享使用。
 *
 * 职责：
 * 1. 从 useCreateStore 读取 materialParams
 * 2. 从 usePatternTexture 获取动态纹理
 * 3. 组合为完整的 MeshStandardMaterial props
 */
import { useCreateStore } from '@/stores/useCreateStore'
import { usePatternTexture } from '@/hooks/usePatternTexture'
import * as THREE from 'three'

interface Props {
  /** 允许个别产品覆盖某些材质属性 */
  roughnessOverride?: number
  metalnessOverride?: number
  side?: THREE.Side
}

export function TexturedMaterial({
  roughnessOverride,
  metalnessOverride,
  side = THREE.FrontSide,
}: Props) {
  const materialParams = useCreateStore((s) => s.materialParams)
  const textureParams = useCreateStore((s) => s.textureParams)
  const texture = usePatternTexture()

  return (
    <meshStandardMaterial
      color={materialParams.baseColor}
      map={texture}
      transparent
      opacity={textureParams.opacity / 100}
      roughness={(roughnessOverride ?? materialParams.roughness) / 100}
      metalness={(metalnessOverride ?? materialParams.metalness) / 100}
      side={side}
    />
  )
}
```

---

## Step 4：更新产品模型接入纹理材质

对 Round 2 中创建的 6 个模型组件，将硬编码的 `meshStandardMaterial` 替换为 `TexturedMaterial`。

### 4.1 Frame.tsx 修改示意

```diff
+ import { TexturedMaterial } from '../TexturedMaterial'

  {/* 画面主体 */}
  <mesh position={[0, 0, 0]}>
    <planeGeometry args={[2.4, 1.8]} />
-   <meshStandardMaterial
-     color={baseColor}
-     roughness={0.5}
-     metalness={0}
-     side={THREE.DoubleSide}
-   />
+   <TexturedMaterial side={THREE.DoubleSide} />
  </mesh>
```

### 4.2 各模型修改要点

| 模型 | 修改位置 | 特殊处理 |
|------|---------|---------|
| Frame | 画面主体 mesh | `side={THREE.DoubleSide}` |
| Scarf | 丝巾 mesh | `side={THREE.DoubleSide}`, `roughnessOverride={85}` |
| PhoneCase | 壳体 RoundedBox | 仅外壳使用 TexturedMaterial |
| Fan | 扇面 mesh | `side={THREE.DoubleSide}` |
| TeaCup | 杯体 LatheGeometry mesh | `side={THREE.DoubleSide}` |
| TShirt | T恤正面 mesh | `side={THREE.DoubleSide}`, `roughnessOverride={90}` |

> 每个模型只在主表面使用 TexturedMaterial，装饰部件（边框、扇骨、底座等）保留固定材质。

---

## Step 5：纹理缓存管理器（可选优化）

**文件路径：** `src/lib/textures/textureCache.ts`

```typescript
/**
 * 纹理缓存
 * 避免切换纹样时重复生成相同的 Canvas 纹理
 * LRU 策略，最多缓存 10 张
 */
import * as THREE from 'three'
import type { PatternGeneratorConfig } from '@/types/create'
import { generatePatternCanvas } from './generatePattern'

const MAX_CACHE = 10

interface CacheEntry {
  key: string
  texture: THREE.CanvasTexture
  lastAccess: number
}

const cache: CacheEntry[] = []

function configKey(config: PatternGeneratorConfig): string {
  return JSON.stringify(config)
}

export function getCachedTexture(config: PatternGeneratorConfig): THREE.CanvasTexture {
  const key = configKey(config)

  // 命中缓存
  const existing = cache.find((e) => e.key === key)
  if (existing) {
    existing.lastAccess = Date.now()
    return existing.texture
  }

  // 缓存未命中，生成新纹理
  const canvas = generatePatternCanvas(config)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  // LRU 淘汰
  if (cache.length >= MAX_CACHE) {
    cache.sort((a, b) => a.lastAccess - b.lastAccess)
    const evicted = cache.shift()
    evicted?.texture.dispose()
  }

  cache.push({ key, texture, lastAccess: Date.now() })
  return texture
}

export function clearTextureCache() {
  for (const entry of cache) {
    entry.texture.dispose()
  }
  cache.length = 0
}
```

---

## 验证步骤

```bash
# 1. 构建检查
npm run build

# 2. 代码规范
npm run lint

# 3. 手动验证
npm run dev
# 访问 http://localhost:6427/create
```

验证要点：
- [ ] 默认加载的画框上可见「凤鸟云纹」纹理
- [ ] 纹理颜色符合预设（金色+朱砂色 on 深色底）
- [ ] 3D 旋转时纹理正确贴合几何体表面
- [ ] 修改 store 中的 scale 参数后纹理缩放即时变化
- [ ] 修改 rotation 参数后纹理旋转即时变化
- [ ] 切换 tiling 模式（repeat→mirror→single）效果正确
- [ ] 内存无明显泄漏（Chrome DevTools Performance Monitor）
- [ ] 切换产品类型时纹理正确贴合新几何体

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/textures/generatePattern.ts` | 新建 | 6 种纹样程序化生成算法 |
| `src/hooks/usePatternTexture.ts` | 新建 | 纹理参数响应 Hook |
| `src/components/create/TexturedMaterial.tsx` | 新建 | 共享纹理材质组件 |
| `src/lib/textures/textureCache.ts` | 新建 | LRU 纹理缓存（可选） |
| `src/components/create/models/*.tsx` | 修改 | 所有模型接入 TexturedMaterial |

---

## 技术深度说明

### 纹理参数映射关系

| UI 参数 | Three.js 属性 | 映射公式 |
|---------|--------------|---------|
| scale: 100 | texture.repeat(1,1) | repeat = 100 / scale |
| rotation: 90 | texture.rotation | radians = degrees × π/180 |
| offsetX: 25 | texture.offset.x | offset = value / 100 |
| opacity: 85 | material.opacity | opacity = value / 100 |
| tiling: 'mirror' | texture.wrapS/T | 直接映射 Wrapping 枚举 |
| baseColor | material.color | 直接赋值 hex |

### 性能数据预估

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 纹理生成耗时 | < 20ms | 512×512 Canvas 2D 绑定 |
| 参数响应延迟 | < 16ms | 仅修改 texture 属性，无重建 |
| 内存占用 | ~4MB/纹理 | 512×512 RGBA CanvasTexture |
| 缓存总内存 | < 40MB | 10 张缓存上限 |

---

**下一步：执行 Round 4 (`04-pattern-library.md`)**
