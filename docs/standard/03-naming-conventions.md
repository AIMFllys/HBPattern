# 03 - 命名与编码规范

## 文件命名

| 类型 | 规则 | 示例 |
|------|------|------|
| React 组件 | PascalCase | `SiteHeader.tsx`, `AuthModal.tsx` |
| Hook | camelCase, `use` 前缀 | `usePatterns.ts`, `useAuthForm.ts` |
| 工具/库 | camelCase | `withApi.ts`, `requestId.ts` |
| 类型定义 | camelCase | `pattern.ts`, `user.ts` |
| Zustand Store | camelCase, `use` 前缀 | `useAuthStore.ts` |
| 测试文件 | `*.test.ts(x)` | `proxy.test.ts` |
| 属性测试 | `*.property{N}.test.ts` | `parse.property7.test.ts` |
| 页面 | `page.tsx` (Next.js 约定) | — |
| 布局 | `layout.tsx` (Next.js 约定) | — |
| 模板 | `template.tsx` (Next.js 约定) | — |

## 变量命名

### TypeScript / JavaScript

| 类型 | 规则 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `requestId`, `getPatterns` |
| 常量 | UPPER_SNAKE_CASE | `API_VERSION`, `SECURITY_HEADERS` |
| 类/接口/类型 | PascalCase | `AppError`, `ApiCaller`, `PatternListItem` |
| 枚举值 | UPPER_SNAKE_CASE | `VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED` |
| 布尔变量 | `is`/`has`/`can` 前缀 | `isProtected`, `hasNext`, `isRegister` |
| 事件处理 | `handle` 前缀 | `handleSubmit`, `handleClose` |
| 异步函数 | 动词开头 | `getPatterns`, `requireAuth`, `resolveApiCaller` |

### 数据库 (Prisma / Supabase)

| 类型 | 规则 | 示例 |
|------|------|------|
| 表名 | snake_case, `hp_` 前缀 | `hp_patterns`, `hp_users` |
| 列名 | snake_case | `created_at`, `like_count`, `region_id` |
| 枚举类型 | snake_case, `hp_` 前缀 | `hp_role`, `hp_pattern_status` |
| 外键 | `{table}_id` | `uploader_id`, `region_id` |
| 索引 | 自动生成 | — |

### CSS / Tailwind

| 类型 | 规则 | 示例 |
|------|------|------|
| CSS 变量 | kebab-case, `--color-` 前缀 | `--color-cinnabar`, `--color-rice` |
| 自定义类 | kebab-case | `seal-tag`, `glass-panel`, `masonry-grid` |
| Tailwind 扩展 | 与 CSS 变量对应 | `bg-rice`, `text-cinnabar`, `text-ink-light` |

---

## 设计 Token (CSS 变量)

### 颜色系统

```
主色调 (Cinnabar 朱砂红):
  --color-cinnabar:       #b84a39   → CTA / 强调
  --color-cinnabar-deep:  #8c2f22   → Hover 状态
  --color-cinnabar-light: #d4796a   → 柔和高亮

背景 (Rice 宣纸米):
  --color-rice:           #f5f0e8   → 主背景
  --color-rice-warm:      #ede7d9   → 卡片背景
  --color-rice-deep:      #d6ccba   → 分隔线

文字 (Ink 墨色):
  --color-ink:            #1a1a14   → 主标题
  --color-ink-medium:     #3d3d30   → 正文
  --color-ink-light:      #6b6b58   → 辅助文字
  --color-ink-faint:      #9e9e88   → 占位文字

装饰 (Gold 烫金):
  --color-gold:           #c9a84c   → 强调装饰
  --color-gold-light:     #e8c97a   → 浅金

语义色:
  --color-success:        #4a7c59
  --color-warning:        #c9a84c
  --color-error:          #b84a39
  --color-info:           #4a6b8a
```

### 字体

```
--font-serif: "Noto Serif SC", Georgia, serif     → 标题
--font-sans:  "Noto Sans SC", system-ui, sans-serif → 正文
--font-mono:  "JetBrains Mono", monospace          → 代码
```

### 阴影

```
--shadow-card:  0 2px 12px rgba(26,26,20,0.08)    → 卡片
--shadow-hover: 0 8px 32px rgba(26,26,20,0.15)    → 悬停
--shadow-modal: 0 20px 60px rgba(26,26,20,0.25)   → 弹窗
```

---

## 导入顺序

```typescript
// 1. React / Next.js
import { useState } from 'react'
import { NextRequest } from 'next/server'
import Link from 'next/link'

// 2. 第三方库
import { z } from 'zod'
import { motion } from 'motion/react'

// 3. 内部 lib
import { withApi } from '@/lib/api/withApi'
import { createClient } from '@/lib/supabase/server'

// 4. 内部 components / hooks / stores
import { useAuthStore } from '@/stores/useAuthStore'
import { Icon } from '@/components/icons/Icon'

// 5. 类型 (type-only imports)
import type { PatternListItem } from '@/types/pattern'
```

---

## 类型定义规范

### 导入方式

```typescript
// ✅ 从统一入口导入
import type { PatternListItem, ApiErrorCode } from '@/types'

// ❌ 避免直接引用子模块（除非在 lib 内部）
import type { PatternListItem } from '@/types/pattern'
```

### 接口命名

| 用途 | 后缀 | 示例 |
|------|------|------|
| 列表项 | `*ListItem` | `PatternListItem` |
| 详情 | `*Detail` | `PatternDetail` |
| 创建入参 | `Create*Body` | `CreatePatternBody` |
| 查询参数 | `List*Query` | `ListPatternsQuery` |
| 路径参数 | `*IdParam` | `PatternIdParam` |
| API 响应 | `Api*` | `ApiSuccess`, `ApiError` |
| Store 状态 | `*State` | `AuthState` |
| Hook 选项 | `Use*Options` | `UseAuthFormOptions` |

---

## 组件编写规范

### Server Component (默认)

```typescript
// 无 'use client' 指令
import { getPatterns } from '@/lib/queries'

export default async function GalleryPage() {
  const data = await getPatterns()
  return <div>{/* 渲染 */}</div>
}
```

### Client Component

```typescript
'use client'  // 必须在文件第一行

import { useState } from 'react'

export default function InteractiveWidget() {
  const [state, setState] = useState(false)
  return <button onClick={() => setState(!state)}>Toggle</button>
}
```

### Props 接口

```typescript
// 在组件文件内定义，不单独导出（除非被多处引用）
interface CardProps {
  title: string
  description?: string
  onClick?: () => void
}

export default function Card({ title, description, onClick }: CardProps) { ... }
```

---

## 动画规范

### 使用统一 Variants

```typescript
import { fadeIn, slideUp, defaultTransition } from '@/lib/motion'
import { motion } from 'motion/react'

// 页面级元素
<motion.div variants={fadeIn} initial="initial" animate="animate" transition={defaultTransition}>

// 列表项
<motion.div variants={slideUp} initial="initial" animate="animate">
```

### 可用 Variants

| 名称 | 效果 | 适用场景 |
|------|------|----------|
| `fadeIn` | 淡入淡出 | 页面、遮罩 |
| `slideUp` | 上滑淡入 | 列表项、卡片 |
| `scaleIn` | 缩放淡入 | 弹窗、Toast |
| `staggerContainer` | 子元素依次入场 | 列表容器 |
| `pageTransition` | 页面切换 | template.tsx |

### 自定义动画

仅在统一 variants 无法满足时使用内联动画（如 MobileDrawer 的 spring 物理）。
