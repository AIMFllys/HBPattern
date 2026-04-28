# Phase 1：核心数据流打通

> **周期**: ~3 天
> **前置条件**: Phase 0 完成
> **产出**: 首页 + 画廊 + 详情页从 Supabase Postgres 读取真实数据

---

## Goal

连接 Supabase Postgres，生成 Prisma Client，创建 API Routes，将首页/画廊/详情页从 Mock 数据切换到真实数据库查询。完成后 `_mock/` 目录可完全删除。

## Applied Skills

| Skill | 应用点 |
|-------|--------|
| `api-patterns` | REST 资源命名规范，统一响应格式（Envelope Pattern），正确 HTTP 状态码 |
| `clean-code` | Prisma Client 单例封装（SRP），查询函数复用（DRY），Guard Clauses 错误处理 |
| `nextjs-react-expert` | Server Components 读取数据（零客户端 JS），消除数据获取瀑布（Promise.all），Suspense 边界 |
| `database-design` | 种子数据结构设计，索引验证 |

---

## API 设计规范（遵循 api-patterns skill）

### 统一响应格式（Envelope Pattern）

```typescript
// 成功响应
{
  "data": { ... },          // 单个对象
  "meta": { "timestamp": "..." }
}

// 列表响应
{
  "data": [ ... ],          // 数组
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 156,
    "totalPages": 13
  }
}

// 错误响应
{
  "error": {
    "code": "NOT_FOUND",
    "message": "纹样不存在"
  }
}
```

### HTTP 状态码约定

| 场景 | 状态码 |
|------|--------|
| 成功获取 | 200 |
| 成功创建 | 201 |
| 参数错误 | 400 |
| 未认证 | 401 |
| 无权限 | 403 |
| 不存在 | 404 |
| 服务端错误 | 500 |

---

## Tasks

### 1.1 Supabase 数据库连接

```
步骤:
  1. .env.local 中 DATABASE_URL 填入真实 Supabase 密码
     格式: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
  2. .env.local 中 DIRECT_URL 填入直连 URL（用于 migration）
     格式: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
  3. .env 中注释掉或删除本地 DATABASE_URL
  4. 运行: npx prisma generate
  5. 运行: npx prisma db push
     → 这会在 Supabase Postgres 中创建 18 个表
```

→ 验证: `npx prisma studio` 打开后能看到 18 个空表

### 1.2 Prisma Client 单例封装

```
新建: src/lib/db.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 遵循 clean-code: 单一职责，全局单例，热更新安全
```

→ 验证: `import { prisma } from '@/lib/db'` 不报错

### 1.3 种子数据脚本

```
新建: prisma/seed.ts

内容（从 _mock/ 迁移并扩展）:

  Regions (4条):
    - 武汉市 { id: 'wuhan', boundary: null }
    - 十堰市 { id: 'shiyan' }
    - 恩施州 { id: 'enshi' }
    - 荆州市 { id: 'jingzhou' }

  Techniques (4条):
    - 刺绣 { category: 'embroidery' }
    - 织锦 { category: 'weaving' }
    - 蜡染 { category: 'dyeing' }
    - 漆器 { category: 'printing' }

  Tags (10条):
    - 凤鸟纹/云纹/几何纹/花卉纹/龙纹/莲花纹/回纹/饕餮纹/水波纹/如意纹

  IchRecords (2条):
    - 汉绣 { level: 'national' }
    - 西兰卡普 { level: 'national' }

  Patterns (6条，从 mockPatterns 迁移):
    - 战国凤鸟纹 { era: '战国', status: 'featured' }
    - 楚式云雷纹 { era: '战国', status: 'approved' }
    - 土家织锦·西兰卡普 { era: '明清', status: 'featured' }
    - 汉绣凤穿牡丹 { era: '清代', status: 'approved' }
    - 黄梅挑花 { era: '近现代', status: 'approved' }
    - AI·新楚风凤鸟 { era: '当代', is_ai_generated: true, status: 'approved' }

  PatternMedia (每个 Pattern 1张图):
    - media_type: 'image', url: 占位图 URL

配置 package.json:
  "prisma": { "seed": "npx tsx prisma/seed.ts" }
```

