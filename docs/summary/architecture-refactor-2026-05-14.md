# 架构重构实施总结

> **日期**: 2026-05-14
> **范围**: 全栈架构重组、API 基础设施、安全机制、状态管理、动画系统

---

## 一、核心发现

### Next.js 16 Breaking Change

Next.js 16 将 `middleware.ts` 重命名为 `proxy.ts`，导出函数名为 `proxy`（非 `middleware`）。项目中的 `src/proxy.ts` **一直是正确的**，已被 Next.js 正常加载（构建输出确认 `ƒ Proxy (Middleware)`）。

### 注册问题根因

`scripts/temp/logbut.log` 中的错误是**浏览器扩展**产生的（Chrome message channel 错误），非应用代码问题。注册失败需从以下方向排查：

1. **Supabase Redirect URL 白名单**：确保 `http://localhost:6427/auth/callback` 已添加
2. **Supabase 邮件配额**：免费版每小时限 4 封验证邮件
3. **邮件模板配置**：Dashboard → Authentication → Email Templates
4. **Network 请求**：在浏览器 DevTools Network tab 查看 `signUp` 请求的实际 HTTP 响应

---

## 二、改动清单

### Task 1: Middleware 确认

- 确认 `src/proxy.ts` 已被 Next.js 16 正确加载
- 尝试创建的 `src/middleware.ts` 与 proxy.ts 冲突，已删除

### Task 2: Route Groups 重组

**新增文件：**
- `src/app/(main)/layout.tsx` — 主站布局容器
- `src/app/(auth)/layout.tsx` — 认证页面布局容器
- `src/app/(main)/template.tsx` — 页面过渡动画（Task 5 产出）

**移动文件：**
| 原路径 | 新路径 |
|--------|--------|
| `src/app/page.tsx` | `src/app/(main)/page.tsx` |
| `src/app/gallery/` | `src/app/(main)/gallery/` |
| `src/app/map/` | `src/app/(main)/map/` |
| `src/app/create/` | `src/app/(main)/create/` |
| `src/app/workshop/` | `src/app/(main)/workshop/` |
| `src/app/dashboard/` | `src/app/(main)/dashboard/` |
| `src/app/profile/` | `src/app/(main)/profile/` |
| `src/app/upload/` | `src/app/(main)/upload/` |
| `src/app/login/` | `src/app/(auth)/login/` |

**保持不动：**
- `src/app/api/` — API 路由
- `src/app/auth/` — OAuth 回调
- `src/app/layout.tsx` — 根布局
- `src/app/globals.css`、`error.tsx`、`not-found.tsx`、`loading.tsx`

**修复：**
- `src/app/(main)/gallery/[id]/__tests__/page.property1.test.tsx` — 更新硬编码路径

**效果：** URL 路径完全不变，代码组织更清晰。

### Task 3: API 版本化 + CORS

**新增文件：**
- `src/lib/api/cors.ts` — CORS headers 生成 + OPTIONS 预检处理
- `src/lib/api/versioning.ts` — API 版本常量 + headers
- `src/app/api/v1/patterns/route.ts` — 公开 API：纹样列表
- `src/app/api/v1/patterns/[id]/route.ts` — 公开 API：纹样详情
- `src/app/api/v1/regions/route.ts` — 公开 API：地区列表
- `src/app/api/v1/stats/route.ts` — 公开 API：平台统计

**修改文件：**
- `src/lib/api/withApi.ts` — 所有响应自动注入 `X-API-Version: v1` header

**设计决策：**
- v1 路由仅暴露 GET（只读公开 API）
- 每个 v1 路由包含 OPTIONS handler 支持 CORS preflight
- CORS 允许的 origin 通过 `CORS_ALLOWED_ORIGINS` 环境变量配置，默认 `*`

### Task 4: API Key 基础设施预留

**新增文件：**
- `src/lib/api/apiKey.ts` — `resolveApiCaller()` 从 `X-API-Key` header 验证 key
- `src/lib/api/quota.ts` — `TIER_QUOTAS` 定义 free/basic/premium 限额

**当前状态：** 代码骨架就位，未在任何路由中启用。未来启用只需在 withApi 选项中设置 `apiKeyRequired: true`。

### Task 5: 统一动画机制

**新增文件：**
- `src/lib/motion.ts` — 统一 variants：`fadeIn`、`slideUp`、`scaleIn`、`staggerContainer`、`pageTransition`、`defaultTransition`
- `src/app/(main)/template.tsx` — 页面切换时自动应用 `pageTransition` 动画

**保持不变：**
- `AuthModal.tsx` — 保留自定义 spring 动画（弹窗缩放 + 遮罩淡入）
- `MobileDrawer.tsx` — 保留自定义 spring 物理（抽屉滑入）

### Task 6: API 错误体系增强

