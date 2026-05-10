# Phase 0 技术债清理 — 变更总结

> 执行时间：2026-05-10  
> 规范文件：`.kiro/specs/phase-0-tech-debt-cleanup/`  
> 目标：消除阻塞性 Critical Bug，建立 API / 校验 / 鉴权 / 上传 / 限流五条骨架，补全类型系统，统一 SiteFooter，并以 Property-Based Testing 结构性守护所有正确性属性。

---

## 一、依赖与测试基础设施

### 新增依赖

| 包 | 类型 | 版本 | 用途 |
|---|---|---|---|
| `zod` | production | `^3.23.8` | 集中式输入校验 |
| `fast-check` | dev | `^3.19.0` | Property-Based Testing |
| `vitest` | dev | `^4.1.5` | 测试运行器 |
| `@vitest/ui` | dev | `^4.1.5` | 测试 UI |
| `@testing-library/react` | dev | `^16.3.2` | React 组件测试 |
| `@testing-library/jest-dom` | dev | `^6.9.1` | DOM 断言扩展 |
| `jsdom` | dev | `^29.1.1` | 浏览器环境模拟 |

### 新增配置文件

- **`vitest.config.ts`** — `test.environment = 'node'`，`setupFiles = ['./vitest.setup.ts']`，`@` 路径别名
- **`vitest.setup.ts`** — 全局设置 `RATE_LIMIT_DISABLED=1`（测试态关闭限流）
- **`tsconfig.json`** — 排除 `prisma/` 与 `src/lib/db.ts`（未生成的 Prisma client，避免 tsc 报错）

### package.json 脚本变更

```json
"lint": "eslint . --max-warnings=0 && npm run lint:guards",
"lint:guards": "node scripts/lint-guards.mjs",
"test": "vitest run",
"test:watch": "vitest"
```

---

## 二、API 基础设施层（`src/lib/api/`）

### `src/lib/api/errors.ts`（新建）

- `type ApiErrorCode` — 11 个字面量联合（`VALIDATION_ERROR` / `BAD_REQUEST` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `PATTERN_NOT_FOUND` / `CONFLICT` / `FILE_TOO_LARGE` / `UNSUPPORTED_MEDIA_TYPE` / `RATE_LIMIT_EXCEEDED` / `INTERNAL_ERROR`）
- `type HttpStatus` — `400 | 401 | 403 | 404 | 409 | 413 | 415 | 429 | 500`
- `const ERROR_CODE_TO_STATUS` — 错误码到 HTTP 状态的单一真相表
- `function codeToStatus(code)` — 查表辅助
- `class AppError extends Error` — 业务异常基类，携带 `code`、`details`、`headers`
- `class ValidationError extends AppError` — 默认 code `VALIDATION_ERROR`
- `class RateLimitError extends AppError` — 默认 code `RATE_LIMIT_EXCEEDED`，自动填充 `Retry-After` header

### `src/lib/api/response.ts`（新建）

- 接口：`ResponseMeta`、`PaginationMeta`、`ApiSuccess<T>`、`PaginatedResponse<T>`、`ApiError`
- `function ok<T>(data, opts?)` — 构造单资源成功载荷（支持 `status: 200|201|204`）
- `function okList<T>(items, p)` — 构造分页列表载荷，自动计算 `totalPages`/`hasNext`/`hasPrev`
- `function fail(code, message, opts?)` — 构造显式失败载荷

### `src/lib/api/requestId.ts`（新建）

- `function resolveRequestId(headers)` — 读取 `x-request-id`，非合法 UUID v4 则生成新值；失败安全，永不抛错

### `src/lib/api/withApi.ts`（新建）

- `type HandlerResult<T>` — `ok | okList | fail` 三种载荷联合
- `function withApi<T, Ctx>(handler)` — Route Handler 包装器，负责：
  1. 生成/透传 `requestId`
  2. 构造标准成功响应体（含 `meta.requestId` + `timestamp`）
  3. 捕获 `AppError` → 映射 HTTP 状态 + 裁剪 production details
  4. 捕获未知异常 → `INTERNAL_ERROR/500` + 结构化 stderr 日志
  5. 所有分支写入 `X-Request-Id` 响应 header

---

## 三、校验层（`src/lib/validation/`）

