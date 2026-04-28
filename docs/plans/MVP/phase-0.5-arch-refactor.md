# Phase 0.5：架构重构与数据库初始化

> **周期**: ~0.5 天（在 Phase 1 之前执行）
> **前置条件**: Phase 0 完成
> **产出**: 消除架构级技术债 + 云端数据库就绪

---

## Applied Skills

| Skill | 应用点 |
|-------|--------|
| `nextjs-react-expert` | Server/Client 组件边界、barrel import 消除、bundle 优化 |
| `clean-code` | SRP、DRY、文件依赖感知 |
| `architecture` | 目录结构规范、关注点分离 |

---

## ✅ 已完成任务

### 1. Barrel Export 消除 ✅
- **删除** `src/components/icons/index.ts`
- **替换** 12 个文件的 import 路径：`'@/components/icons'` → `'@/components/icons/Icon'`
- **影响文件**: SiteHeader, SiteFooter, page.tsx, gallery/page, gallery/[id]/not-found, create/page, workshop/page, map/page, dashboard/page, login/page, error.tsx, not-found.tsx

### 2. 类型目录创建 ✅
已创建 `src/types/` 目录，包含：
- `pattern.ts` — PatternListItem, PatternDetail, PatternMedia, PatternFilterOptions
- `api.ts` — ApiResponse<T>, ApiError, ApiResult<T>, PaginatedResponse<T>
- `user.ts` — Role, ContributorLevel, UserProfile

### 3. Scripts 目录创建 ✅
已创建 `scripts/` 目录：
- `seed.ts` — 数据库种子脚本骨架（TODO: Phase 1 实现）
- `check-env.ts` — 环境变量校验脚本（可直接 `npx tsx scripts/check-env.ts` 执行）

### 4. next.config.ts 配置 ✅
添加了 `images.remotePatterns`：
- `*.supabase.co/storage/v1/object/public/**` — Supabase Storage 图片
- `lh3.googleusercontent.com` — Google 头像（OAuth）

### 5. Dashboard Footer 统一 ✅
- 删除 `dashboard/page.tsx` 中的内联 footer
- 添加 `import SiteFooter` + `<SiteFooter variant="light" />`

### 6. 包管理器统一 ✅
- 删除 `pnpm-lock.yaml` 和 `pnpm-workspace.yaml`
- 统一使用 npm（保留 `package-lock.json`）

### 7. Supabase 云端数据库初始化 ✅
通过 MCP `apply_migration` 完成，详见下方"云端数据库"章节。

### 8. TypeScript + ESLint 零错误 ✅
- `npx tsc --noEmit` → Exit 0
- `npx eslint src` → Exit 0

---

## ❌ 未完成任务（交接给下一个 AI）

以下任务按优先级排列，每个任务包含**完整的上下文和实现指南**。

---

### 🔴 Task 1: SiteHeader Server/Client 拆分 (P1, ~20min)

**问题**: `src/components/layout/SiteHeader.tsx` 是 `'use client'` 组件（因为 `useState` + `usePathname` + `motion/react`），被每个页面 import。`motion/react` 约 40KB gzipped，导致**每个路由的 JS bundle 都包含动画库**。

**当前文件**: `src/components/layout/SiteHeader.tsx` (173 行)

**实现方案**:

```
Step 1: 创建 src/components/layout/MobileDrawer.tsx
  - 'use client'
  - 从 SiteHeader.tsx 中提取：
    - useState (isMenuOpen)
    - motion, AnimatePresence import
    - 汉堡按钮 + 侧边抽屉 overlay + 抽屉面板
  - Props: { navItems, primaryColor, pathname }

Step 2: 修改 SiteHeader.tsx
  - 移除 'use client'
  - 移除 useState, motion, AnimatePresence imports
  - 在移动端区域使用 dynamic import:
    import dynamic from 'next/dynamic'
    const MobileDrawer = dynamic(() => import('./MobileDrawer'), { ssr: false })
  - 注意: usePathname 也是客户端 hook，需要处理
    - 方案 A: SiteHeader 接受 pathname 作为 prop（从 Server Component 页面传入）— 但 Server Component 无法获取 pathname
    - 方案 B（推荐）: 把导航链接的 active 状态也移入一个小的 Client Component
    
Step 3: 最终架构
  SiteHeader.tsx (Server Component)
    ├── Logo + 品牌名（纯 HTML）
    ├── Desktop 导航链接 → NavLinks.tsx (Client, 极小, 仅 usePathname)
    └── Mobile 触发器 → MobileDrawer.tsx (Client, dynamic, ssr: false)
```

