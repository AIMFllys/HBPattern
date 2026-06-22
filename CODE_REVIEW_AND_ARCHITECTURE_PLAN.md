# HBPattern 深度代码审查与未来架构规划

> **项目**: 湖北纹案文化展示平台 (HBPattern)
> **审查范围**: 全栈代码库（前端 + API + 数据库 + 架构文档）
> **规划目标**: 建立长期接口规范、消除技术债务、预留未来扩展空间
> **审查日期**: 2026-05-09

---

## 1. 现状诊断（代码审查核心发现）

### 1.1 整体完成度评估

| 维度 | 完成度 | 关键问题 |
|------|--------|----------|
| 设计系统 Token | 90% | `globals.css` 完善，但 `seal-tag` 硬编码颜色未用 Token |
| 页面 UI 壳体 | 65% | 视觉还原良好，但大量 Mock 数据、交互未绑定 |
| API Routes 框架 | 40% | 8 个路由存在，但无输入验证、无速率限制、错误处理不统一 |
| 数据库 Schema | 95% | Prisma 18 张表设计完善，含 PostGIS + pgvector |
| 类型定义 | 60% | `api.ts`/`pattern.ts`/`user.ts` 存在，缺 `collection.ts` 等 |
| 状态管理 | 5% | Zustand/TanStack Query 已安装但零使用 |
| 3D/地图集成 | 5% | 纯 CSS 模拟，未接入 Three.js / 高德 / Deck.gl |
| 测试基础设施 | 0% | 无任何测试文件、测试框架、测试脚本 |
| 错误处理 | 10% | 有基础 `error.tsx`，但 API 无统一错误码、客户端无 Toast |
| 安全机制 | 15% | 有 Auth 检查，但无输入校验、无速率限制、上传无文件类型限制 |

### 1.2 关键 Bug（必须立即修复）

| # | 文件 | 行 | 问题 | 影响 |
|---|------|----|------|------|
| 1 | `gallery/[id]/page.tsx` | ~6 | `mockPatterns[0]` 硬编码，完全不按 URL `id` 查询 | 详情页永远显示同一条数据 |
| 2 | `gallery/[id]/page.tsx` | ~5 | `params: Promise<{id}>` 未 `await` | Next.js 16 参数规范不符 |
| 3 | `gallery/page.tsx` | ~77 | `aspect-[${pattern.aspectRatio}]` 动态类名 | Tailwind v4 JIT 无法扫描，样式永不生效 |
| 4 | `map/page.tsx` | ~9 | `min-screen` typo（应为 `min-h-screen`） | 地图页高度塌陷 |

### 1.3 架构债务（阻碍长期扩展）

| 问题 | 现状 | 未来风险 |
|------|------|----------|
| **双数据库访问方案** | Prisma Client 配置在 `lib/db.ts` 但全代码使用 Supabase 直连 | 数据层分裂，迁移困难，无法利用 Prisma 类型安全 |
| **认证方案不一致** | 代码用 Supabase Auth；架构文档规划 NextAuth.js | 角色权限体系、Session 管理需要重写 |
| **API 错误码不统一** | 中英文混用（`UNAUTHORIZED`/`获取纹样列表失败`） | 开放 API 无法对外提供一致体验 |
| **无输入验证层** | API 路由手动 `if (!name)` 检查 | 类型不安全，易受注入攻击 |
| **文件上传无限制** | `/api/upload` 仅检查 `file` 存在 | 无大小限制、无类型白名单、无病毒扫描接口预留 |
| **无速率限制** | 所有 API 可被无限请求 | 开放后易被刷接口、AI 调用成本失控 |
| **TODO 堆积** | `create`/`workshop` 有 4 个 `/* TODO */` | 核心功能未完成 |
| **依赖僵尸** | motion/zustand/react-query/lucide-react 安装但零引用 | 增加 bundle 体积，误导后续开发者 |

---

## 2. 长期接口规范体系（核心规划）

### 2.1 API 设计规范（强制执行）

#### 响应格式标准