### `src/lib/validation/schemas.ts`（新建）

集中定义所有 Zod schema，Route Handler 禁止内联 `z.object(...)`：

| Schema | 用途 |
|---|---|
| `ListPatternsQuery` | `GET /api/patterns` query 参数 |
| `CreatePatternBody` | `POST /api/patterns` 请求体 |
| `PatternIdParam` | `/api/patterns/[id]` 路径参数（UUID 校验）|
| `UploadFileForm` | `POST /api/upload` multipart form |
| `CreateCommentBody` | `POST /api/patterns/:id/comments` 请求体 |
| `ModeratePatternBody` | `PATCH /api/patterns/:id/moderate` 请求体 |

### `src/lib/validation/parse.ts`（新建）

- `function parseOrThrow<S>(schema, input, message?)` — Zod 校验唯一入口，失败抛 `ValidationError`（携带 `issues`）

---

## 四、鉴权层（`src/lib/auth/`）

### `src/lib/auth/AuthError.ts`（新建）

- `class AuthError extends AppError` — `UNAUTHORIZED`（401）/ `FORBIDDEN`（403）
- `get status(): 401 | 403` — 便捷访问器

### `src/lib/auth/checks.ts`（新建）

- `interface AuthedUser { id, email, role }` — 鉴权成功后的用户对象
- `async function requireAuth()` — 调用 Supabase `auth.getUser()`，失败抛 `AuthError('UNAUTHORIZED')`；从 `hp_users` 读取 `role`（默认 `'user'`）
- `async function requireRole(roles)` — 先 `requireAuth`，角色不匹配抛 `AuthError('FORBIDDEN')`

---

## 五、上传校验层（`src/lib/upload/config.ts`）（新建）

- `UPLOAD_CONFIG` — `maxSize: 10MB`，`allowedTypes: ['image/jpeg','image/png','image/webp']`，`allowedExts: ['jpg','jpeg','png','webp']`
- `type AllowedMime` / `type AllowedExt` — 派生类型
- `function extractExt(filename)` — 取最后一个 `.` 后的小写子串
- `function validateUpload(file)` — 严格按 `size → mime → ext` 顺序短路校验，分别抛 `FILE_TOO_LARGE` / `UNSUPPORTED_MEDIA_TYPE` / `ValidationError`

---

## 六、限流层（`src/lib/rate-limit.ts`）（新建）

- `interface RateLimitQuota { windowSec, max }`
- `const QUOTAS` — 三条配额（`POST /api/patterns`: 10/60s，`POST /api/upload`: 20/60s，`POST /api/patterns/[id]/comments`: 30/60s）
- `type QuotaKey`
- `function rateLimit(quota, subjectId)` — 进程内存计数，挂载到 `globalThis.__hbRateLimitStore__`；`RATE_LIMIT_DISABLED=1` 时直接返回；超配额抛 `RateLimitError`
- `function __resetRateLimiterForTests()` — 测试辅助，清空 store

---

## 七、类型系统补全（`src/types/`）

### 新增文件

| 文件 | 导出内容 |
|---|---|
| `collection.ts` | `Collection`、`CollectionItem` |
| `comment.ts` | `Comment`、`CommentWithReplies` |
| `notification.ts` | `NotificationType`、`Notification` |
| `search.ts` | `ImageSearchParams`、`ColorSearchParams` |
| `ai.ts` | `AiTaskStatus`、`GenerationParams`、`AiTask` |
| `index.ts` | 统一 re-export 所有类型模块 |

### 修改文件

- **`src/types/api.ts`** — 改为从 `@/lib/api/errors` 和 `@/lib/api/response` re-export，保留 `ApiResult<T>` 向后兼容别名，删除重复声明

---

## 八、`src/proxy.ts` 扩展

在现有 Supabase 会话校验逻辑**之前**插入 Request_Id 前置注入：

- 读取入站 `x-request-id`，非合法 UUID v4 则 `crypto.randomUUID()` 生成
- 通过 `NextResponse.next({ request: { headers } })` 透传给下游 Route Handler
- 失败安全：不得抛错，不影响现有 Supabase 会话刷新与受保护路由重定向

---

## 九、Route Handler 迁移（`src/app/api/`）