**验证**: 拆分后，在非移动端设备上打开页面，Network tab 不应加载 `motion/react` chunk。

---

### 🟡 Task 2: Icon 字体本地化 (P2, ~15min)

**问题**: `src/app/globals.css` 第 2 行通过 CDN 加载 Material Symbols 字体：
```css
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
```
中国大陆用户可能无法访问 `fonts.googleapis.com`，导致**所有 Icon 显示为空白**。

**实现方案**:
```
Step 1: 下载字体文件
  - 访问上述 URL，提取 woff2 文件 URL
  - 下载到 public/fonts/material-symbols-outlined.woff2

Step 2: 替换 globals.css 第 2 行
  - 删除 @import url(...)
  - 添加 @font-face:
    @font-face {
      font-family: 'Material Symbols Outlined';
      font-style: normal;
      font-weight: 400;
      src: url('/fonts/material-symbols-outlined.woff2') format('woff2');
      font-display: swap;
    }

Step 3: 验证
  - 断网测试，Icon 组件应正常渲染
```

---

### 🟡 Task 3: Mock 数据目录迁移 (P2, ~10min)

**问题**: Mock 数据放在 `src/app/_mock/`（利用 Next.js 的 `_` 前缀排除路由），语义不清晰。

**实现方案**:
```
Step 1: 创建 src/data/mock/ 目录
Step 2: 移动文件:
  src/app/_mock/patterns.ts → src/data/mock/patterns.ts
  src/app/_mock/regions.ts  → src/data/mock/regions.ts
  src/app/_mock/stats.ts    → src/data/mock/stats.ts
Step 3: 全局替换 import 路径（grep for '_mock'）:
  影响文件:
  - src/app/page.tsx         → from './_mock/patterns' → from '@/data/mock/patterns'
  - src/app/page.tsx         → from './_mock/stats'    → from '@/data/mock/stats'
  - src/app/gallery/page.tsx → from '../_mock/patterns' → from '@/data/mock/patterns'
  - src/app/gallery/[id]/page.tsx → from '../../_mock/patterns' → from '@/data/mock/patterns'
  - src/app/map/page.tsx     → from '../_mock/regions'  → from '@/data/mock/regions'
  - src/app/dashboard/page.tsx → from '../_mock/stats'  → from '@/data/mock/stats'
Step 4: 删除空的 src/app/_mock/ 目录
Step 5: npx tsc --noEmit 验证
```

---

### 🟡 Task 4: layout.tsx metadataBase (P2, ~2min)

**文件**: `src/app/layout.tsx`

**添加内容**:
```ts
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:6427'
  ),
  // ...现有配置保持不变
}
```

---

### 🟡 Task 5: SiteHeader 动态类名修复 (P2, ~5min)

**问题**: SiteHeader 中存在动态 Tailwind 类名拼接（如 `` `text-${primaryColor}` ``），Tailwind v4 JIT 无法保证识别。

**修复**: 使用完整静态类映射对象：
```ts
const colorMap = {
  cinnabar: {
    text: 'text-cinnabar',
    bg: 'bg-cinnabar',
    bgMuted: 'bg-cinnabar/10',
    textMuted: 'text-cinnabar/60',
  },
  gold: {
    text: 'text-gold',
    bg: 'bg-gold',
    bgMuted: 'bg-gold/10',
    textMuted: 'text-gold/60',
  },
}
```

---