```typescript
// src/types/api.ts — 已存在，需扩展为强制规范

// 成功响应（已有，保持不变）
interface ApiResponse<T> {
  data: T
  error?: never
}

// 错误响应 — 改进：code 必须为英文大写蛇形，message 必须支持 i18n 键
interface ApiError {
  data?: never
  error: {
    code: string           // e.g., "PATTERN_NOT_FOUND", "RATE_LIMIT_EXCEEDED"
    message: string        // 默认中文描述，未来支持 {"zh": "...", "en": "..."}
    details?: unknown      // 调试信息（仅开发环境）
    requestId: string      // 唯一请求追踪 ID（用于日志串联）
  }
}

// 分页响应 — 已存在，扩展 meta
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean       // 新增：方便客户端判断
    hasPrev: boolean       // 新增
  }
  meta: {
    requestId: string
    timestamp: string      // ISO 8601
  }
}
```

#### 路由命名规范

```
# 内部 BFF API（Next.js API Routes）
/api/patterns              GET  列表  | POST 创建
/api/patterns/:id          GET  详情  | PATCH 更新 | DELETE 删除
/api/patterns/:id/like     POST 点赞  | DELETE 取消 | GET 状态
/api/patterns/:id/comments GET  评论  | POST 发表
/api/patterns/:id/relations GET 关联图谱

# 注意：资源 ID 统一使用 UUID v4，路由文件必须 { params: Promise<{id: string}> } 且 await
```

#### HTTP 状态码映射规范

| 场景 | 状态码 | 错误码示例 |
|------|--------|-----------|
| 参数校验失败 | 400 | `VALIDATION_ERROR` |
| 未认证 | 401 | `UNAUTHORIZED` |
| 无权限 | 403 | `FORBIDDEN` |
| 资源不存在 | 404 | `PATTERN_NOT_FOUND` |
| 速率限制 | 429 | `RATE_LIMIT_EXCEEDED` |
| 服务端错误 | 500 | `INTERNAL_ERROR` |

### 2.2 类型系统规范（单一真相源）

```
src/types/
├── api.ts           # API 响应/请求契约（前后端共用）
├── pattern.ts       # 纹样领域类型（已存在，需补充 Collection/Comment）
├── user.ts          # 用户领域类型（已存在）
├── collection.ts    # 缺失：需新增
├── comment.ts       # 缺失：需新增
├── notification.ts  # 缺失：需新增
├── search.ts        # 缺失：需新增（ImageSearchParams, ColorSearchParams）
├── ai.ts            # 缺失：需新增（AiTask, GenerationParams）
└── index.ts         # 缺失：统一导出入口
```

**规范要求**：
- 所有 API 入参必须定义 `*Params` / `*Body` 接口，禁止 `req.json()` 后直接使用 `any`
- 数据库查询返回类型必须与 Prisma `*Payload` 对齐，禁止 `as unknown as X` 强制转换
- 枚举值必须使用 `const` 对象替代字符串字面量（防拼写错误）

```typescript
// 示例：替代魔字符串
export const PatternStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FEATURED: 'featured',
} as const
export type PatternStatus = typeof PatternStatus[keyof typeof PatternStatus]
```

### 2.3 数据库访问层规范（关键决策）

**决策**：统一使用 **Prisma Client** 替代 Supabase 直连

**Why**：
1. Prisma Schema 已完整定义 18 张表关系，Supabase 直连无法利用关系类型安全
2. 复杂查询（如知识图谱关联、收藏夹嵌套）Prisma 关系查询更优雅
3. 迁移管理：Prisma Migration 是版本化、可回滚的
4. pgvector / PostGIS 扩展 Prisma 已通过 `Unsupported()` 支持

**迁移路径**：
```
Phase 1（立即）: 保留现有 Supabase 查询，新增 Prisma 查询并行
Phase 2（1-2周）: 逐步替换 `lib/queries.ts` 中所有 Supabase 查询为 Prisma
Phase 3（完成后）: 删除 Supabase 服务端直连，仅保留 `@supabase/ssr` 用于 Auth
```

**Prisma 查询封装规范**：
```
src/lib/
├── db.ts              # Prisma Client 单例（已有，保持不变）
├── queries/
│   ├── pattern.ts     # 纹样相关查询（从 lib/queries.ts 拆分）
│   ├── user.ts        # 用户查询
│   ├── collection.ts  # 收藏查询
│   └── search.ts      # 搜索查询（预留向量搜索接口）
└── supabase/
    ├── server.ts      # 仅用于 Auth（ getUser() / getSession() ）
    └── client.ts      # 浏览器端 Auth
```