→ 验证: `npx prisma db seed` 成功，`npx prisma studio` 看到数据

### 1.4 API Route: GET /api/patterns

```
新建: src/app/api/patterns/route.ts

功能: 纹样列表查询 + 筛选 + 分页 + 排序

参数:
  ?page=1          默认 1
  &limit=12        默认 12，最大 50
  &era=战国        按年代筛选
  &region=wuhan    按地区 ID 筛选
  &technique=刺绣  按工艺筛选
  &status=approved 按状态（默认只返回 approved + featured）
  &sort=newest     newest | oldest | popular | likes
  &q=凤鸟          模糊搜索 name + description

Prisma 查询:
  prisma.pattern.findMany({
    where: {
      status: { in: ['approved', 'featured'] },
      ...(era && { era }),
      ...(regionId && { region_id: regionId }),
      ...(q && { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]})
    },
    include: {
      region: { select: { name: true } },
      technique: { select: { name: true } },
      media: { where: { sort_order: 0 }, take: 1 },
      tags: { include: { tag: true } }
    },
    orderBy: sort === 'newest' ? { created_at: 'desc' }
           : sort === 'popular' ? { view_count: 'desc' }
           : sort === 'likes' ? { like_count: 'desc' }
           : { created_at: 'asc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  // 同时查 total count（用 Promise.all 并行，遵循 nextjs-react-expert）
  const [patterns, total] = await Promise.all([
    prisma.pattern.findMany(...),
    prisma.pattern.count({ where: ... })
  ])

响应: Envelope Pattern { data, pagination }
```

→ 验证: `curl localhost:6427/api/patterns` 返回 6 条数据

### 1.5 API Route: GET /api/patterns/[id]

```
新建: src/app/api/patterns/[id]/route.ts

功能: 单个纹样完整详情

Include:
  region, technique, ich_record,
  media (all), tags,
  related patterns (同 technique，排除自身，limit 4)

404 处理:
  if (!pattern) return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: '纹样不存在' } },
    { status: 404 }
  )
```

→ 验证: `curl localhost:6427/api/patterns/[uuid]` 返回完整详情

### 1.6 API Route: GET /api/stats

```
新建: src/app/api/stats/route.ts

功能: 平台统计概览

查询（Promise.all 并行）:
  const [patternCount, regionCount, techniqueCount, featuredCount] = await Promise.all([
    prisma.pattern.count({ where: { status: { in: ['approved', 'featured'] } } }),
    prisma.region.count(),
    prisma.technique.count(),
    prisma.pattern.count({ where: { status: 'featured' } }),
  ])

响应:
  { data: { patternCount, regionCount, techniqueCount, featuredCount } }
```

→ 验证: `curl localhost:6427/api/stats` 返回真实计数

### 1.7 API Route: GET /api/regions

```
新建: src/app/api/regions/route.ts

功能: 地区列表（含每个地区的纹样计数）

响应:
  { data: [{ id, name, province, patternCount: 3 }] }
```

### 1.8 首页数据化

```
修改: src/app/page.tsx

变更:
  - 删除: import { mockPatterns } from './_mock/patterns'
  - 删除: import { mockStats } from './_mock/stats'
  - 添加: import { prisma } from '@/lib/db'

  // Server Component 直接查库（零客户端 JS，遵循 nextjs-react-expert）
  const [stats, featuredPatterns] = await Promise.all([
    prisma.pattern.count({ where: { status: { in: ['approved', 'featured'] } } }),
    prisma.pattern.findMany({
      where: { status: 'featured' },
      include: { region: true, media: { take: 1 } },
      take: 4,
    }),
  ])

  // 首页统计区域用真实数据
  // 精选纹样区域用真实数据
```

→ 验证: 首页统计数字 = 数据库实际数据

### 1.9 画廊页数据化

