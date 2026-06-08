# Phase 1: 核心交互打通 🔥

> **会话编号**: 2/8  
> **预计时长**: 8小时  
> **依赖**: Phase 0 完成  
> **优先级**: ⭐⭐⭐⭐⭐ CRITICAL

---

## 🎯 本次会话目标

打通三大核心数据流链路，让 UI 操作真正驱动视觉和数据变化。

### 核心链路
1. **画廊筛选链路**: FilterPanel → URL params → TanStack Query → DB → UI 更新
2. **3D 参数链路**: Slider → Zustand store → Canvas3D → Three.js 材质 → 实时反馈
3. **导出链路**: Workshop Canvas → canvasEngine → toDataURL → 下载

### 具体目标
- 画廊筛选/排序/分页全部可用
- 3D 创作中心参数实时反映到模型
- Workshop 导出功能正常
- 首页从 Mock 切换到真实 API

---

## 📋 上下文信息

### 当前状态
- ✅ Zustand stores 已创建（`useCreateStore`, `useWorkshopStore`）
- ✅ TanStack Query 已安装（`@tanstack/react-query@^5`）
- ✅ Three.js 材质组件已存在（`TexturedMaterial.tsx`）
- ✅ Canvas 引擎已实现（`canvasEngine.ts`, `layerCompositor.ts`）
- ⚠️ 但所有链路都是断开的！

### 技术栈确认

- **状态管理**: Zustand 5.0.12
- **数据获取**: TanStack Query 5.96.0
- **3D 渲染**: React Three Fiber 9.6.1 + Three.js 0.170.0
- **路由**: Next.js 16.2.1 App Router (useSearchParams, useRouter)
- **数据库**: Prisma Client (已生成) + PostgreSQL

### Mock 数据位置
- `src/data/mock/patterns.ts` - 6条纹案数据
- `src/data/mock/regions.ts` - 4个地区数据
- `src/data/mock/stats.ts` - 统计数据

---

## ✅ 验收标准

### 链路 1: 画廊筛选
- [ ] 筛选 checkbox 点击后 URL 参数更新（如 `?era=楚文化&region=武汉`）
- [ ] URL 参数变化触发 API 请求（可在 Network 面板看到）
- [ ] 筛选结果正确显示在画廊页
- [ ] 排序下拉菜单可用（最新/最热/随机）
- [ ] 分页按钮可用（每页24条）
- [ ] 清除筛选按钮可用

### 链路 2: 3D 参数
- [ ] 拖动缩放滑块，3D 模型纹理尺寸实时变化
- [ ] 拖动旋转滑块，3D 模型纹理角度实时变化
- [ ] 拖动透明度滑块，3D 模型纹理透明度实时变化
- [ ] 切换纹样，3D 模型纹理图案实时切换
- [ ] 所有参数变化 <100ms 反映到画面

### 链路 3: Workshop 导出
- [ ] 点击导出按钮，弹出导出对话框
- [ ] 选择格式（PNG/JPEG/SVG），可正常下载
- [ ] 导出的文件包含当前 Canvas 的全部图层
- [ ] 导出分辨率可选（1x/2x/4x）

### 数据替换
- [ ] 首页精选纹案从真实 API 获取（不再是 Mock）
- [ ] 画廊页数据从真实 API 获取
- [ ] API 报错时有友好提示（而非白屏）

---

## 🔧 实施步骤

### 步骤 1: 设置 TanStack Query Provider

**文件**: `src/app/layout.tsx`

**任务**: 包裹 QueryClientProvider

```tsx
// 在文件顶部添加
import { QueryProvider } from '@/components/providers/QueryProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
```

**文件**: `src/components/providers/QueryProvider.tsx`（已存在，检查内容）

**期望内容**:
```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1分钟
        refetchOnWindowFocus: false,
      },
    },
  }))
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

### 步骤 2: 创建 API 客户端和 Hooks

#### 2.1 创建通用 fetcher

**文件**: `src/lib/api/fetcher.ts`（已存在，检查内容）


**期望内容**:
```tsx
export async function fetcher<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init)
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  
  return res.json()
}
```

#### 2.2 创建 usePatterns Hook

**文件**: `src/hooks/queries/usePatterns.ts`（已存在）

**增强内容**:
```tsx
import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api/fetcher'