### 2.4 认证与权限中间件规范

**决策**：保留 Supabase Auth（代码现状），但抽象统一权限检查层

```typescript
// src/lib/auth/checks.ts — 新增

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) throw new AuthError('UNAUTHORIZED', 401)
  return user
}

export async function requireRole(roles: Role[]) {
  const user = await requireAuth()
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!profile || !roles.includes(profile.role)) {
    throw new AuthError('FORBIDDEN', 403)
  }
  return user
}

// API Route 中使用：
// const user = await requireAuth()           // 仅需登录
// const user = await requireRole(['admin'])  // 需管理员
```

### 2.5 输入验证规范（Zod 强制）

**所有 API Route 必须在第一行进行 Zod 验证**：

```typescript
// src/lib/validation/schemas.ts — 新增

import { z } from 'zod'

export const CreatePatternBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  era: z.string().max(50).optional(),
  regionId: z.string().uuid().optional(),
  techniqueId: z.string().uuid().optional(),
  imageUrl: z.string().url(),
})

export const ListPatternsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  era: z.string().optional(),
  region: z.string().uuid().optional(),
  sort: z.enum(['newest', 'oldest', 'popular', 'likes']).default('newest'),
  q: z.string().max(100).optional(),
})
```

### 2.6 文件上传规范（安全预留）

```typescript
// src/lib/upload/config.ts — 新增

export const UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024,        // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExts: ['jpg', 'jpeg', 'png', 'webp'],
  bucket: 'pattern-images',
  pathPrefix: (userId: string) => `${userId}/${Date.now()}`,
  // 预留：未来接入阿里云 OSS 时的配置
  oss: {
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET,
    // 签名 URL 有效期
    urlExpires: 3600,
  }
} as const
```

---

## 3. 未来扩展接口预留（面向 Phase 2/3/4）

### 3.1 AI 子系统接口（Phase 3）

```typescript
// src/types/ai.ts — 预留

export interface AiTask {
  id: string
  taskType: 'generate' | 'texture_map' | 'moderate' | 'embed_image'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  prompt?: string
  parameters?: Record<string, unknown>
  resultUrl?: string
  processingTimeMs?: number
  createdAt: string
  completedAt?: string
}

export interface GenerationParams {
  prompt: string
  style: 'embroidery' | 'weaving' | 'dyeing' | 'lacquer'
  size: '1024x1024' | '1024x1536' | '1536x1024'
  // 预留：LoRA 微调模型 ID
  loraModelId?: string
}

// API 路由预留：
// POST /api/ai/generate      → 提交生成任务
// GET  /api/ai/tasks/:id     → 查询任务状态（轮询）
// POST /api/ai/moderate      → 内容审核（文本/图片）
// POST /api/ai/embed-image   → 图像向量化（以图搜图）
```

### 3.2 开放 API v1 接口（Phase 4）

```typescript
// src/app/api/v1/ 目录 — 预留

// 开放 API 必须额外检查：
// 1. Authorization: Bearer <api_key>
// 2. 速率限制（按 tier: free=100/h, basic=1000/h, premium=10000/h）
// 3. CORS 白名单
// 4. 仅返回 approved/featured 状态数据

GET /api/v1/patterns?era=&region=&page=&limit=
GET /api/v1/patterns/:id
GET /api/v1/patterns/search?q=
GET /api/v1/regions
GET /api/v1/regions/:id/patterns
GET /api/v1/tags
```

### 3.3 实时通知接口（Phase 2/3）

```typescript
// src/types/notification.ts — 预留

export interface Notification {
  id: string
  type: 'comment_reply' | 'moderation_result' | 'system' | 'badge_earned'
  title: string
  content: string
  relatedUrl?: string
  isRead: boolean
  createdAt: string
}

// 初期：前端轮询（每 10 秒）
// GET /api/notifications?unreadOnly=true
// PUT /api/notifications/:id/read
// PUT /api/notifications/read-all

// 未来：Socket.io 升级时保持接口不变，仅底层传输切换
```

### 3.4 地图与地理接口（Phase 2）