### 🟡 Task 6: 安装 clsx + utils.ts (P2, ~5min)

```bash
npm install clsx
```

**新建** `src/lib/utils.ts`:
```ts
import { type ClassValue, clsx } from 'clsx'
export function cn(...inputs: ClassValue[]) { return clsx(inputs) }
```

---

### 🟡 Task 7: Login 页面接入 Supabase Auth (P1, ~20min)

**前置条件**: `hp_users` 表已存在（✅ 已创建）

**文件**: `src/app/login/page.tsx` (当前 105 行, Server Component)

**实现方案**:
```
Step 1: 添加 'use client' 到文件头部

Step 2: Import
  import { createClient } from '@/lib/supabase/client'
  import { useRouter, useSearchParams } from 'next/navigation'

Step 3: 组件内添加状态
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

Step 4: GitHub 按钮 onClick
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })

Step 5: 表单 onSubmit
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) setError(error.message)
  else router.push('/')
  router.refresh()

Step 6: 消费 URL error 参数
  useEffect(() => {
    const err = searchParams.get('error')
    if (err) setError('认证失败，请重试')
  }, [searchParams])

Step 7: 在 UI 中显示 error 提示
  {error && <div className="text-error text-sm ...">{error}</div>}
```

**注意**: `src/app/auth/callback/route.ts` 已经实现了 OAuth 回调和 `hp_users` upsert。

---

## ☁️ Supabase 云端数据库状态

### 项目信息

| 属性 | 值 |
|------|-----|
| **Project ID** | `rithloxzperfgiqyquch` |
| **Project Name** | AIMFllys_share（多项目共享库） |
| **Region** | ap-southeast-1 (新加坡) |
| **Status** | ACTIVE_HEALTHY ✅ |
| **PostgreSQL** | 17.6.1 |
| **HBPattern 前缀** | `hp_` |

### 共享库命名规范

这是一个多项目共享的 Supabase 实例，通过表名前缀隔离：

| 前缀 | 项目 | 表数量 |
|------|------|--------|
| `in_` | AIMFllys Introduce（个人介绍） | 13 |
| `oc_` | 小护关爱（智慧养老） | 9 |
| `hr_` | HUSTERead 华科读书会 | 10 |
| `ws_` | WalletSolo（个人财务） | 4 |
| **`hp_`** | **HBPattern（湖北纹样）** | **19 ✅** |

### 已创建的 `hp_` 表（19 张）

通过 4 次 Supabase MCP `apply_migration` 创建：

| Migration | 内容 |
|-----------|------|
| `hp_enable_extensions` | 启用 PostGIS + pgvector 扩展 |
| `hp_create_enums` | 18 个 enum 类型 |
| `hp_create_core_tables` | hp_regions, hp_ich_records, hp_techniques, hp_tags, hp_users |
| `hp_create_pattern_tables` | hp_patterns, hp_pattern_media, hp_pattern_relations, hp_pattern_tags |
| `hp_create_interaction_tables` | hp_comments, hp_user_likes, hp_collections, hp_collection_items, hp_user_view_history, hp_notifications, hp_reports, hp_user_badges, hp_ai_tasks, hp_api_keys |
| `hp_enable_rls` | 所有 19 张表启用 RLS + 完整 policy 集 |

### RLS Policy 概览

| 表 | SELECT | INSERT | UPDATE | DELETE |
|----|--------|--------|--------|--------|
| **目录表** (regions/ich/techniques/tags) | 公开读 | - | - | - |
| **hp_patterns** | 仅 approved/featured 可见 | auth 用户可上传 | 上传者可编辑 | - |
| **hp_pattern_media/tags/relations** | 公开读 | - | - | - |
| **hp_users** | 仅自己可读 | auth.uid()=id | 仅自己可改 | - |
| **hp_comments** | approved 或自己的可见 | auth 用户可发 | - | - |
| **hp_user_likes** | auth 用户管理自己的 | ← | ← | ← |
| **hp_collections** | 公开或自己的 | auth 用户可创建 | ← | ← |
| **hp_notifications** | 仅自己 | - | 仅自己 | - |
| **hp_ai_tasks/api_keys** | 仅自己 | ← | ← | ← |

