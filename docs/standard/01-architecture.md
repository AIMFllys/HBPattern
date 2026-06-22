# 01 - 项目架构总览

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 框架 | Next.js (App Router) | 16.2.1 |
| 运行时 | Node.js | 20+ |
| 语言 | TypeScript | 5.x |
| 样式 | Tailwind CSS | v4 |
| 数据库 | Supabase PostgreSQL | 17 (PostGIS + pgvector) |
| Schema/Migration | supabase/migrations/*.sql | 0000_init.sql 为 schema 真相源 |
| 认证 | Supabase Auth | @supabase/ssr |
| 存储 | Supabase Storage | pattern-images bucket |
| 状态(客户端) | Zustand | 5.x |
| 状态(服务端) | TanStack React Query | 5.x |
| 动画 | motion/react | 12.x |
| 验证 | Zod | 3.x |
| 测试 | Vitest + fast-check | 4.x |

## 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── (main)/                   # 公开页面 Route Group
│   │   ├── layout.tsx            # 透传布局
│   │   ├── template.tsx          # 页面过渡动画
│   │   ├── page.tsx              # 首页 /
│   │   ├── gallery/              # 纹样画廊 /gallery
│   │   ├── map/                  # 3D文化地图 /map
│   │   ├── create/               # AI创作中心 /create
│   │   ├── workshop/             # 跨界工坊 /workshop
│   │   ├── dashboard/            # 管理后台 /dashboard [受保护]
│   │   ├── profile/              # 个人中心 /profile [受保护]
│   │   └── upload/               # 上传 /upload [受保护]
│   ├── (auth)/                   # 认证页面 Route Group
│   │   ├── layout.tsx            # 无Header/Footer
│   │   └── login/                # 登录/注册 /login
│   ├── api/                      # 内部 BFF API
│   │   ├── v1/                   # 对外公开 API (只读 + CORS)
│   │   │   ├── patterns/
│   │   │   ├── regions/
│   │   │   └── stats/
│   │   ├── patterns/             # 内部纹样 CRUD
│   │   ├── regions/
│   │   ├── stats/
│   │   └── upload/
│   ├── auth/callback/            # OAuth 回调
│   ├── layout.tsx                # 根布局 (Providers)
│   ├── globals.css               # 设计 Token + 全局样式
│   ├── error.tsx                 # 全局错误边界
│   ├── not-found.tsx             # 404 页面
│   └── loading.tsx               # 全局加载状态
├── lib/                          # 核心工具库
│   ├── api/                      # API 基础设施
│   │   ├── withApi.ts            # Route Handler 统一包装器
│   │   ├── errors.ts             # 错误码定义 + AppError 类
│   │   ├── error-messages.ts     # i18n 错误消息映射
│   │   ├── response.ts           # 响应构造工具 (ok/okList/fail)
│   │   ├── requestId.ts          # X-Request-Id 解析
│   │   ├── cors.ts               # CORS 工具
│   │   ├── versioning.ts         # API 版本管理
│   │   ├── apiKey.ts             # API Key 验证 (预留)
│   │   ├── quota.ts              # 配额管理 (预留)
│   │   └── fetcher.ts            # 客户端 fetch 封装
│   ├── auth/                     # 鉴权工具
│   │   ├── checks.ts             # requireAuth / requireRole
│   │   └── AuthError.ts          # 认证异常类
│   ├── security/                 # 安全工具
│   │   ├── headers.ts            # 安全响应 Headers
│   │   └── csp.ts                # CSP 策略生成器
│   ├── validation/               # 输入验证
│   │   ├── schemas.ts            # Zod Schema 定义
│   │   └── parse.ts              # parseOrThrow 工具
│   ├── upload/                   # 上传配置
│   │   └── config.ts             # 文件大小/类型限制
│   ├── supabase/                 # Supabase 客户端
│   │   ├── server.ts             # 服务端客户端
│   │   └── client.ts             # 浏览器端客户端
│   ├── queries.ts                # 数据查询层
│   ├── motion.ts                 # 统一动画 Variants
│   ├── rate-limit.ts             # 进程内存限流
│   ├── db.ts                     # Prisma Client 单例
│   └── utils.ts                  # 通用工具
├── hooks/                        # React Hooks
│   ├── queries/                  # TanStack Query hooks
│   │   ├── usePatterns.ts
│   │   └── usePattern.ts
│   ├── mutations/                # TanStack Mutation hooks
│   │   └── useToggleLike.ts
│   └── useAuthForm.ts            # 认证表单逻辑
├── components/                   # UI 组件
│   ├── providers/                # Context Providers
│   │   ├── QueryProvider.tsx     # TanStack Query
│   │   └── AuthProvider.tsx      # 认证状态同步
│   ├── layout/                   # 布局组件
│   ├── auth/                     # 认证组件
│   ├── gallery/                  # 画廊组件
│   ├── pattern/                  # 纹样详情组件
│   ├── icons/                    # 图标组件
│   └── ui/                       # 通用 UI 组件
├── stores/                       # Zustand Stores
│   ├── useAuthStore.ts           # 认证状态
│   └── useAuthModal.ts           # 登录弹窗状态
├── types/                        # TypeScript 类型
│   ├── index.ts                  # 统一导出入口
│   ├── api.ts                    # API 响应类型
│   ├── pattern.ts                # 纹样领域类型
│   ├── user.ts                   # 用户类型
│   └── ...                       # 其他领域类型
├── data/                         # 静态数据/Mock
└── proxy.ts                      # Next.js 16 Proxy (原 middleware)
```

## 请求处理管线

```
浏览器请求
    ↓
proxy.ts (Next.js Proxy)
├── 注入 X-Request-Id
├── Supabase Session 刷新 (cookie)
├── 路由保护 (/dashboard, /upload, /profile → 未登录重定向 /login)
├── 注入安全 Headers (CSP, X-Frame-Options, etc.)
└── v1 API 路由注入 CORS Headers
    ↓
Route Handler (withApi 包装)
├── 解析/透传 X-Request-Id
├── 执行业务 handler
│   ├── parseOrThrow (Zod 验证)
│   ├── requireAuth / requireRole (鉴权)
│   ├── rateLimit (限流)
│   └── 业务逻辑 (Supabase 查询)
├── 成功 → ok() / okList() → JSON 响应
└── 失败 → AppError → 统一错误 JSON 响应
```

## Provider 层级

```tsx
<html>
  <body>
    <QueryProvider>          {/* TanStack Query */}
      <AuthProvider>         {/* Supabase Auth 状态同步 */}
        <AuthModal />        {/* 全局登录弹窗 */}
        {children}           {/* 页面内容 */}
      </AuthProvider>
    </QueryProvider>
  </body>
</html>
```

## 数据流

| 场景 | 方案 |
|------|------|
| 首屏数据 (SEO) | Server Component 直接调用 `queries.ts` |
| 客户端交互数据 | TanStack Query hooks (`usePatterns`, etc.) |
| 全局 UI 状态 | Zustand stores (`useAuthStore`, `useAuthModal`) |
| 表单状态 | React useState / custom hooks (`useAuthForm`) |
| 服务端变更 | API Route → Supabase → invalidateQueries |