```typescript
// src/app/api/map/ 目录 — 预留

GET /api/map/markers           // 所有纹案地理标记（GeoJSON）
GET /api/map/regions           // 湖北区域边界 GeoJSON
GET /api/map/regions/:id       // 区域详情
GET /api/map/heatmap           // 热力图数据（按纹案密度）
GET /api/map/nearby?lat=&lng=&radius=  // 附近纹案（PostGIS ST_DWithin）
```

### 3.5 收藏夹接口（Phase 2）

```typescript
// src/app/api/collections/ 目录 — 预留

GET    /api/collections              // 我的收藏夹列表
POST   /api/collections              // 创建收藏夹
PATCH  /api/collections/:id          // 更新收藏夹
DELETE /api/collections/:id          // 删除收藏夹
POST   /api/collections/:id/items    // 添加纹案
DELETE /api/collections/:id/items/:patternId  // 移除纹案
```

---

## 4. 组件架构规范（前端长期）

### 4.1 目录结构规范（与文档规划对齐）

```
src/components/
├── ui/                    # 基础 UI 组件（无业务逻辑）
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── NotificationBell.tsx   # 预留
│   └── ReportDialog.tsx       # 预留
├── pattern/               # 纹样业务组件
│   ├── PatternCard.tsx
│   ├── PatternDetail.tsx
│   ├── PatternGrid.tsx
│   ├── PatternTimeline.tsx    # 预留：演化时间线
│   ├── RelationGraph.tsx      # 预留：知识图谱
│   ├── ColorPalette.tsx       # 预留：色板展示
│   └── LicenseBadge.tsx       # 预留：版权标识
├── search/                # 搜索业务组件（预留）
│   ├── FilterPanel.tsx
│   ├── ImageSearch.tsx
│   └── ColorPicker.tsx
├── map/                   # 地图组件（预留）
│   ├── MapCanvas.tsx
│   ├── MapMarker.tsx
│   └── GlowEffect.tsx
├── three/                 # 3D 渲染组件（预留）
│   ├── MerchandiseViewer.tsx
│   ├── TextureMapper.tsx
│   └── Scene.tsx
└── layout/                # 布局组件
    ├── Header.tsx
    ├── Footer.tsx           # 已抽取，需统一 variant
    └── Sidebar.tsx
```

### 4.2 状态管理规范（启用已安装库）

**决策**：按以下规范启用已安装的 Zustand + TanStack Query

```typescript
// Server 数据（列表、详情、搜索）→ TanStack Query
// 原因：自动缓存、失效、重请求、分页预取

// Client 状态（模态框、筛选条件、UI 主题）→ Zustand
// 原因：轻量、无 Provider 嵌套、持久化简单

// 示例：启用 TanStack Query
// src/app/layout.tsx 中添加 QueryClientProvider
// src/lib/query/client.ts 中配置默认选项
```

### 4.3 设计系统补充规范

| 缺失项 | 现状 | 规范 |
|--------|------|------|
| z-index 层级 | 无规范 | 定义 `--z-dropdown: 100`, `--z-modal: 200`, `--z-toast: 300` |
| 深色模式 | 无 | Phase 4 预留 `prefers-color-scheme` Token |
| 响应式断点 | 无 Token | 定义 `--breakpoint-sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` |
| 间距体系 | 仅 `--spacing-section` | 补充 `--spacing-xs` 到 `--spacing-3xl` 完整阶梯 |
| 阴影/边框 | 有 | 保持不变 |

---

## 5. 实施路线图

### Phase 0: 技术债清理 + 规范建立（1-2 天）

| 优先级 | 任务 | 文件 |
|--------|------|------|
| P0 | 修复 4 个 Critical Bug | `gallery/[id]/page.tsx`, `gallery/page.tsx`, `map/page.tsx` |
| P0 | 安装 Zod，建立输入验证层 | `src/lib/validation/schemas.ts` |
| P0 | 统一错误响应格式，添加 `requestId` | `src/types/api.ts`, 所有 `route.ts` |
| P1 | 抽取 `SiteFooter` 组件（已部分完成） | `src/components/layout/SiteFooter.tsx` |
| P1 | 补全缺失类型文件 | `collection.ts`, `comment.ts`, `notification.ts` |
| P1 | 为 API Routes 添加 Zod 验证 | `patterns/route.ts`, `upload/route.ts`, `comments/route.ts` |
| P2 | 创建 `lib/auth/checks.ts` 统一权限层 | 新增 |
| P2 | 添加基础速率限制（内存版） | `src/lib/rate-limit.ts` |