interface PatternsFilters {
  era?: string
  region?: string
  technique?: string
  color?: string
  sort?: 'latest' | 'popular' | 'random'
  limit?: number
  offset?: number
}

export function usePatterns(filters: PatternsFilters = {}) {
  return useQuery({
    queryKey: ['patterns', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value))
      })
      return fetcher(`/api/patterns?${params}`)
    },
  })
}
```

---

### 步骤 3: 实现画廊筛选链路

**文件**: `src/components/gallery/GalleryClient.tsx`

**核心修改**:
```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { usePatterns } from '@/hooks/queries/usePatterns'

export function GalleryClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // ✅ 从 URL 读取筛选条件
  const filters = {
    era: searchParams.get('era') || undefined,
    region: searchParams.get('region') || undefined,
    sort: (searchParams.get('sort') as any) || 'latest',
  }
  
  // ✅ 使用 TanStack Query 获取数据
  const { data, isLoading, error } = usePatterns(filters)
  
  // ✅ 更新筛选条件
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/gallery?${params}`)
  }
  
  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>
  
  return (
    <div className="flex gap-8">
      {/* 筛选面板 */}
      <FilterPanel filters={filters} onChange={updateFilter} />
      
      {/* 画廊网格 */}
      <div className="masonry-grid flex-1">
        {data?.patterns.map(pattern => (
          <PatternCard key={pattern.id} pattern={pattern} />
        ))}
      </div>
    </div>
  )
}
```

---

### 步骤 4: 打通 3D 参数链路

**文件**: `src/components/create/ParameterPanel.tsx`

**核心修改**:
```tsx
import { useCreateStore } from '@/stores/useCreateStore'

export function ParameterPanel() {
  const { params, setParam } = useCreateStore()
  
  return (
    <div className="space-y-4">
      <ParameterSlider
        label="缩放"
        value={params.scale}
        onChange={(v) => setParam('scale', v)}
        min={0}
        max={200}
      />
      
      <ParameterSlider
        label="旋转"
        value={params.rotation}
        onChange={(v) => setParam('rotation', v)}
        min={0}
        max={360}
      />
      
      <ParameterSlider
        label="透明度"
        value={params.opacity}
        onChange={(v) => setParam('opacity', v)}
        min={0}
        max={100}
      />
    </div>
  )
}
```

**文件**: `src/components/create/TexturedMaterial.tsx`

**核心修改**:
```tsx
import { useCreateStore } from '@/stores/useCreateStore'

export function TexturedMaterial() {
  const { params, selectedPattern } = useCreateStore()
  
  // ✅ 实时响应参数变化
  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uScale: { value: params.scale / 100 },
    uRotation: { value: (params.rotation * Math.PI) / 180 },
    uOpacity: { value: params.opacity / 100 },
  }), [texture, params.scale, params.rotation, params.opacity])
  
  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent
    />
  )
}
```

---

### 步骤 5: 实现 Workshop 导出

**文件**: `src/components/workshop/ExportButton.tsx`

**增强内容**:
```tsx
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { exportCanvas } from '@/lib/workshop/exportUtils'

export function ExportButton() {
  const canvasRef = useWorkshopStore(s => s.canvasRef)
  const [isOpen, setIsOpen] = useState(false)
  
  const handleExport = async (format: 'png' | 'jpeg' | 'svg', scale: number) => {
    if (!canvasRef.current) return
    
    const blob = await exportCanvas(canvasRef.current, format, scale)
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `pattern-${Date.now()}.${format}`
    a.click()
    
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }
  
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary">
        导出作品
      </button>
      
      <ExportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onExport={handleExport}
      />
    </>
  )
}
```

**文件**: `src/lib/workshop/exportUtils.ts`（已存在，检查并增强）

---

### 步骤 6: 替换首页 Mock 数据

**文件**: `src/app/(main)/page.tsx`

**修改**:
```tsx
// 删除
import { mockPatterns } from '@/data/mock/patterns'

// 添加
import { getFeaturedPatterns } from '@/lib/queries'

export default async function HomePage() {
  // ✅ 从真实 API 获取
  const featuredPatterns = await getFeaturedPatterns({ limit: 6 })
  
  return (
    <>
      {/* Hero */}
      <section>{/* ... */}</section>
      
      {/* 精选纹案 */}
      <section>
        <div className="grid grid-cols-3 gap-6">
          {featuredPatterns.map(pattern => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      </section>
    </>
  )
}
```

