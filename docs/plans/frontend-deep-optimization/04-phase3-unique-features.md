# Phase 3: 差异化特性 🚀

> **会话编号**: 7/8  
> **预计时长**: 8小时  
> **依赖**: Phase 1 + Phase 2 完成  
> **优先级**: ⭐⭐⭐

---

## 🎯 本次会话目标

实现竞品没有的核心壁垒功能，建立产品差异化优势。

### 核心特性
1. **真实地图数据**: SVG → 真实地理坐标 + 交互
2. **知识图谱**: 纹样演化关系可视化（D3.js force layout）
3. **颜色搜索**: 基于色彩的纹案发现
4. **PWA 支持**: 添加到主屏幕 + 离线访问

---

## 📋 上下文信息

### 当前资产
- ✅ `src/data/map/hubei-boundaries.json` - 湖北省地理边界数据
- ✅ `src/components/map/HubeiMapClient.tsx` - 地图客户端组件
- ✅ `src/data/mock/regions.ts` - 4个地区数据
- ✅ `src/lib/map/patternGeo.ts` - 地理分析工具

### 对标平台
- **Google Arts & Culture**: 3D 沉浸式展览 + 颜色搜索
- **故宫数字博物馆**: 3D 模型 + 全景漫游
- **大英博物馆**: 详细时间线 + 关系图谱

### HBPattern 的差异化
- ✅ R3F 3D 文创预览（已有）
- ✅ 中国美学设计系统（已有）
- 🎯 真实地理数据可视化（本次实现）
- 🎯 知识图谱关系探索（本次实现）
- 🎯 PWA 离线体验（本次实现）

---

## ✅ 验收标准

### 特性 1: 真实地图
- [ ] 使用 `hubei-boundaries.json` 渲染真实边界
- [ ] 点击省市触发 FlyTo 动画（平滑缩放）
- [ ] 标记点基于真实经纬度定位
- [ ] 点击标记点显示纹案浮窗
- [ ] 热力图显示纹案密度

### 特性 2: 知识图谱
- [ ] 使用 D3.js force simulation
- [ ] 节点代表纹案，边代表关系
- [ ] 支持拖拽节点
- [ ] 点击节点跳转详情页
- [ ] 关系类型有视觉区分（颜色/线型）

### 特性 3: 颜色搜索
- [ ] 色板展示 12 种传统颜色
- [ ] 点击颜色筛选纹案
- [ ] 支持多颜色组合搜索
- [ ] 基于 `pattern.colorPalette` JSON 字段

### 特性 4: PWA
- [ ] manifest.json 完整
- [ ] Service Worker 注册
- [ ] 离线页面可访问
- [ ] 添加到主屏幕提示

---

## 🔧 实施步骤

### 步骤 1: 真实地图数据渲染

#### 1.1 升级 MapCanvas 使用真实边界

**文件**: `src/components/map/MapCanvas.tsx`

**核心修改**:
```tsx
import { motion } from 'motion/react'
import hubeiGeoData from '@/data/map/hubei-boundaries.json'

export function MapCanvas() {
  const [viewport, setViewport] = useState({
    center: [114.3, 30.6], // 湖北中心坐标
    zoom: 1,
  })
  
  // ✅ 解析 GeoJSON 渲染真实边界
  const paths = hubeiGeoData.features.map(feature => {
    const coordinates = feature.geometry.coordinates
    // 将地理坐标转换为 SVG 路径
    return geoToSVGPath(coordinates, viewport)
  })
  
  return (
    <svg className="w-full h-full">
      {/* 渲染边界 */}
      {paths.map((path, i) => (
        <motion.path
          key={i}
          d={path}
          className="fill-rice-warm stroke-cinnabar stroke-1"
          whileHover={{ fill: 'var(--color-cinnabar-light)' }}
        />
      ))}
      
      {/* 渲染标记点 */}
      {patterns.map(pattern => (
        <MapMarker
          key={pattern.id}
          position={latLngToXY(pattern.location, viewport)}
          pattern={pattern}
        />
      ))}
    </svg>
  )
}

// 坐标转换工具
function geoToSVGPath(coordinates: number[][][], viewport) {
  // 使用 d3-geo 进行投影转换
  const projection = d3.geoMercator()
    .center(viewport.center)
    .scale(viewport.zoom * 5000)
  
  return d3.geoPath().projection(projection)(coordinates)
}
```

#### 1.2 添加 FlyTo 动画

**文件**: `src/components/map/MapCanvas.tsx`

```tsx
import { useSpring, animated } from '@react-spring/web'

export function MapCanvas() {
  const [viewport, setViewport] = useState({ center: [114.3, 30.6], zoom: 1 })
  
  // ✅ 平滑动画到目标位置
  const flyTo = (target: { center: [number, number], zoom: number }) => {
    setViewport(target)
  }
  
  const animatedViewport = useSpring({
    center: viewport.center,
    zoom: viewport.zoom,
    config: { tension: 180, friction: 30 },
  })
  
  return (
    <svg>
      {/* 使用 animated 值渲染 */}
    </svg>
  )
}
```

