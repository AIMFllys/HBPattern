# Round 2 — 真实 Supabase 纹样面板 + 搜索/筛选

## 目标
将右侧纹样面板从硬编码假数据替换为 **Supabase 真实数据**，实现：
1. SSR 首屏渲染纹样列表（从 `getPatterns()` 服务端查询）
2. 客户端搜索、时代筛选、滚动加载
3. 纹样卡片显示真实缩略图、名称、时代、技法、色板
4. 选中纹样后存入 Store

**本轮完成后：** 右侧面板展示真实数据库中的纹样，可搜索、筛选、选择。

---

## 上下文摘要（执行前必读）

| 项目 | 值 |
|------|------|
| 数据源 | Supabase `hp_patterns` 表，通过 `hp_pattern_media` 关联图片 |
| 服务端查询 | `getPatterns(opts)` in `src/lib/queries.ts` — 返回 `PatternListItem[]` |
| 客户端查询 | `usePatterns(params)` in `src/hooks/queries/usePatterns.ts` — React Query |
| 图片字段 | `media[0].url` (原图), `media[0].thumbnail_url` (缩略图) |
| 其他字段 | `name`, `era`, `region.name`, `technique.name`, `color_palette[]`, `tags[]` |
| 图片域名 | `*.supabase.co`（`next.config.ts` 已配置 `remotePatterns`） |
| Store | `useWorkshopStore` 已有 `selectedSourcePattern`, `patternSearchQuery`, `patternFilterEra` |
| 色彩方案 | 工坊主色 `gold`（与 create 的 `cinnabar` 区分） |
| 画廊参考 | `GalleryClient.tsx` 已实现 Supabase 纹样展示 + URL 筛选，可参考数据消费模式 |

---

## 核心设计决策

### SSR + CSR 混合数据策略

```
首次加载：
  Server Component (page.tsx)
    ↓ getPatterns({ limit: 20 }) — SSR 预取前 20 条
    ↓ 传递给 Client Component
  Client Component (WorkshopClient.tsx)
    ↓ 用 SSR 数据作为初始数据（无加载闪烁）
    ↓ 搜索/筛选时用 usePatterns() Client-side 查询

后续交互：
  用户输入搜索词 / 选择时代筛选
    ↓ usePatterns({ q, era }) — React Query 请求 /api/patterns
    ↓ 面板即时更新（带 loading 状态）
```

### 为什么不用 Gallery 的 URL 参数模式？

Gallery 用 `searchParams` + `router.push` 因为它是全页面级筛选。
Workshop 的筛选仅作用于右侧面板（局部），不应改变 URL 路径，
因此使用 **Zustand store + React Query** 的组合。

---

## Step 1：重构 Workshop 页面为 SSR + CSR 混合

**文件路径：** `src/app/(main)/workshop/page.tsx`

将 Workshop 页面拆分为：
- **Server Component** (`page.tsx`) — 预取纹样数据
- **Client Component** (`WorkshopClient.tsx`) — 交互逻辑

```typescript
/**
 * Workshop Page — Server Component
 * 预取纹样数据实现 SSR，避免首屏加载闪烁
 */
import { getPatterns } from '@/lib/queries'
import WorkshopClient from '@/components/workshop/WorkshopClient'

export default async function WorkshopPage() {
  // SSR 预取前 20 条纹样
  const { patterns: initialPatterns, total } = await getPatterns({
    limit: 20,
    sort: 'newest',
  })

  return (
    <WorkshopClient
      initialPatterns={initialPatterns}
      initialTotal={total}
    />
  )
}
```

**设计决策：**
- `page.tsx` 变为极简的 Server Component（无 `'use client'`）
- 所有交互逻辑移到 `WorkshopClient`
- SSR 数据作为 `initialPatterns` prop 传入
- 保留现有 `layout.tsx` 的 metadata 不变

---

## Step 2：创建 Workshop 客户端主组件

**文件路径：** `src/components/workshop/WorkshopClient.tsx`