```
修改: src/app/gallery/page.tsx

架构调整:
  - 拆分为 Server Component (page.tsx) + Client Component (GalleryClient.tsx)
  - page.tsx: 从 searchParams 读取筛选参数 → 查库 → 传给 GalleryClient
  - GalleryClient.tsx: 渲染筛选面板 + 瀑布流 + 分页

  // page.tsx (Server Component)
  export default async function GalleryPage({ searchParams }) {
    const params = await searchParams
    const page = Number(params.page) || 1
    const era = params.era || undefined
    // ... 其他筛选参数

    const [patterns, total] = await Promise.all([
      prisma.pattern.findMany({ ... }),
      prisma.pattern.count({ ... }),
    ])

    return <GalleryClient patterns={patterns} total={total} page={page} />
  }

筛选交互:
  - 筛选面板 checkbox onChange → router.push 更新 URL searchParams
  - URL 变化 → Server Component 重新渲染 → 新数据
  - 无需 useState 管理筛选状态（URL 即状态）

分页:
  - 底部分页按钮 → Link href 更新 ?page=N
  - 显示"第 X 页，共 Y 页"
```

→ 验证: 勾选"战国" → URL 变为 `?era=战国` → 只显示战国纹样

### 1.10 详情页数据化

```
修改: src/app/gallery/[id]/page.tsx

  export default async function PatternDetailPage({ params }) {
    const { id } = await params

    const pattern = await prisma.pattern.findUnique({
      where: { id },
      include: {
        region: true,
        technique: true,
        ich_record: true,
        media: { orderBy: { sort_order: 'asc' } },
        tags: { include: { tag: true } },
      }
    })

    if (!pattern) notFound()

    // 相关纹样（同 technique，排除自身）
    const relatedPatterns = await prisma.pattern.findMany({
      where: {
        technique_id: pattern.technique_id,
        id: { not: pattern.id },
        status: { in: ['approved', 'featured'] }
      },
      include: { media: { take: 1 } },
      take: 4,
    })

    // SEO: 动态 metadata
    // 遵循 nextjs-react-expert: generateMetadata
  }

  export async function generateMetadata({ params }) {
    const { id } = await params
    const pattern = await prisma.pattern.findUnique({
      where: { id },
      select: { name: true, description: true }
    })
    return {
      title: pattern?.name ?? '纹样详情',
      description: pattern?.description?.slice(0, 160) ?? '',
    }
  }
```

→ 验证: 从画廊点击卡片 → 跳转详情页 → 显示该纹样真实数据

### 1.11 清理 Mock 数据

```
删除或标记废弃:
  - src/app/_mock/patterns.ts → 删除（数据已迁移到种子脚本）
  - src/app/_mock/stats.ts → 删除（被 API 替代）
  - src/app/_mock/regions.ts → 保留（地图页暂未数据化）
```

→ 验证: 全项目 grep `_mock/patterns` 无结果

---

## Done When

- [x] ✅ Prisma 7 适配完成 (adapter-pg + schema 修复 + prisma generate)
- [x] ✅ `src/lib/db.ts` Prisma Client 单例封装
- [x] ✅ 种子数据已写入 Supabase (4 regions, 4 techniques, 2 ICH, 10 tags, 6 patterns, 6 media)
- [x] ✅ `GET /api/patterns` 返回带分页的纹样列表
- [x] ✅ `GET /api/patterns/[id]` 返回完整详情 + 404
- [x] ✅ `GET /api/stats` 返回真实计数
- [x] ✅ `GET /api/regions` 返回地区列表
- [x] ✅ 首页统计数字来自数据库 (Server Component + Promise.all)
- [x] ✅ 画廊筛选/分页/排序全部功能正常 (URL-as-state + GalleryClient)
- [x] ✅ 详情页按 id 动态加载 + generateMetadata + notFound()
- [x] ✅ 首页/画廊/详情页已完全脱离 mock (仅 dashboard/map 保留)
- [x] ✅ React.cache() 包装 getPatternById 避免重复查询
- [x] ✅ 搜索参数 SQL 通配符已消毒

### 技术决策记录

- **运行时查询使用 Supabase Client**（非 Prisma）— .env.local 密码为占位符，且 Supabase Client 天然配合 RLS
- **Prisma 保留用于 schema 定义** — 当密码配置好后可用 prisma studio
- **Gallery 采用 URL-as-state** — 筛选/分页通过 searchParams 驱动，Server Component 重新渲染
- **新增依赖**: @prisma/client@7.8.0, @prisma/adapter-pg, pg, tsx