---

### 步骤 2: 知识图谱实现

#### 2.1 安装 D3.js
```bash
npm install d3 @types/d3
```

#### 2.2 创建知识图谱组件

**文件**: `src/components/pattern/KnowledgeGraph.tsx`（新建）

```tsx
'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface Node {
  id: string
  name: string
  imageUrl: string
}

interface Link {
  source: string
  target: string
  type: 'evolved_from' | 'influenced_by' | 'variant_of' | 'same_origin'
}

export function KnowledgeGraph({ 
  nodes, 
  links 
}: { 
  nodes: Node[]
  links: Link[] 
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  
  useEffect(() => {
    if (!svgRef.current) return
    
    const width = 800
    const height = 600
    
    // ✅ 创建 force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
    
    const svg = d3.select(svgRef.current)
    
    // 渲染边
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => getLinkColor(d.type))
      .attr('stroke-width', 2)
    
    // 渲染节点
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation))
    
    // 节点圆形
    node.append('circle')
      .attr('r', 30)
      .attr('fill', 'var(--color-cinnabar)')
    
    // 节点图片
    node.append('image')
      .attr('xlink:href', d => d.imageUrl)
      .attr('x', -25)
      .attr('y', -25)
      .attr('width', 50)
      .attr('height', 50)
      .attr('clip-path', 'circle(25px)')
    
    // 节点文字
    node.append('text')
      .text(d => d.name)
      .attr('y', 45)
      .attr('text-anchor', 'middle')
    
    // ✅ 每帧更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })
  }, [nodes, links])
  
  return <svg ref={svgRef} className="w-full h-[600px]" />
}

// 关系类型颜色
function getLinkColor(type: string) {
  const colors = {
    evolved_from: 'var(--color-gold)',
    influenced_by: 'var(--color-cinnabar-light)',
    variant_of: 'var(--color-ink-light)',
    same_origin: 'var(--color-gold-light)',
  }
  return colors[type] || 'var(--color-ink-faint)'
}

// 拖拽支持
function drag(simulation) {
  return d3.drag()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', (event, d) => {
      d.fx = event.x
      d.fy = event.y
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    })
}
```

#### 2.3 集成到详情页

**文件**: `src/app/(main)/gallery/[id]/page.tsx`

```tsx
import { KnowledgeGraph } from '@/components/pattern/KnowledgeGraph'

export default async function PatternDetailPage({ params }) {
  const pattern = await getPattern(params.id)
  const relations = await getPatternRelations(params.id)
  
  // ✅ 构建图数据
  const nodes = [
    { id: pattern.id, name: pattern.name, imageUrl: pattern.imageUrl },
    ...relations.map(r => ({
      id: r.targetId,
      name: r.targetName,
      imageUrl: r.targetImageUrl,
    })),
  ]
  
  const links = relations.map(r => ({
    source: pattern.id,
    target: r.targetId,
    type: r.relationType,
  }))
  
  return (
    <>
      {/* ... 其他内容 */}
      
      <section className="container py-20">
        <h2 className="text-3xl font-serif mb-8">演化关系图谱</h2>
        <KnowledgeGraph nodes={nodes} links={links} />
      </section>
    </>
  )
}
```

---

### 步骤 3: 颜色搜索

#### 3.1 定义传统色彩

**文件**: `src/data/traditional-colors.ts`（新建）

```typescript
export const TRADITIONAL_COLORS = [
  { name: '朱砂', hex: '#b84a39', keywords: ['红', '朱'] },
  { name: '烫金', hex: '#c9a84c', keywords: ['金', '黄'] },
  { name: '靛蓝', hex: '#2e4e7e', keywords: ['蓝', '靛'] },
  { name: '石青', hex: '#1d8bab', keywords: ['青', '蓝'] },
  { name: '竹绿', hex: '#4a7c59', keywords: ['绿', '青'] },
  { name: '藕荷', hex: '#d4796a', keywords: ['粉', '红'] },
  { name: '月白', hex: '#d5e3f0', keywords: ['白', '淡'] },
  { name: '墨色', hex: '#1a1a14', keywords: ['黑', '墨'] },
  { name: '香色', hex: '#ede7d9', keywords: ['米', '黄'] },
  { name: '银红', hex: '#e8757a', keywords: ['红', '粉'] },
  { name: '秋香色', hex: '#d9a859', keywords: ['黄', '褐'] },
  { name: '豆绿', hex: '#91ad70', keywords: ['绿', '嫩'] },
]
```

#### 3.2 创建颜色搜索组件

**文件**: `src/components/search/ColorSearch.tsx`（新建）