```typescript
'use client'

/**
 * WorkshopClient — 工坊客户端主容器
 *
 * 临时版本（Round 2）：只包含 SiteHeader + 画布占位 + 纹样面板
 * Round 5 中将集成完整工具栏 + Canvas 引擎 + 参数面板
 */
import { useState } from 'react'
import SiteHeader from '@/components/layout/SiteHeader'
import { Icon } from '@/components/icons/Icon'
import { PatternAssetPanel } from './PatternAssetPanel'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAuthModal } from '@/stores/useAuthModal'
import type { PatternListItem } from '@/types/pattern'

interface Props {
  initialPatterns: PatternListItem[]
  initialTotal: number
}

export default function WorkshopClient({ initialPatterns, initialTotal }: Props) {
  const selectedSourcePattern = useWorkshopStore((s) => s.selectedSourcePattern)
  const user = useAuthStore((s) => s.user)
  const { openModal } = useAuthModal()

  function requireAuth(message: string, action: () => void) {
    if (!user) { openModal(message); return }
    action()
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-rice">
      <SiteHeader logoIcon="grid_view" siteName="纹样+ 跨界创作工坊" primaryColor="gold" />

      <main className="flex flex-1 overflow-hidden relative">
        {/* 中央画布区域（临时占位，Round 3 替换为 Canvas） */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-rice-warm">
          {/* 面包屑 */}
          <div className="absolute top-4 left-6 flex items-center gap-2 text-sm">
            <span className="text-gold/60">跨界工坊</span>
            <Icon name="chevron_right" size={12} className="text-ink-faint" />
            <span className="text-ink font-bold">
              {selectedSourcePattern?.name ?? '选择纹样开始创作'}
            </span>
          </div>

          {/* 画布占位 */}
          <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center bg-white rounded-2xl shadow-card border border-rice-deep">
            {selectedSourcePattern ? (
              <PatternPreviewPlaceholder pattern={selectedSourcePattern} />
            ) : (
              <div className="text-center">
                <Icon name="brush" size={56} className="text-gold/30 mx-auto mb-4" />
                <p className="text-ink-light text-base font-bold">选择右侧纹样开始创作</p>
                <p className="text-ink-faint text-sm mt-1">
                  从纹样库中选择素材，加载到画布进行深度再创作
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 纹样素材面板 */}
        <PatternAssetPanel
          initialPatterns={initialPatterns}
          initialTotal={initialTotal}
        />
      </main>
    </div>
  )
}

/**
 * 纹样预览占位组件（Round 3 替换为 Canvas 渲染）
 * 临时使用 <img> 显示选中纹样的图片
 */
function PatternPreviewPlaceholder({ pattern }: { pattern: PatternListItem }) {
  const imageUrl = pattern.media?.[0]?.url
  const palette = pattern.color_palette ?? []

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={pattern.name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-md"
          crossOrigin="anonymous"
        />
      ) : (
        <PatternColorFallback palette={palette} name={pattern.name} />
      )}
    </div>
  )
}

/** 无图片时使用色板渐变作为占位 */
function PatternColorFallback({ palette, name }: { palette: string[]; name: string }) {
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bgRef.current && palette.length > 0) {
      bgRef.current.style.background = palette.length >= 2
        ? `linear-gradient(135deg, ${palette.join(', ')})`
        : palette[0] ?? '#ede7d9'
    }
  }, [palette])

  return (
    <div ref={bgRef} className="w-64 h-64 rounded-xl flex items-center justify-center shadow-md">
      <span className="text-white/80 text-lg font-serif font-bold drop-shadow-sm">{name}</span>
    </div>
  )
}

import { useRef, useEffect } from 'react'
```

---

## Step 3：创建纹样素材面板

**文件路径：** `src/components/workshop/PatternAssetPanel.tsx`