所有 Route Handler 统一改为"薄 handler + 组合调用"形态，删除内联 try/catch、手写错误 JSON、内联 Zod schema、内联 `supabase.auth.getUser()` 判空。

| 文件 | 迁移内容 |
|---|---|
| `patterns/route.ts` GET | `withApi` + `parseOrThrow(ListPatternsQuery)` + `okList` |
| `patterns/route.ts` POST | `withApi` + `parseOrThrow(CreatePatternBody)` + `requireAuth` + `rateLimit` |
| `patterns/[id]/route.ts` GET | `withApi` + `parseOrThrow(PatternIdParam)` + `PATTERN_NOT_FOUND` |
| `patterns/[id]/comments/route.ts` GET/POST | `withApi` + `parseOrThrow` + `requireAuth` + `rateLimit` |
| `patterns/[id]/like/route.ts` GET/POST | `withApi` + `parseOrThrow` + `requireAuth`（POST）/ 软鉴权（GET）|
| `patterns/[id]/moderate/route.ts` PATCH | `withApi` + `parseOrThrow` + `requireRole(['admin'])` |
| `regions/route.ts` GET | `withApi` + `ok` |
| `stats/route.ts` GET | `withApi` + `ok` |
| `upload/route.ts` POST | `withApi` + `parseOrThrow(UploadFileForm)` + `requireAuth` + `rateLimit` + `validateUpload` |

---

## 十、Critical Bug 守护（`src/app/gallery/[id]/page.tsx`）

- 确认 `generateMetadata` 与默认导出均使用 `params: Promise<{ id: string }>` 并 `await params`
- 数据来源一律经 `getPatternById(id)`，禁止 mock 数据导入
- 数据获取阶段包裹在 `try/catch` 中：
  - `unstable_rethrow(err)` 保留 Next.js 内部控制流（`notFound`/`redirect`）
  - 其他异常：结构化 JSON 日志（`ts`/`level`/`path`/`id`/`err`/`stack`）+ `notFound()` 降级为 404

---

## 十一、SiteFooter 统一（`src/components/layout/SiteFooter.tsx`）

- 根 `<footer>` 添加 `role="contentinfo"`（无障碍要求）
- 审查所有页面，确保每个页面处于"使用 SiteFooter"或"刻意不渲染（含注释横幅）"两态之一：
  - `map/page.tsx`、`login/page.tsx`、`create/page.tsx`、`workshop/page.tsx` — 全屏交互视图，添加注释横幅
  - `upload/page.tsx` — 标准页面，补充 `<SiteFooter variant="light" />`

---

## 十二、CI 静态守护（`scripts/lint-guards.mjs`）

纯 Node.js ESM 脚本，递归扫描 `src/`，5 项 grep 守护：

| 检查项 | 模式 | 要求 |
|---|---|---|
| 动态 Tailwind aspect 类名 | `aspect-\[\$\{` | 零命中 |
| `min-screen` CSS 类名 | `class(Name)?=["'][^"']*min-screen` | 零命中 |
| route.ts 内联 Zod schema | `z\.(object\|string\|number\|enum\|array)\(` | 零命中 |
| gallery 页 mock 数据导入 | `from ['"]@/data/mock/patterns['"]` | 零命中 |
| 内联 `<footer>`（除 SiteFooter.tsx）| `^\s*<footer` | 零命中 |

---

## 十三、Property-Based Testing（13 个测试文件，55 个测试）