```tsx
'use client'

import { useState } from 'react'
import { TRADITIONAL_COLORS } from '@/data/traditional-colors'
import { motion } from 'motion/react'

export function ColorSearch({ 
  onSearch 
}: { 
  onSearch: (colors: string[]) => void 
}) {
  const [selected, setSelected] = useState<string[]>([])
  
  const toggle = (hex: string) => {
    const next = selected.includes(hex)
      ? selected.filter(c => c !== hex)
      : [...selected, hex]
    
    setSelected(next)
    onSearch(next)
  }
  
  return (
    <div>
      <h3 className="font-serif text-xl mb-4">按颜色搜索</h3>
      <div className="grid grid-cols-6 gap-4">
        {TRADITIONAL_COLORS.map(color => (
          <motion.button
            key={color.hex}
            onClick={() => toggle(color.hex)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div
              className="w-16 h-16 rounded-lg shadow-card"
              style={{ backgroundColor: color.hex }}
            />
            {selected.includes(color.hex) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center"
              >
                ✓
              </motion.div>
            )}
            <p className="text-xs mt-1">{color.name}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
```

#### 3.3 集成到画廊页

**文件**: `src/components/gallery/GalleryClient.tsx`

```tsx
import { ColorSearch } from '@/components/search/ColorSearch'

export function GalleryClient() {
  const handleColorSearch = (colors: string[]) => {
    // 更新 URL 参数
    const params = new URLSearchParams(searchParams)
    if (colors.length > 0) {
      params.set('colors', colors.join(','))
    } else {
      params.delete('colors')
    }
    router.push(`/gallery?${params}`)
  }
  
  return (
    <>
      <FilterPanel>
        <ColorSearch onSearch={handleColorSearch} />
      </FilterPanel>
      {/* ... */}
    </>
  )
}
```

---

### 步骤 4: PWA 支持

#### 4.1 创建 manifest.json

**文件**: `public/manifest.json`（新建）

```json
{
  "name": "湖北纹案文化展示平台",
  "short_name": "湖北纹案",
  "description": "传承荆楚文化，展示传统纹绣之美",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f5f0e8",
  "theme_color": "#b84a39",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 4.2 链接 manifest

**文件**: `src/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  // ... 现有 metadata
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '湖北纹案',
  },
}
```

#### 4.3 创建 Service Worker

**文件**: `public/sw.js`（新建）

```javascript
const CACHE_NAME = 'hbpattern-v1'
const STATIC_CACHE = [
  '/',
  '/gallery',
  '/map',
  '/manifest.json',
  '/fonts/Noto-Serif-SC.woff2',
  '/fonts/Noto-Sans-SC.woff2',
]

// 安装
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_CACHE))
  )
})

// 激活
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
})

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
    })
  )
})
```

#### 4.4 注册 Service Worker

**文件**: `src/app/layout.tsx`

```tsx
export default function RootLayout({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])
  
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

---

## 📁 涉及文件清单

### 需要创建
- 📄 `src/components/pattern/KnowledgeGraph.tsx`
- 📄 `src/components/search/ColorSearch.tsx`
- 📄 `src/data/traditional-colors.ts`
- 📄 `public/manifest.json`
- 📄 `public/sw.js`
- 📄 `public/icons/` - 8 个尺寸的图标

### 需要修改
- ✏️ `src/components/map/MapCanvas.tsx`
- ✏️ `src/components/gallery/GalleryClient.tsx`
- ✏️ `src/app/(main)/gallery/[id]/page.tsx`
- ✏️ `src/app/layout.tsx`

---

## 🧪 验证方法

```bash
# 1. 测试真实地图
# 访问 /map
# 预期: 看到真实湖北省边界
# 点击武汉区域，地图平滑缩放到武汉

# 2. 测试知识图谱
# 访问任意纹案详情页
# 预期: 看到关系图谱，可以拖拽节点

# 3. 测试颜色搜索
# 访问 /gallery
# 点击"朱砂"颜色
# 预期: URL 变为 /gallery?colors=#b84a39
# 预期: 筛选出包含朱砂色的纹案

# 4. 测试 PWA
# Chrome DevTools > Application > Manifest
# 预期: manifest.json 正确加载
# Chrome DevTools > Application > Service Workers
# 预期: Service Worker 已注册
# 点击浏览器地址栏的"安装"按钮
# 预期: 可以添加到主屏幕
```

---

## ⚠️ 注意事项

### D3.js 性能
- 节点数 > 50 时考虑虚拟化
- 使用 `requestAnimationFrame` 优化渲染

### PWA 图标
- 需要 8 个尺寸的图标文件
- 可以使用工具自动生成: https://realfavicongenerator.net/

### Service Worker 更新
- 修改 `CACHE_NAME` 版本号触发更新
- 生产环境需要更智能的缓存策略

---

## 🎉 完成标志

- [x] 真实地图渲染正常
- [x] 知识图谱可交互
- [x] 颜色搜索可用
- [x] PWA 可添加到主屏幕

**完成后** → 继续 `08-performance-tuning.md` ⚡