```typescript
'use client'

/**
 * PatternAssetPanel — 真实 Supabase 纹样素材面板
 *
 * 核心功能：
 * 1. SSR 初始数据 + 客户端搜索/筛选
 * 2. 真实缩略图显示
 * 3. 时代/技法分类筛选
 * 4. 关键词搜索（防抖）
 * 5. 选中纹样 → Store → 画布加载
 *
 * 数据源：
 * - 初始数据：SSR props (initialPatterns)
 * - 交互数据：usePatterns() React Query hook → /api/patterns
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { usePatterns } from '@/hooks/queries/usePatterns'
import type { PatternListItem } from '@/types/pattern'
import { PatternAssetCard } from './PatternAssetCard'

/** 时代筛选项 — 与 GalleryClient 保持一致 */
const ERA_FILTERS = ['全部', '战国', '汉代', '明清', '清代', '近现代', '当代']

interface Props {
  initialPatterns: PatternListItem[]
  initialTotal: number
}

export function PatternAssetPanel({ initialPatterns, initialTotal }: Props) {
  // ── Store ──────────────────────────────────────────────
  const selectedPattern = useWorkshopStore((s) => s.selectedSourcePattern)
  const setSelectedPattern = useWorkshopStore((s) => s.setSelectedSourcePattern)
  const searchQuery = useWorkshopStore((s) => s.patternSearchQuery)
  const setSearchQuery = useWorkshopStore((s) => s.setPatternSearchQuery)
  const filterEra = useWorkshopStore((s) => s.patternFilterEra)
  const setFilterEra = useWorkshopStore((s) => s.setPatternFilterEra)

  // ── 搜索防抖 ──────────────────────────────────────────
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(debounceTimer.current)
  }, [searchQuery])

  // ── 是否需要客户端查询 ─────────────────────────────────
  const needsClientQuery = debouncedQuery.trim().length > 0 || filterEra !== null

  // ── React Query（仅在有筛选条件时启用）──────────────────
  const { data: queryResult, isLoading, isFetching } = usePatterns(
    needsClientQuery
      ? {
          q: debouncedQuery || undefined,
          era: filterEra ?? undefined,
          limit: 30,
        }
      : // 不传参时禁用查询，使用 SSR 初始数据
        { limit: 30 }
  )

  // ── 显示数据源 ─────────────────────────────────────────
  const patterns = needsClientQuery
    ? (queryResult?.data ?? [])
    : initialPatterns
  const total = needsClientQuery
    ? (queryResult?.meta?.total ?? 0)
    : initialTotal

  // ── 选中纹样 ──────────────────────────────────────────
  const handleSelectPattern = useCallback(
    (pattern: PatternListItem) => {
      setSelectedPattern(
        selectedPattern?.id === pattern.id ? null : pattern
      )
    },
    [selectedPattern, setSelectedPattern]
  )

  // ── 筛选时代 ──────────────────────────────────────────
  const handleEraFilter = useCallback(
    (era: string) => {
      setFilterEra(era === '全部' ? null : era)
    },
    [setFilterEra]
  )

  return (
    <aside className="w-80 lg:w-96 border-l border-rice-deep/50 flex-col bg-white hidden lg:flex">
      {/* 标题区 */}
      <div className="p-5 border-b border-rice-deep/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Icon name="auto_awesome" className="text-gold" />
            纹样素材库
          </h2>
          <span className="text-xs font-bold bg-gold/10 text-gold px-2 py-0.5 rounded">
            {total} 件
          </span>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-3">
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            id="workshop-pattern-search"
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-rice-warm border border-rice-deep rounded-lg text-sm
                       focus:ring-1 focus:ring-gold/30 focus:border-gold/30
                       placeholder:text-ink-faint transition-all"
            placeholder="搜索纹样名称…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* 时代筛选 */}
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {ERA_FILTERS.map((era) => {
            const isActive = filterEra === null ? era === '全部' : filterEra === era
            return (
              <button
                key={era}
                onClick={() => handleEraFilter(era)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  isActive
                    ? 'bg-gold text-white shadow-sm'
                    : 'bg-rice-warm text-ink-light hover:bg-rice-deep/60 hover:text-ink-medium'
                }`}
              >
                {era}
              </button>
            )
          })}
        </div>
      </div>

      {/* 纹样网格 */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-3" />
            <p className="text-sm text-ink-faint">加载纹样…</p>
          </div>
        ) : patterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-ink-faint">
            <Icon name="search_off" size={32} className="mb-2" />
            <p className="text-sm">未找到匹配的纹样</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setFilterEra(null) }}
              className="mt-2 text-xs text-gold hover:text-gold-dark"
            >
              清除筛选
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {patterns.map((pattern) => (
              <PatternAssetCard
                key={pattern.id}
                pattern={pattern}
                isSelected={selectedPattern?.id === pattern.id}
                onSelect={handleSelectPattern}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部选中信息 */}
      <div className="p-4 border-t border-rice-deep/30 bg-rice-warm/30">
        {selectedPattern ? (
          <SelectedPatternInfo pattern={selectedPattern} />
        ) : (
          <p className="text-sm text-ink-faint text-center">选择纹样素材开始创作</p>
        )}
      </div>
    </aside>
  )
}