**修改文件：**
- `src/lib/api/errors.ts` — 新增 `SERVICE_UNAVAILABLE` (503) 错误码

**新增文件：**
- `src/lib/api/error-messages.ts` — 所有错误码的中英文消息映射 + `getErrorMessage(code, locale)` 函数

### Task 7: TanStack Query 接入

**新增文件：**
- `src/components/providers/QueryProvider.tsx` — QueryClient 配置（staleTime: 60s, retry: 1）
- `src/lib/api/fetcher.ts` — `apiFetch<T>()` + `apiFetchPaginated<T>()` 统一封装
- `src/hooks/queries/usePatterns.ts` — 纹样列表查询 hook
- `src/hooks/queries/usePattern.ts` — 纹样详情查询 hook
- `src/hooks/mutations/useToggleLike.ts` — 点赞 mutation（含缓存失效）

**修改文件：**
- `src/app/layout.tsx` — 添加 `QueryProvider` 包裹（在 AuthProvider 外层）

### Task 8: 安全机制统一

**新增文件：**
- `src/lib/security/headers.ts` — 安全响应 headers 常量
- `src/lib/security/csp.ts` — CSP 策略生成器（dev/prod 不同策略）

**修改文件：**
- `src/proxy.ts` — 所有响应注入安全 headers + CSP

**注入的 Headers：**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' [dev: 'unsafe-eval' 'unsafe-inline']; ...
```

---

## 三、验证结果

| 检查项 | 结果 |
|--------|------|
| `npx tsc --noEmit` | ✅ 无错误 |
| `npx vitest run` | ✅ 13 文件 / 55 测试全部通过 |
| `npx next build` | ✅ 构建成功，所有路由正确映射 |

---

## 四、新项目结构

```
src/
├── app/
│   ├── (main)/              ← 公开页面
│   │   ├── layout.tsx
│   │   ├── template.tsx     ← 页面过渡动画
│   │   ├── page.tsx         ← 首页
│   │   ├── gallery/
│   │   ├── map/
│   │   ├── create/
│   │   ├── workshop/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── upload/
│   ├── (auth)/              ← 认证页面
│   │   ├── layout.tsx
│   │   └── login/
│   ├── api/
│   │   ├── v1/             ← 对外公开 API（只读 + CORS）
│   │   │   ├── patterns/
│   │   │   ├── regions/
│   │   │   └── stats/
│   │   ├── patterns/       ← 内部 BFF API
│   │   ├── regions/
│   │   ├── stats/
│   │   └── upload/
│   ├── auth/callback/       ← OAuth 回调
│   ├── layout.tsx           ← 根布局（QueryProvider + AuthProvider）
│   └── globals.css
├── lib/
│   ├── api/
│   │   ├── withApi.ts       ← 统一 API 包装器
│   │   ├── cors.ts          ← CORS 工具
│   │   ├── versioning.ts    ← 版本管理
│   │   ├── apiKey.ts        ← API Key 验证（预留）
│   │   ├── quota.ts         ← 配额管理（预留）
│   │   ├── fetcher.ts       ← 客户端 fetch 封装
│   │   ├── errors.ts        ← 错误码体系
│   │   ├── error-messages.ts ← i18n 错误消息
│   │   ├── response.ts      ← 响应构造工具
│   │   └── requestId.ts     ← 请求追踪
│   ├── security/
│   │   ├── headers.ts       ← 安全响应 headers
│   │   └── csp.ts           ← CSP 策略
│   ├── auth/                ← 鉴权工具
│   ├── validation/          ← Zod 验证
│   ├── upload/              ← 上传配置
│   ├── motion.ts            ← 统一动画 variants
│   ├── queries.ts           ← 数据查询层
│   └── supabase/            ← Supabase 客户端
├── hooks/
│   ├── queries/             ← TanStack Query hooks
│   │   ├── usePatterns.ts
│   │   └── usePattern.ts
│   ├── mutations/           ← TanStack Mutation hooks
│   │   └── useToggleLike.ts
│   └── useAuthForm.ts
├── components/
│   ├── providers/
│   │   ├── QueryProvider.tsx
│   │   └── AuthProvider.tsx
│   └── ...
├── stores/                  ← Zustand stores
├── types/                   ← TypeScript 类型
└── proxy.ts                 ← Next.js 16 Proxy（原 middleware）
```

---

## 五、后续建议

1. **修复注册**：在 Supabase Dashboard 中添加 `http://localhost:6427/auth/callback` 到 Redirect URLs
2. **启用 API Key**：当准备对外开放 API 时，在 v1 路由中调用 `resolveApiCaller()`
3. **Redis 限流**：当前 rate-limit 使用进程内存，部署后需接入 Redis
4. **GalleryClient 重构**：使用 `usePatterns` hook 替代当前的内部 state 管理
5. **OpenAPI 文档**：基于 JSDoc 注释 + zod-to-openapi 自动生成 API 文档