### Phase 1: 数据层迁移 + 认证打通（3-5 天）

| 任务 | 说明 |
|------|------|
| 生成 Prisma Client | `npx prisma generate`，验证类型完整性 |
| 创建 `lib/queries/` 分层 | 将 `lib/queries.ts` 拆分为 pattern/user/collection/search |
| 首页从 Mock 切换到 API | `page.tsx` 使用 `getPatterns` / `getStats` |
| 画廊页接入真实筛选/分页 | `GalleryClient.tsx` 绑定 Query Params |
| 登录页补全 UI + 逻辑 | `login/page.tsx` 接入 Supabase Auth |
| 补全 `loading.tsx` / `error.tsx` | 各路由添加骨架屏和错误边界 |

### Phase 2: 社区功能完整实现（5-7 天）

| 任务 | 说明 |
|------|------|
| 评论系统完整流 | 发表评论 + 嵌套回复 + AI 审核预留接口 |
| 收藏夹 CRUD | 前端 UI + API Routes |
| 点赞系统 | `LikeButton.tsx` 绑定 `/api/patterns/:id/like` |
| 通知系统（轮询版） | `NotificationBell.tsx` + `/api/notifications` |
| 用户个人主页 | `profile/page.tsx` 接入真实数据 |
| 管理后台数据接入 | `dashboard/page.tsx` 接入统计 API |

### Phase 3: AI + 搜索 + 地图（7-10 天）

| 任务 | 说明 |
|------|------|
| AI 生成接口 | `/api/ai/generate` + 前端轮询 |
| 以图搜图接口 | `/api/ai/embed-image` + pgvector 查询 |
| 颜色搜索 | 前端 Canvas 提取 + 后端 HSL 距离计算 |
| 地图接入高德/Deck.gl | 替换 CSS 模拟，真实地理渲染 |
| 3D 文创预览 | Three.js + R3F 接入 |

### Phase 4: 开放 API + 生态扩展（10-14 天）

| 任务 | 说明 |
|------|------|
| `/api/v1/` 开放 API | API Key 鉴权 + 速率限制 + CORS |
| 多语言 i18n | `next-intl` + `pattern_translations` 表 |
| 水印系统 | Canvas 可见水印 + DCT 隐形水印预留 |
| PWA 支持 | Service Worker + 离线缓存 |
| 测试基础设施 | Vitest + React Testing Library + Playwright |

---

## 6. 关键决策记录（ADR）

| # | 决策 | 选择 | 理由 |
|---|------|------|------|
| 1 | 数据库访问层 | **Prisma**（迁移中） | 类型安全、关系查询、迁移管理 |
| 2 | 认证方案 | **保留 Supabase Auth** | 代码已有实现，NextAuth.js 迁移成本大于收益 |
| 3 | 状态管理 | **Zustand + TanStack Query** | 已安装，启用即可，无需新增依赖 |
| 4 | 输入验证 | **Zod** | 与 TypeScript 深度集成，运行时报错信息友好 |
| 5 | 图标方案 | **逐步替换为 lucide-react** | 已安装，替代手写 `Icon.tsx` 减少维护成本 |
| 6 | 文件存储 | **保留 Supabase Storage → 未来迁移 OSS** | 当前够用，OSS 签名 URL 方案预留接口 |
| 7 | 测试框架 | **Vitest + RTL + Playwright** | Vite 生态、速度快、Playwright 覆盖 E2E |

---

## 7. 验证清单

代码规范执行后，任何新代码应满足：

- [ ] API Route 第一行是 Zod 验证
- [ ] API 错误使用 `requestId` + 英文 `code` + 中文 `message`
- [ ] 数据库查询通过 Prisma Client 而非 Supabase 直连（迁移完成后）
- [ ] 新增类型定义写入 `src/types/` 并导出
- [ ] 权限检查使用 `requireAuth()` / `requireRole()` 而非内联 `if (!user)`
- [ ] 文件上传使用 `UPLOAD_CONFIG` 常量校验大小和类型
- [ ] 敏感操作（创建/修改/删除）有速率限制
- [ ] 客户端组件使用 TanStack Query 获取服务端数据
- [ ] UI 状态使用 Zustand 管理
- [ ] 所有 `console.log` 替换为结构化日志（预留）