/** 底部选中纹样详情 */
function SelectedPatternInfo({ pattern }: { pattern: PatternListItem }) {
  const palette = pattern.color_palette ?? []

  return (
    <div className="flex items-center gap-3">
      <PatternThumb pattern={pattern} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ink truncate">{pattern.name}</p>
        <p className="text-xs text-ink-faint">
          {pattern.era ?? ''} · {pattern.region?.name ?? ''} · {pattern.technique?.name ?? ''}
        </p>
      </div>
      {/* 色板 */}
      <div className="flex gap-1 flex-shrink-0">
        {palette.slice(0, 4).map((color, i) => (
          <ColorDot key={i} color={color} />
        ))}
      </div>
    </div>
  )
}

/** 小缩略图（使用 ref 设置背景避免 inline style） */
function PatternThumb({ pattern }: { pattern: PatternListItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const thumbUrl = pattern.media?.[0]?.thumbnail_url ?? pattern.media?.[0]?.url

  useEffect(() => {
    if (ref.current) {
      if (thumbUrl) {
        ref.current.style.backgroundImage = `url("${thumbUrl}")`
        ref.current.style.backgroundSize = 'cover'
        ref.current.style.backgroundPosition = 'center'
      } else {
        ref.current.style.backgroundColor = pattern.color_palette?.[0] ?? '#ede7d9'
      }
    }
  }, [thumbUrl, pattern.color_palette])

  return (
    <div ref={ref} className="w-10 h-10 rounded-lg border border-rice-deep flex-shrink-0" />
  )
}

/** 色板圆点（ref 方案避免 inline style） */
function ColorDot({ color }: { color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.style.backgroundColor = color }, [color])
  return <div ref={ref} className="w-3.5 h-3.5 rounded-full border border-white shadow-sm" />
}

import { useRef, useEffect } from 'react'
```

---

## Step 4：创建纹样素材卡片

**文件路径：** `src/components/workshop/PatternAssetCard.tsx`

```typescript
'use client'

/**
 * PatternAssetCard — 单个纹样素材卡片
 *
 * 显示：真实缩略图 + 名称 + 时代标签
 * 交互：点击选中/取消，hover 放大预览
 *
 * 图片策略：
 * - 优先使用 thumbnail_url（小尺寸，快速加载）
 * - 降级到 media[0].url
 * - 再降级到 color_palette 渐变占位
 */
import { memo, useRef, useEffect, useState } from 'react'
import type { PatternListItem } from '@/types/pattern'

interface Props {
  pattern: PatternListItem
  isSelected: boolean
  onSelect: (pattern: PatternListItem) => void
}