**文件**: `src/lib/queries.ts`（已存在，增强）

```tsx
import { db } from './db'

export async function getFeaturedPatterns({ limit = 6 }) {
  return db.pattern.findMany({
    where: { status: 'featured' },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
}
```

---

## 📁 涉及文件清单

### 新建文件
- 无（所有基础设施已存在）

### 需要修改的文件
- ✏️ `src/app/layout.tsx` - 添加 QueryProvider
- ✏️ `src/components/gallery/GalleryClient.tsx` - 实现筛选链路
- ✏️ `src/components/create/ParameterPanel.tsx` - 连接 store
- ✏️ `src/components/create/TexturedMaterial.tsx` - 响应参数
- ✏️ `src/components/workshop/ExportButton.tsx` - 实现导出
- ✏️ `src/app/(main)/page.tsx` - 替换 Mock
- ✏️ `src/lib/queries.ts` - 增强查询函数
- ✏️ `src/hooks/queries/usePatterns.ts` - 增强 Hook

### 需要检查的文件
- 🔍 `src/lib/api/fetcher.ts`
- 🔍 `src/components/providers/QueryProvider.tsx`
- 🔍 `src/lib/workshop/exportUtils.ts`
- 🔍 `src/stores/useCreateStore.ts`
- 🔍 `src/stores/useWorkshopStore.ts`

---

## 🧪 验证方法

### 自动化验证
```bash
npm run build
npm run lint
npm run test
```

### 手动验证 - 画廊筛选
```bash
# 1. 访问画廊页
http://localhost:6427/gallery

# 2. 点击"楚文化"筛选
# 预期: URL 变为 /gallery?era=楚文化
# 预期: 画廊只显示楚文化纹案
# 预期: 在 Network 看到 GET /api/patterns?era=楚文化

# 3. 点击"武汉"筛选
# 预期: URL 变为 /gallery?era=楚文化&region=武汉
# 预期: 画廊只显示楚文化+武汉的纹案

# 4. 点击"清除筛选"
# 预期: URL 变为 /gallery
# 预期: 画廊显示全部纹案
```

### 手动验证 - 3D 参数
```bash
# 1. 访问 AI 创作中心
http://localhost:6427/create

# 2. 拖动"缩放"滑块
# 预期: 3D 模型上的纹理尺寸实时变化
# 预期: 变化延迟 <100ms（感觉流畅）

# 3. 拖动"旋转"滑块
# 预期: 3D 模型上的纹理角度实时变化

# 4. 切换纹样
# 预期: 3D 模型纹理图案立即切换
```

### 手动验证 - Workshop 导出
```bash
# 1. 访问跨界工坊
http://localhost:6427/workshop

# 2. 点击"导出作品"
# 预期: 弹出导出对话框

# 3. 选择 PNG 格式，2x 分辨率
# 预期: 浏览器下载文件
# 预期: 打开文件，看到当前 Canvas 内容
```

---

## ⚠️ 注意事项

### 潜在问题

**问题 1**: useSearchParams 导致整个页面变成 Client Component
```
Solution: 将 GalleryClient 作为独立的 Client Component
父页面保持 Server Component
```

**问题 2**: Zustand store 更新但 Three.js 没响应
```
Solution: 检查 TexturedMaterial 是否正确订阅 store
确保使用 useMemo 缓存 uniforms
```

**问题 3**: 导出的 Canvas 是空白的
```
Solution: 确保 canvasRef 正确绑定到 Canvas 元素
检查 toDataURL() 调用时机（需要渲染完成后）
```

---

## 📊 完成后的状态

### 修复前
```
交互链路: 0/3 打通
数据来源: 100% Mock
实时反馈: 无
功能可用度: 20%
```

### 修复后
```
交互链路: 3/3 打通 ✅
数据来源: 80% 真实API ✅
实时反馈: <100ms ✅
功能可用度: 70%
```

---

## 🎉 完成标志

- [x] 画廊筛选全部可用
- [x] 3D 参数实时反馈
- [x] Workshop 导出正常
- [x] 首页使用真实 API
- [x] 所有验收标准通过

**完成后** → 继续 `05-motion-integration.md` ✨
