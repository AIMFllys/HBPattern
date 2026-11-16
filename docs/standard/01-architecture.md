# 01 - 项目架构总览

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 框架 | Next.js (App Router) | 16.2.1 |
| 运行时 | Node.js | 20+ |
| 语言 | TypeScript | 5.x |
| 样式 | Tailwind CSS | v4 |
| 数据库 | Supabase PostgreSQL | 17 (PostGIS + pgvector) |
| Schema/Migration | supabase/migrations/*.sql | SQL migrations 为 schema 真相源 |
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
├── app/                              # Next.js App Router
│   ├── (main)/                       # 页面 Route Group
│   │   ├── layout.tsx                # 透传布局
│   │   ├── template.tsx              # 页面过渡动画
│   │   ├── loading.tsx
│   │   ├── page.tsx                  # 首页 /
│   │   ├── gallery/                  # 纹样画廊 /gallery（含 [id] 详情）
│   │   ├── map/                      # 3D 文化地图 /map
│   │   ├── create/                   # AI 创作中心 /create
│   │   ├── workshop/                 # 跨界工坊 /workshop
│   │   ├── dashboard/                # 管理后台 /dashboard [受保护]
│   │   ├── profile/                  # 个人中心 /profile [受保护]
│   │   └── upload/                   # 上传 /upload [受保护]
│   ├── (auth)/                       # 认证 Route Group，仅登录
│   │   ├── layout.tsx                # 无 Header/Footer
│   │   └── login/                    # 登录/注册 /login
│   ├── auth/callback/                # OAuth 回调
│   ├── api/                          # 内部 BFF API
│   │   ├── v1/                       # 对外公开 API（只读 + CORS）
│   │   │   ├── patterns/
│   │   │   ├── regions/
│   │   │   └── stats/
│   │   ├── patterns/                 # 列表、详情、点赞、评论、审核
│   │   ├── regions/
│   │   ├── stats/
│   │   └── upload/
│   ├── layout.tsx                    # 根布局 (Providers)
│   ├── globals.css                   # 设计 Token + 全局样式
│   ├── error.tsx                     # 全局错误边界
│   ├── not-found.tsx                 # 404 页面
│   ├── loading.tsx                   # 全局加载状态
│   └── sitemap.ts
├── components/
│   ├── admin/                        # 审核列表
│   ├── auth/                         # AuthForm、AuthModal、改密面板
│   ├── create/                       # 创作视口、参数与导出
│   │   └── models/                   # Frame、Scarf、TShirt、PhoneCase、TeaCup、Fan
│   ├── gallery/                      # GalleryClient
│   ├── home/
│   │   ├── HeroContent.tsx
│   │   └── FeaturedPatterns.tsx
│   ├── icons/                        # Logo、Icon
│   ├── layout/                       # SiteHeader、SiteFooter、导航
│   ├── map/                          # HubeiMapClient 与图层、图例
│   ├── pattern/                      # 详情：LikeButton、评论、色板等
│   ├── providers/
│   │   ├── QueryProvider.tsx         # TanStack Query
│   │   ├── AuthProvider.tsx          # 认证状态同步
│   │   ├── ThemeProvider.tsx         # 主题
│   │   └── ServiceWorkerRegistration.tsx
│   ├── search/                       # ColorSearch
│   ├── ui/                           # BottomSheet、ColorPicker、ParameterSlider
│   └── workshop/
│       ├── AdjustPanel.tsx           # 仍从此文件导出 AdjustPanel
│       ├── adjust/                   # 从 AdjustPanel 拆出的调节区块
│       │   ├── ColorAdjustSection.tsx
│       │   ├── TransformSection.tsx
│       │   ├── SymmetrySection.tsx
│       │   └── AdjustChrome.tsx      # 面板头、开关与空态
│       ├── WorkshopClient.tsx
│       ├── WorkshopCanvas.tsx
│       ├── LayerPanel.tsx
│       └── PatternAssetPanel.tsx
├── lib/
│   ├── api/
│   │   ├── withApi.ts                # Route Handler 统一包装器
│   │   ├── errors.ts                 # 错误码 + AppError
│   │   ├── error-messages.ts         # 错误消息映射
│   │   ├── response.ts               # ok / okList / fail
│   │   ├── requestId.ts              # X-Request-Id
│   │   ├── cors.ts                   # CORS
│   │   ├── versioning.ts             # API 版本
│   │   ├── apiKey.ts                 # API Key 验证（预留）
│   │   ├── quota.ts                  # 配额（预留）
│   │   └── fetcher.ts                # 客户端 fetch
│   ├── auth/                         # requireAuth、路由、profile
│   │   ├── checks.ts
│   │   ├── AuthError.ts
│   │   ├── routes.ts
│   │   └── profile.ts
│   ├── security/
│   │   ├── headers.ts
│   │   └── csp.ts
│   ├── validation/
│   │   ├── schemas.ts
│   │   └── parse.ts
│   ├── upload/
│   │   └── config.ts                 # 文件大小与类型
│   ├── supabase/
│   │   ├── server.ts                 # 服务端客户端，供 queries.ts 使用
│   │   └── client.ts                 # 浏览器端客户端
│   ├── create/
│   │   └── exportAssets.ts
│   ├── map/
│   │   ├── sources/                  # 地市、地点、绑定、河流、邻省
│   │   ├── style/
│   │   │   └── inkStyle.ts           # MapLibre 水墨样式
│   │   ├── patternGeo.ts
│   │   └── patternAnalysis.ts
│   ├── textures/
│   │   ├── generatePattern.ts        # 对外仅 generatePatternCanvas
│   │   ├── motifs/                   # 从 generatePattern.ts 拆出的绘制函数
│   │   │   ├── geometric.ts          # 几何纹；模块内使用，不再额外导出
│   │   │   ├── field.ts              # 花、波、云
│   │   │   └── creature.ts           # 龙、凤
│   │   ├── patternPresets.ts
│   │   ├── productConfigs.ts
│   │   └── textureCache.ts
│   ├── workshop/                     # 画布、图层合成、色彩、对称、导出
│   │   ├── canvasEngine.ts
│   │   ├── layerCompositor.ts
│   │   ├── colorAdjust.ts
│   │   ├── symmetry.ts
│   │   └── exportUtils.ts
│   ├── queries.ts                    # 查询层（单文件）
│   ├── rate-limit.ts                 # 进程内存限流
│   ├── motion.ts                     # 统一动画 Variants
│   ├── theme.ts
│   ├── utils.ts
│   ├── patternMedia.ts
│   ├── patternPlaceholder.ts
│   ├── image-placeholder.ts
│   └── createStorage.ts              # 创作快照 localStorage
├── hooks/
│   ├── queries/
│   │   ├── usePatterns.ts            # 纹样列表
│   │   └── useWorkshopPatterns.ts    # 工坊纹样检索，内部复用 usePatterns
│   ├── useAuthForm.ts
│   ├── useCanvasHistory.ts           # 工坊撤销与草稿
│   ├── usePatternTexture.ts          # 创作贴图
│   └── useScrollReveal.ts
├── stores/
│   ├── useAuthStore.ts
│   ├── useAuthModal.ts
│   ├── useCreateStore.ts             # 产品、纹样、材质、相机
│   └── useWorkshopStore.ts           # 图层、工具、视口、对称
├── types/
│   ├── index.ts                      # 再导出 api、pattern、user、collection、comment、notification、search、ai、map
│   ├── api.ts
│   ├── pattern.ts
│   ├── user.ts
│   ├── collection.ts
│   ├── comment.ts
│   ├── notification.ts
│   ├── search.ts
│   ├── ai.ts
│   ├── map.ts
│   ├── create.ts                     # 调用方直接引用子路径
│   ├── workshop.ts                   # 调用方直接引用子路径
│   └── theme.ts                      # 调用方直接引用子路径
├── data/
│   ├── map/                          # hubei.ts 名录与 GeoJSON
│   │   ├── hubei.ts
│   │   ├── hubeiBoundaries.ts
│   │   ├── hubei-boundaries.json
│   │   ├── hubei-regions-geo.json
│   │   ├── hubei-rivers.json
│   │   └── neighbor-provinces-geo.json
│   ├── mock/
│   │   └── patterns.ts               # 地图页查询失败时的回退
│   └── traditional-colors.ts         # 传统色，供颜色搜索
├── proxy.ts                          # Next.js 16 Proxy 入口
└── __tests__/                        # proxy 与数据流测试
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
│   └── 业务逻辑 (queries.ts → Supabase)
├── 成功 → ok() / okList() → JSON 响应
└── 失败 → AppError → 统一错误 JSON 响应
```

## Provider 层级

根布局 `src/app/layout.tsx`：

```tsx
<html>
  <body>
    <ThemeProvider>                {/* 主题 */}
      <ServiceWorkerRegistration />
      <QueryProvider>              {/* TanStack Query */}
        <AuthProvider>             {/* Supabase Auth 状态同步 */}
          <AuthModal />            {/* 全局登录弹窗 */}
          {children}               {/* 页面内容 */}
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </body>
</html>
```

## 数据流

| 场景 | 方案 |
|------|------|
| 首屏数据 (SEO) | Server Component 调用 `queries.ts`，经 `supabase/server.ts` 查 Supabase PostgreSQL |
| 客户端交互数据 | TanStack Query：`usePatterns`、`useWorkshopPatterns` |
| 工坊状态 | Zustand `useWorkshopStore` |
| 创作状态 | Zustand `useCreateStore` |
| 全局 UI 状态 | Zustand `useAuthStore`、`useAuthModal` |
| 表单状态 | React useState / `useAuthForm` |
| 点赞 | `components/pattern/LikeButton.tsx` 直接请求 `/api/patterns/[id]/like` |
| 服务端变更 | Route Handler 写入 Supabase |