export const PatternAssetCard = memo(function PatternAssetCard({
  pattern,
  isSelected,
  onSelect,
}: Props) {
  const imageRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const thumbnailUrl = pattern.media?.[0]?.thumbnail_url ?? pattern.media?.[0]?.url
  const palette = pattern.color_palette ?? []

  // 使用 ref 设置背景图（避免 inline style lint 违规）
  useEffect(() => {
    if (!imageRef.current) return

    if (thumbnailUrl) {
      // 预加载图片
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (imageRef.current) {
          imageRef.current.style.backgroundImage = `url("${thumbnailUrl}")`
          imageRef.current.style.backgroundSize = 'cover'
          imageRef.current.style.backgroundPosition = 'center'
          setImageLoaded(true)
        }
      }
      img.onerror = () => {
        // 加载失败，使用色板渐变
        if (imageRef.current && palette.length > 0) {
          imageRef.current.style.background = palette.length >= 2
            ? `linear-gradient(135deg, ${palette.join(', ')})`
            : palette[0] ?? '#ede7d9'
        }
      }
      img.src = thumbnailUrl
    } else if (palette.length > 0) {
      // 无图片，使用色板渐变
      imageRef.current.style.background = palette.length >= 2
        ? `linear-gradient(135deg, ${palette.join(', ')})`
        : palette[0] ?? '#ede7d9'
    }
  }, [thumbnailUrl, palette])

  return (
    <button
      id={`workshop-pattern-${pattern.id}`}
      type="button"
      onClick={() => onSelect(pattern)}
      className="group text-left cursor-pointer transition-all"
    >
      <div
        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
          isSelected
            ? 'border-gold shadow-md shadow-gold/20 scale-[0.97]'
            : 'border-transparent hover:border-rice-deep group-hover:shadow-sm'
        }`}
      >
        <div
          ref={imageRef}
          className={`w-full h-full rounded-lg bg-rice-warm transition-transform group-hover:scale-110 ${
            !imageLoaded ? 'animate-pulse' : ''
          }`}
        />
      </div>

      {/* 名称 + 时代 */}
      <div className="mt-1.5 px-0.5">
        <p
          className={`text-xs font-bold truncate ${
            isSelected
              ? 'text-gold'
              : 'text-ink-light group-hover:text-ink-medium'
          }`}
        >
          {pattern.name}
        </p>
        {pattern.era && (
          <p className="text-[10px] text-ink-faint truncate">
            {pattern.era}
            {pattern.technique?.name && ` · ${pattern.technique.name}`}
          </p>
        )}
      </div>
    </button>
  )
})
```

---

## Step 5：创建工坊专用纹样查询 Hook（可选增强）

**文件路径：** `src/hooks/queries/useWorkshopPatterns.ts`

```typescript
/**
 * useWorkshopPatterns
 *
 * 对 usePatterns 的轻封装，直接消费 useWorkshopStore 的筛选状态。
 * 避免在组件中手动连接 store → query params。
 */
import { usePatterns } from '@/hooks/queries/usePatterns'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { useDeferredValue } from 'react'

export function useWorkshopPatterns() {
  const searchQuery = useWorkshopStore((s) => s.patternSearchQuery)
  const filterEra = useWorkshopStore((s) => s.patternFilterEra)

  // 使用 React 19 useDeferredValue 防止搜索输入阻塞 UI
  const deferredQuery = useDeferredValue(searchQuery)

  return usePatterns({
    q: deferredQuery || undefined,
    era: filterEra ?? undefined,
    limit: 30,
  })
}
```

---

## 验证步骤

```bash
npm run build
npm run lint
npm run dev
# 访问 http://localhost:6427/workshop
```

验证要点：
- [ ] 右侧面板显示 Supabase 真实纹样（含缩略图，非纯色块）
- [ ] 纹样名称、时代、技法信息正确显示
- [ ] 无缩略图的纹样使用 color_palette 渐变占位
- [ ] 搜索框输入后 300ms 防抖触发查询，结果正确
- [ ] 时代筛选按钮切换后结果正确更新
- [ ] 「全部」按钮恢复为 SSR 初始数据
- [ ] 加载状态正确显示（spinner）
- [ ] 空结果显示「未找到匹配的纹样」+ 清除筛选按钮
- [ ] 点击纹样卡片：
  - 边框变为 gold 高亮
  - 底部信息区更新
  - 中央画布占位区显示纹样图片
- [ ] 再次点击已选中的纹样取消选择
- [ ] SSR 首屏无加载闪烁

---

## 本轮产出文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/app/(main)/workshop/page.tsx` | **重写** | 改为 Server Component + SSR 数据预取 |
| `src/components/workshop/WorkshopClient.tsx` | 新建 | 客户端主容器 |
| `src/components/workshop/PatternAssetPanel.tsx` | 新建 | 真实数据纹样面板 |
| `src/components/workshop/PatternAssetCard.tsx` | 新建 | 纹样素材卡片 |
| `src/hooks/queries/useWorkshopPatterns.ts` | 新建（可选） | 工坊专用查询封装 |

---

## 数据流详图

```
┌─── Server ────────────────────────────────────────────────┐
│  page.tsx (Server Component)                              │
│    ↓ getPatterns({ limit: 20, sort: 'newest' })          │
│    ↓ Supabase → hp_patterns + hp_pattern_media + joins   │
│    ↓ returns PatternListItem[]                            │
└──────────────────────────────┬─────────────────────────────┘
                               ↓ initialPatterns prop
┌─── Client ───────────────────┴─────────────────────────────┐
│  WorkshopClient.tsx                                        │
│    ├── PatternAssetPanel                                   │
│    │     ├── 初始显示 initialPatterns (SSR, 无闪烁)          │
│    │     ├── 搜索/筛选 → usePatterns({ q, era })            │
│    │     │     ↓ fetch /api/patterns?q=xxx&era=汉代         │
│    │     │     ↓ React Query 缓存 + staleTime: 60s         │
│    │     └── 选中 → useWorkshopStore.setSelectedSourcePattern│
│    └── 画布占位区                                           │
│          ↓ 显示 selectedSourcePattern 的图片                 │
└─────────────────────────────────────────────────────────────┘
```

---

**下一步：执行 Round 3 (`03-canvas-engine.md`)**