| 文件 | Property | 验证需求 |
|---|---|---|
| `src/__tests__/proxy.test.ts` | proxy X-Request-Id 注入 | Req 2.4, 2.11 |
| `src/lib/api/__tests__/withApi.test.ts` | withApi 验收测试（11 个）| Req 2.x |
| `src/lib/api/__tests__/withApi.property2.test.ts` | Property 2: 错误响应 envelope 契约 | Req 2.1–2.4 |
| `src/lib/api/__tests__/withApi.property3.test.ts` | Property 3: 错误码→HTTP 状态映射一致 | Req 2.7 |
| `src/lib/api/__tests__/withApi.property4.test.ts` | Property 4: production details 保密 | Req 2.5 |
| `src/lib/api/__tests__/withApi.property5.test.ts` | Property 5: Request_Id 一致性与唯一性 | Req 2.4, 2.11 |
| `src/lib/api/__tests__/response.property6.test.ts` | Property 6: 分页元数据正确计算 | Req 2.8 |
| `src/lib/validation/__tests__/parse.property7.test.ts` | Property 7: Zod 是业务逻辑唯一闸门 | Req 3.3–3.6 |
| `src/lib/auth/__tests__/checks.property8.test.ts` | Property 8: Auth 层二分判定 | Req 5.2–5.9 |
| `src/lib/upload/__tests__/config.property9.test.ts` | Property 9: 上传校验短路顺序 | Req 6.5–6.10 |
| `src/lib/__tests__/rate-limit.property10.test.ts` | Property 10: 限流窗口语义与可禁用性 | Req 7.3–7.8 |
| `src/app/gallery/[id]/__tests__/page.property1.test.tsx` | Property 1: Gallery 详情页数据来自数据库 | Req 1.1 |
| `src/components/layout/__tests__/SiteFooter.test.tsx` | SiteFooter 渲染 + a11y 快照 | Req 8.6 |

所有 PBT 每条 ≥ 100 runs，无 counterexample。

---

## 十四、最终验证结果

| 命令 | 结果 |
|---|---|
| `npm run build` | ✅ 零 error / 零 warning |
| `npm run lint` | ✅ 零 error / 零 warning + lint-guards OK |
| `npx tsc --noEmit` | ✅ 零类型错误 |
| `npm run test` | ✅ 13 文件 / 55 测试全部通过 |
| `node scripts/lint-guards.mjs` | ✅ 5 项 grep 均为零命中 |

---

## 十五、架构决策记录（ADR 遵守情况）

- **ADR #1**（Prisma + Supabase 并行）：Phase 0 不迁移数据访问层，Route Handler 继续使用 Supabase 直连
- **ADR #2**（Supabase Auth）：`requireAuth`/`requireRole` 基于 Supabase Auth，未引入 NextAuth.js
- **ADR #3**（Zustand + TanStack Query）：Phase 0 不启用，保持现状
- **限流**：进程内存实现，已在设计文档记录"多实例不精确"的已知限制，Phase 3+ 切换 Redis

---

## 十六、文件变更清单

### 新建文件（28 个）

```
scripts/lint-guards.mjs
src/__tests__/proxy.test.ts
src/app/gallery/[id]/__tests__/page.property1.test.tsx
src/components/layout/__tests__/SiteFooter.test.tsx
src/lib/__tests__/rate-limit.property10.test.ts
src/lib/api/__tests__/response.property6.test.ts
src/lib/api/__tests__/withApi.property2.test.ts
src/lib/api/__tests__/withApi.property3.test.ts
src/lib/api/__tests__/withApi.property4.test.ts
src/lib/api/__tests__/withApi.property5.test.ts
src/lib/api/__tests__/withApi.test.ts
src/lib/api/errors.ts
src/lib/api/requestId.ts
src/lib/api/response.ts
src/lib/api/withApi.ts
src/lib/auth/AuthError.ts
src/lib/auth/__tests__/checks.property8.test.ts
src/lib/auth/checks.ts
src/lib/rate-limit.ts
src/lib/upload/__tests__/config.property9.test.ts
src/lib/upload/config.ts
src/lib/validation/__tests__/parse.property7.test.ts
src/lib/validation/parse.ts
src/lib/validation/schemas.ts
src/types/ai.ts
src/types/collection.ts
src/types/comment.ts
src/types/index.ts
src/types/notification.ts
src/types/search.ts
vitest.config.ts
vitest.setup.ts
```

### 修改文件（21 个）

```
package.json
package-lock.json
tsconfig.json
scripts/upload-seed-images.ts
src/app/api/patterns/route.ts
src/app/api/patterns/[id]/route.ts
src/app/api/patterns/[id]/comments/route.ts
src/app/api/patterns/[id]/like/route.ts
src/app/api/patterns/[id]/moderate/route.ts
src/app/api/regions/route.ts
src/app/api/stats/route.ts
src/app/api/upload/route.ts
src/app/create/page.tsx
src/app/gallery/[id]/page.tsx
src/app/login/page.tsx
src/app/map/page.tsx
src/app/upload/page.tsx
src/app/workshop/page.tsx
src/components/layout/SiteFooter.tsx
src/proxy.ts
src/types/api.ts
```