### 与 Prisma Schema 的对应关系

本地 `prisma/schema.prisma`（462 行）与云端表**完全一一对应**。Prisma 的 `@@map("hp_xxx")` 映射名就是云端表名。

**注意**: 云端表是通过 Supabase MCP migration 创建的（而非 `prisma db push`）。后续如需 schema 变更，建议继续通过 MCP migration 维护，并手动同步 Prisma schema。

---

## 📁 当前项目结构

```
c:\project\HBPattern\
├── scripts/
│   ├── seed.ts               # 种子脚本骨架
│   └── check-env.ts          # 环境变量检查
├── src/
│   ├── app/
│   │   ├── _mock/             # ⚠️ 待迁移到 src/data/mock/ (Task 3)
│   │   │   ├── patterns.ts
│   │   │   ├── regions.ts
│   │   │   └── stats.ts
│   │   ├── auth/callback/route.ts   # OAuth 回调（已实现）
│   │   ├── create/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── gallery/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── not-found.tsx
│   │   ├── login/page.tsx     # ⚠️ 需要接入 Auth (Task 7)
│   │   ├── map/page.tsx
│   │   ├── workshop/page.tsx
│   │   ├── error.tsx
│   │   ├── globals.css        # ⚠️ CDN 字体 (Task 2)
│   │   ├── layout.tsx         # ⚠️ 缺 metadataBase (Task 4)
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── icons/Icon.tsx     # ✅ 直接 import（无 barrel）
│   │   ├── layout/
│   │   │   ├── SiteHeader.tsx # ⚠️ 需拆分 (Task 1)
│   │   │   └── SiteFooter.tsx # ✅
│   │   └── ui/
│   │       └── ParameterSlider.tsx # ✅
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts      # ✅
│   │       └── server.ts      # ✅
│   ├── types/                 # ✅ 新建
│   │   ├── pattern.ts
│   │   ├── api.ts
│   │   └── user.ts
│   └── middleware.ts          # ✅ Supabase Auth middleware
├── prisma/
│   └── schema.prisma          # 462 行，与云端同步
├── next.config.ts             # ✅ images.remotePatterns 已配置
├── package.json
└── package-lock.json          # ✅ 统一 npm
```

---

## ⚡ 剩余任务执行优先级

| 优先级 | Task | 耗时 | 依赖 |
|--------|------|------|------|
| **P1** | Task 1: SiteHeader 拆分 | 20min | 无 |
| **P1** | Task 7: Login Auth 接入 | 20min | hp_users 已存在 ✅ |
| **P2** | Task 2: Icon 字体本地化 | 15min | 无 |
| **P2** | Task 3: Mock 数据迁移 | 10min | 无 |
| **P2** | Task 4: metadataBase | 2min | 无 |
| **P2** | Task 5: 动态类名修复 | 5min | 无 |
| **P2** | Task 6: clsx + utils.ts | 5min | 无 |

**总预计**: ~1.5 小时

---

## Done When

- [x] ✅ 无 barrel import
- [x] ✅ `src/types/` 目录存在
- [x] ✅ `scripts/` 目录存在
- [x] ✅ `next.config.ts` 已配置
- [x] ✅ Dashboard 使用 `<SiteFooter />`
- [x] ✅ TypeScript + ESLint 零错误
- [x] ✅ pnpm 文件已删除
- [x] ✅ 云端 19 张 `hp_` 表已创建 + RLS 已启用
- [ ] Task 1: SiteHeader 拆分为 Server + Client
- [ ] Task 2: Icon 字体本地化
- [ ] Task 3: Mock 数据迁移到 `src/data/mock/`
- [ ] Task 4: metadataBase 配置
- [ ] Task 5: 动态类名修复
- [ ] Task 6: clsx 安装 + utils.ts
- [ ] Task 7: Login Auth 接入
