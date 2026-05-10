# Implementation Plan: Phase 0 Tech Debt Cleanup

## Overview

本计划把 design.md 的"API / 校验 / 鉴权 / 上传 / 限流"五条骨架 + 类型系统补全 + Critical_Bug 守护拆成可独立执行的编码任务。执行顺序严格遵循"基础模块 → 类型 → Route_Handler 迁移 → 消费端收敛 → CI 守护 → 验证"的依赖链。

**全局规则（所有任务默认遵守）**：

- 运行于 Next.js 16.2（App Router，动态 `params: Promise<...>`，middleware 入口为 `src/proxy.ts`）。
- 所有新代码必须保持 `npm run build` / `npm run lint` 零 error 零 warning。
- 注释与文档使用中文，标识符（类型名、函数名、常量名、文件名）使用英文。
- 业务代码只 `throw AppError / AuthError / ValidationError / RateLimitError`；`withApi()` 是把异常转为 HTTP 响应的**唯一**地方。
- 带 `*` 后缀的子任务为可选测试任务；当前 MVP 强烈建议全部勾上，以便 Requirement 1.7 与 design.md §Correctness Properties 被结构性守护。
- 每条 PBT 测试文件顶部注释必须包含 `Feature: phase-0-tech-debt-cleanup, Property N`，并使用 `fast-check` + Vitest，`fc.assert` 的 `numRuns` ≥ 100。

## Tasks

- [x] 1. 依赖与测试基础设施
  - [x] 1.1 添加 `zod` 为生产依赖
    - 在 `package.json` 的 `dependencies` 中新增 `"zod": "^3.23.8"`（或当前 Zod 稳定大版本），运行 `npm install` 写入 `package-lock.json`。
    - 验收：`node -e "require('zod')"` 返回 0；`npm ls zod` 仅显示一个根级安装条目。
    - _Validates: Requirement 3.1_

  - [x] 1.2 添加 `fast-check` 为开发依赖
    - 在 `package.json` 的 `devDependencies` 中新增 `"fast-check": "^3.19.0"`（或当前大版本），运行 `npm install`。
    - 验收：`node -e "require('fast-check')"` 返回 0。
    - _Validates: design.md §Testing Strategy → PBT 库选型（支撑 Property 1–10）_

  - [x] 1.3 配置 Vitest + fast-check 全局 setup
    - 若仓库尚未安装 `vitest`，补装 `vitest` + `@vitest/ui`（dev 依赖）并创建 `vitest.config.ts`，`test.environment = 'node'`，`test.setupFiles = ['./vitest.setup.ts']`。
    - 创建 `vitest.setup.ts`：`process.env.RATE_LIMIT_DISABLED = '1'`（测试态默认关闭限流，满足 Requirement 7.8）。
    - 在 `package.json` 的 `scripts` 中新增 `"test": "vitest run"` 与 `"test:watch": "vitest"`（仅供人工本地使用）。
    - 验收：`npm run test` 在空测试仓库中退出码为 0；`vitest.config.ts` 导出默认配置对象。
    - _Validates: Requirement 7.8；design.md §Testing Strategy_

---

- [x] 2. API 基础设施层（`src/lib/api/*`）
  - [x] 2.1 实现 `src/lib/api/errors.ts`
    - 导出 `type ApiErrorCode`（字面量联合，含 `VALIDATION_ERROR`/`BAD_REQUEST`/`UNAUTHORIZED`/`FORBIDDEN`/`NOT_FOUND`/`PATTERN_NOT_FOUND`/`CONFLICT`/`FILE_TOO_LARGE`/`UNSUPPORTED_MEDIA_TYPE`/`RATE_LIMIT_EXCEEDED`/`INTERNAL_ERROR`）。
    - 导出 `type HttpStatus = 400|401|403|404|409|413|415|429|500`。
    - 导出 `const ERROR_CODE_TO_STATUS: Record<ApiErrorCode, HttpStatus>`（严格 key 覆盖，严禁遗漏）。
    - 导出 `function codeToStatus(code: ApiErrorCode): HttpStatus`。
    - 导出 `class AppError extends Error { code; details?; headers?; constructor(code, message, opts?) }`。
    - 导出 `class ValidationError extends AppError`（默认 code `VALIDATION_ERROR`）。
    - 导出 `class RateLimitError extends AppError`（默认 code `RATE_LIMIT_EXCEEDED`，自动填充 `Retry-After` header）。
    - 验收：类型断言 `ERROR_CODE_TO_STATUS['INTERNAL_ERROR'] === 500`；`new AppError('X' as any, 'm').code === 'X'`（运行时）；`new RateLimitError(1.7).headers?.['Retry-After'] === '2'`。
    - _Validates: Requirements 2.2, 2.7, 6.6, 6.7, 6.8, 7.5；Property 3_

  - [x] 2.2 实现 `src/lib/api/response.ts`
    - 导出 `interface ResponseMeta { requestId: string; timestamp: string }`。
    - 导出 `interface PaginationMeta { page; limit; total; totalPages; hasNext; hasPrev }`。
    - 导出 `interface ApiSuccess<T> { data: T; meta: ResponseMeta }`。
    - 导出 `interface PaginatedResponse<T> { data: T[]; pagination: PaginationMeta; meta: ResponseMeta }`。
    - 导出 `interface ApiError { error: { code: ApiErrorCode; message: string; requestId: string; details?: unknown } }`。
    - 导出 `function ok<T>(data: T, opts?: { status?: 200|201|204 }): { kind: 'ok'; data: T; status?: number }`。
    - 导出 `function okList<T>(items: T[], p: { page; limit; total }): { kind: 'okList'; items: T[]; pagination: PaginationMeta }`，内部用 `totalPages = Math.max(1, Math.ceil(total / limit))`、`hasNext = page < totalPages`、`hasPrev = page > 1`。
    - 导出 `function fail(code, message, opts?): { kind: 'fail'; ... }`（仅用于 Requirement 2.10.a 的显式失败分支）。
    - 验收：`okList([], { page: 1, limit: 10, total: 0 })` 的 `pagination = { page:1, limit:10, total:0, totalPages:1, hasNext:false, hasPrev:false }`。
    - _Validates: Requirements 2.1, 2.8, 2.9, 2.10.a；Property 6_
    - _Depends on: 2.1（`ApiErrorCode` 类型）_

  - [x] 2.3 实现 `src/lib/api/requestId.ts`
    - 导出 `function resolveRequestId(headers: Headers): string`：读取 `x-request-id`，匹配 UUID v4 正则 `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` 则透传，否则返回 `crypto.randomUUID()`。
    - 该函数必须"失败安全"：永不抛错。
    - 验收：`resolveRequestId(new Headers({ 'x-request-id': 'garbage' }))` 返回值匹配 UUID v4 正则；`resolveRequestId(new Headers())` 返回新 UUID v4。
    - _Validates: Requirements 2.4, 2.11；Property 5_

  - [x] 2.4 实现 `src/lib/api/withApi.ts`（组合包装器）
    - 导出 `type HandlerResult<T>` 联合 `ok` / `okList` / `fail` 三种载荷。
    - 导出 `function withApi<T, Ctx = unknown>(handler): (req, ctx) => Promise<NextResponse<ApiSuccess<T>|PaginatedResponse<T>|ApiError>>`。
    - 运行时行为（design.md §1.withApi 4 项）：
      1. `requestId = resolveRequestId(req.headers)`
      2. `try { result = await handler(req, ctx) }` → 根据 `kind` 构造成功响应体，填入 `meta = { requestId, timestamp: new Date().toISOString() }`，默认 200；若 `ok()` 传了 `status` 则覆盖。
      3. `catch (err)`：`AppError` → `status = codeToStatus(err.code)`，响应体 `{ error: { code, message, requestId, details: env==='production' ? undefined : err.details } }`，并合并 `err.headers` 到响应 header。
      4. `catch (err)`：未知异常 → 映射为 `INTERNAL_ERROR` / 500，`console.error(JSON.stringify({ ts, level:'error', requestId, name, message, stack }))` 写 stderr。
      5. 所有分支在响应 header 写入 `X-Request-Id: ${requestId}`。
    - 验收：对一个直接 `return ok({ a: 1 })` 的 handler 调用 `withApi()` 返回的函数，断言 `response.headers.get('x-request-id')` === `(await response.json()).meta.requestId`；对 `throw new AppError('FORBIDDEN', 'x')` 的 handler 断言响应 status 为 403。
    - _Validates: Requirements 2.1, 2.4, 2.5, 2.7, 2.8, 2.9, 2.10, 2.11, 3.8, 5.6, 6.9, 7.6；Property 2, 3, 4, 5_
    - _Depends on: 2.1, 2.2, 2.3_

  - [x] 2.5 PBT Property 2 — 错误响应 envelope 契约
    - **Property 2: Error response envelope contract**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - 文件：`src/lib/api/__tests__/withApi.property2.test.ts`；注释 `Feature: phase-0-tech-debt-cleanup, Property 2`。
    - 用 `fast-check` 生成 `(code: ApiErrorCode, message: string[1..200])`，用 `fc.asyncProperty` 包裹；对每组构造 `throw new AppError(code, message)` 的 handler，经 `withApi()` 执行；断言响应体通过本文件内定义的 `ApiErrorSchema`（Zod）解析（`error.code` 匹配 `^[A-Z][A-Z0-9_]*$`、`error.message` 长度 ∈ [1,200]、`error.requestId` 为 UUID v4），且响应顶层无 `data` 字段。
    - `numRuns: 100`。
    - _Depends on: 2.4_

  - [x] 2.6 PBT Property 3 — 错误码到 HTTP 状态映射一致
    - **Property 3: ERROR_CODE_TO_STATUS is the single source of truth**
    - **Validates: Requirements 2.7, 6.6, 6.7, 6.8**
    - 文件：`src/lib/api/__tests__/withApi.property3.test.ts`。
    - 用 `fc.constantFrom(...Object.keys(ERROR_CODE_TO_STATUS))` 生成 `code`；对每个 `code` 构造 `throw new AppError(code, 'x')` 的 handler；断言响应 `status === ERROR_CODE_TO_STATUS[code]`。
    - _Depends on: 2.1, 2.4_

  - [x] 2.7 PBT Property 4 — production 模式下 details 保密
    - **Property 4: Production details redaction**
    - **Validates: Requirements 2.5**
    - 文件：`src/lib/api/__tests__/withApi.property4.test.ts`。
    - 用 `fast-check` 生成任意 `details`（含嵌套对象、字符串如 `"stack"`/`"supabase"`）；在 `beforeEach` 设 `process.env.NODE_ENV = 'production'`，对 `throw new AppError('INTERNAL_ERROR', 'm', { details })` 的 handler 执行 `withApi()`；断言响应体 `error.details === undefined`，且 JSON 字符串不包含 `"stack"` / `"supabase"` / `"relation"` / `"column"`（白名单外词）。
    - `afterEach` 还原 `NODE_ENV`。
    - _Depends on: 2.4_

  - [x] 2.8 PBT Property 5 — Request_Id 一致性与唯一性
    - **Property 5: Request_Id consistency & global uniqueness**
    - **Validates: Requirements 2.4, 2.8, 2.9, 2.11, 3.8, 6.9, 7.6**
    - 文件：`src/lib/api/__tests__/withApi.property5.test.ts`。
    - 子属性 (a)/(b)：随机选择"成功"/"失败"路径，断言 `response.headers.get('x-request-id')` 与 body 的 `meta.requestId` / `error.requestId` 相等且均为 UUID v4。
    - 子属性 (c)：独立发起 100 次请求（`RATE_LIMIT_DISABLED=1`），收集 100 个 `requestId` 放入 `Set`，断言 `.size === 100`。
    - _Depends on: 2.4_

  - [x] 2.9 PBT Property 6 — 分页元数据正确计算
    - **Property 6: Pagination metadata correctness**
    - **Validates: Requirements 2.8**
    - 文件：`src/lib/api/__tests__/response.property6.test.ts`。
    - 用 `fc.record({ page: fc.integer({ min: 1, max: 1000 }), limit: fc.integer({ min: 1, max: 50 }), total: fc.integer({ min: 0, max: 10_000 }) })`；断言 `okList([], p).pagination` 满足 `totalPages = max(1, ceil(total/limit))`、`hasNext = page < totalPages`、`hasPrev = page > 1`。
    - _Depends on: 2.2_

---

- [x] 3. 校验层（`src/lib/validation/*`）
  - [x] 3.1 实现 `src/lib/validation/schemas.ts`
    - `import { z } from 'zod'`。
    - 命名导出以下 Schema 及其 `z.infer` 类型别名：
      - `ListPatternsQuery` / `ListPatternsQueryInput`：`{ page: coerce.int.min(1).default(1), limit: coerce.int.min(1).max(50).default(12), era?, region?, sort: enum('newest','oldest','popular','likes').default('newest'), q?: string.max(100) }`
      - `CreatePatternBody` / `CreatePatternBodyInput`：`{ name: string.min(1).max(100), description?: string.max(2000), era?: string.max(50), regionId?: uuid, techniqueId?: uuid, imageUrl: url }`
      - `PatternIdParam` / `PatternIdParamInput`：`{ id: z.string().uuid() }`
      - `UploadFileForm` / `UploadFileFormInput`：`{ file: z.instanceof(File) }`
      - `CreateCommentBody` / `CreateCommentBodyInput`：`{ content: string.trim().min(1).max(500), parentId?: uuid }`
      - `ModeratePatternBody`：`{ action: z.enum(['approve','reject']) }`（design.md 迁移计划 E 要求）
    - 文件内禁止出现任何面向业务的运行时逻辑；只做 schema 声明与类型派生。
    - 验收：`ListPatternsQuery.safeParse({}).data` 返回 `{ page:1, limit:12, sort:'newest' }`；`PatternIdParam.safeParse({ id: 'x' }).success === false`。
    - _Validates: Requirements 3.1, 3.2, 3.5, 3.6, 3.7_
    - _Depends on: 1.1_

  - [x] 3.2 实现 `src/lib/validation/parse.ts`
    - 导出 `function parseOrThrow<S extends z.ZodTypeAny>(schema: S, input: unknown, message?: string): z.infer<S>`：内部 `schema.safeParse(input)`，失败 `throw new ValidationError(message ?? '请求参数校验失败', result.error.issues)`。
    - 验收：成功分支返回类型 `z.infer<S>`；失败分支抛 `ValidationError` 且 `.details === result.error.issues`。
    - _Validates: Requirements 3.3, 3.4, 3.4.a, 3.4.b；Property 7_
    - _Depends on: 2.1_

  - [x] 3.3 PBT Property 7 — Zod 是业务逻辑的唯一闸门
    - **Property 7: Zod validation is the sole gate into business logic**
    - **Validates: Requirements 3.3, 3.4, 3.4.a, 3.5, 3.6, 2.10**
    - 文件：`src/lib/validation/__tests__/parse.property7.test.ts`。
    - 准备一个包裹 `parseOrThrow(CreatePatternBody, body)` 的 mock Route_Handler，后续调用注入的 `dbInsertMock`。
    - 子属性 (a)：用 `fast-check` 生成违反约束的 body（`name` 超长、`imageUrl` 非 URL、`regionId` 非 UUID）；断言响应 status=400、`error.code='VALIDATION_ERROR'`、`dbInsertMock.mock.calls.length === 0`。
    - 子属性 (b)：用 `fast-check` 生成满足约束的 body；断言响应 status ∈ [200,299]（handler 返回 `ok(...)`）。
    - _Depends on: 3.1, 3.2, 2.4_

---

- [x] 4. 鉴权层（`src/lib/auth/*`）
  - [x] 4.1 实现 `src/lib/auth/AuthError.ts`
    - 导出 `class AuthError extends AppError`，构造函数签名 `constructor(kind: 'UNAUTHORIZED'|'FORBIDDEN', message?: string)`，默认中文 message（`'请先登录'` / `'无权限'`）。
    - 导出 `get status(): 401 | 403`（等价于 `codeToStatus(this.code)`）。
    - 验收：`new AuthError('UNAUTHORIZED').status === 401`；`new AuthError('FORBIDDEN').code === 'FORBIDDEN'`；`instanceof AppError === true`。
    - _Validates: Requirements 5.3, 5.5, 5.6_
    - _Depends on: 2.1_

  - [x] 4.2 实现 `src/lib/auth/checks.ts`
    - 导出 `interface AuthedUser { id: string; email: string | null; role: Role }`。
    - 导出 `async function requireAuth(): Promise<AuthedUser>`：
      1. `const supabase = await createClient()`（`@/lib/supabase/server`）
      2. `const { data, error } = await supabase.auth.getUser()`
      3. 若 `error || !data.user || !data.user.id` → `throw new AuthError('UNAUTHORIZED')`
      4. `const { data: row } = await supabase.from('hp_users').select('role').eq('id', data.user.id).single()`；`role = row?.role ?? 'user'`
      5. 返回 `{ id, email, role }`
    - 导出 `async function requireRole(roles: ReadonlyArray<Role>): Promise<AuthedUser>`：先 `requireAuth`；若 `!roles.includes(user.role)` → `throw new AuthError('FORBIDDEN')`。
    - 若 `@/types/user` 尚未导出 `Role` 类型，本任务允许从本文件内局部声明 `type Role = 'user'|'admin'`；Task 7.7 完成后改为从 `@/types` 导入。
    - 验收：Mock Supabase 返回 `{ data: { user: null }, error: null }` → `requireAuth()` 抛 `AuthError('UNAUTHORIZED')`；返回合法 user + role='user' 且 `requireRole(['admin'])` 抛 `AuthError('FORBIDDEN')`。
    - _Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.9_
    - _Depends on: 4.1_

  - [x] 4.3 PBT Property 8 — Auth 层的二分判定
    - **Property 8: Auth layer binary decision**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.9**
    - 文件：`src/lib/auth/__tests__/checks.property8.test.ts`。
    - 用 `vi.mock('@/lib/supabase/server')` 伪造 `createClient()`；用 `fast-check` 生成 `(authResult, userRole, requiredRoles)` 三元组：
      - (a)：`authResult ∈ { error!=null, user=null, user.id=null, ok }` × 任意 role；断言 `requireAuth()` 在 ok 分支返回非空对象、其余分支抛 `AuthError('UNAUTHORIZED')`。
      - (b)：在 (a) 的 ok 分支基础上，若 `requiredRoles.includes(userRole)` → `requireRole(requiredRoles)` 返回用户；否则抛 `AuthError('FORBIDDEN')`。
    - _Depends on: 4.2_

---

- [x] 5. 上传校验层（`src/lib/upload/config.ts`）
  - [x] 5.1 实现 `src/lib/upload/config.ts`
    - 导出 `const UPLOAD_CONFIG = { maxSize: 10*1024*1024, allowedTypes: ['image/jpeg','image/png','image/webp'] as const, allowedExts: ['jpg','jpeg','png','webp'] as const } as const`。
    - 导出 `type AllowedMime = (typeof UPLOAD_CONFIG.allowedTypes)[number]`；`type AllowedExt` 同理。
    - 导出 `function extractExt(filename: string): string`（取最后一个 `.` 后的小写子串；无后缀返回 `''`）。
    - 导出 `function validateUpload(file: File): void`：按 `size → mime → ext` 顺序短路校验；分别抛 `new AppError('FILE_TOO_LARGE', ...)` / `new AppError('UNSUPPORTED_MEDIA_TYPE', ...)` / `new ValidationError(...)`。
    - 验收：`validateUpload(new File([new ArrayBuffer(11*1024*1024)], 'a.jpg', { type:'image/jpeg' }))` 抛 `FILE_TOO_LARGE`；顺序保证：11MB 的 `.exe` 文件仍然先以 `FILE_TOO_LARGE` 抛出。
    - _Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
    - _Depends on: 2.1_

  - [x] 5.2 PBT Property 9 — 上传校验短路顺序
    - **Property 9: Upload validation short-circuit order**
    - **Validates: Requirements 6.5, 6.6, 6.7, 6.8, 6.10**
    - 文件：`src/lib/upload/__tests__/config.property9.test.ts`。
    - 用 `fast-check` 生成 `(size ∈ [0, 2*maxSize], mime ∈ {任意}, nameExt ∈ {任意})` 笛卡尔积；断言 `validateUpload` 行为严格遵循四级判定树（size → mime → ext → pass）。
    - 额外单测（同文件 `describe` 另一 `it`）：当 `requireAuth()` 抛 `AuthError` 时，断言 Supabase storage `upload` mock 的调用次数 === 0（Requirement 6.10）。
    - _Depends on: 5.1, 4.2_

---

- [x] 6. 限流层（`src/lib/rate-limit.ts`）
  - [x] 6.1 实现 `src/lib/rate-limit.ts`
    - 导出 `interface RateLimitQuota { windowSec: number; max: number }`。
    - 导出 `const QUOTAS = { 'POST /api/patterns': { windowSec:60, max:10 }, 'POST /api/upload': { windowSec:60, max:20 }, 'POST /api/patterns/[id]/comments': { windowSec:60, max:30 } } as const satisfies Record<string, RateLimitQuota>`。
    - 导出 `type QuotaKey = keyof typeof QUOTAS`。
    - 导出 `function rateLimit(quota: QuotaKey, subjectId: string): void`：
      - 若 `process.env.RATE_LIMIT_DISABLED === '1'` → 直接 `return`。
      - 存储挂载到 `globalThis.__hbRateLimitStore__`（跨热重载保持），`Map<string, { count: number; resetAt: number }>`。
      - key 为 `${quota}:${subjectId}`。
      - 窗口过期则重置为 `{ count:1, resetAt: now + windowSec*1000 }`；否则 `count++`；`count > max` 时 `throw new RateLimitError(Math.ceil((resetAt-now)/1000))`。
    - 导出 `function __resetRateLimiterForTests(): void`：清空 store。
    - 验收：`RATE_LIMIT_DISABLED=1` 下连续调用 1000 次不抛错；`='0'` 下第 11 次 `rateLimit('POST /api/patterns', 'u1')` 抛 `RateLimitError`，`.headers['Retry-After']` 为 1..60 的正整数字符串。
    - _Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.5.b, 7.6, 7.8_
    - _Depends on: 2.1_

  - [x] 6.2 PBT Property 10 — 限流窗口语义与可禁用性
    - **Property 10: Rate limit window semantics & disable switch**
    - **Validates: Requirements 7.3, 7.4, 7.5, 7.5.b, 7.6, 7.8**
    - 文件：`src/lib/__tests__/rate-limit.property10.test.ts`。
    - (a) `RATE_LIMIT_DISABLED='1'` 下任意 `(quotaKey, subjectId, repeats)` 的 `repeats` 次调用永不抛错。
    - (b) `='0'`（本测试 `beforeEach` 设置并调 `__resetRateLimiterForTests()`）下，用 `fc.constantFrom(...QUOTA_KEYS)` 生成 `quotaKey`；断言前 `max` 次 `rateLimit(quotaKey, 'u')` 不抛错，第 `max+1` 次抛 `RateLimitError`，错误映射为 429（用 `withApi` 再跑一次），响应 `Retry-After` header 为 1..60 的正整数字符串。
    - (c) `subjectId` 两两独立：对 'u1' 打满配额后，'u2' 的第 1 次调用仍不抛错。
    - _Depends on: 6.1, 2.4_

---

- [x] 7. 类型系统补全（`src/types/*`）
  - [x] 7.1 新增 `src/types/collection.ts`
    - 导出 `interface Collection { id: string; ownerId: string; name: string; description: string | null; isPublic: boolean; createdAt: string }`。
    - 导出 `interface CollectionItem { id: string; collectionId: string; patternId: string; addedAt: string }`。
    - 验收：`tsc --noEmit` 通过；从该文件 `export` 数量 ≥ 2。
    - _Validates: Requirements 4.1, 4.2_

  - [x] 7.2 新增 `src/types/comment.ts`
    - 导出 `interface Comment { id; patternId; userId; parentId: string | null; content; status: 'approved'|'pending'|'rejected'; createdAt }`。
    - 导出 `interface CommentWithReplies extends Comment { replies: Comment[] }`。
    - _Validates: Requirements 4.1, 4.3_

  - [x] 7.3 新增 `src/types/notification.ts`
    - 导出 `type NotificationType = 'comment_reply' | 'like' | 'moderation_result' | 'system'`。
    - 导出 `interface Notification { id; userId; type: NotificationType; payload: Record<string, unknown>; readAt: string | null; createdAt: string }`。
    - _Validates: Requirements 4.1, 4.4_

  - [x] 7.4 新增 `src/types/search.ts`
    - 导出 `interface ImageSearchParams { imageUrl: string; limit?: number }`。
    - 导出 `interface ColorSearchParams { hexColors: string[]; limit?: number }`。
    - _Validates: Requirements 4.1, 4.5_

  - [x] 7.5 新增 `src/types/ai.ts`
    - 导出 `type AiTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed'`。
    - 导出 `interface GenerationParams { prompt: string; seed?: number; style?: string }`。
    - 导出 `interface AiTask { id; userId; status: AiTaskStatus; params: GenerationParams; resultUrl: string | null; createdAt: string }`。
    - _Validates: Requirements 4.1, 4.6_

  - [x] 7.6 扩展 `src/types/api.ts`
    - 从 `@/lib/api/errors` re-export `ApiErrorCode` / `HttpStatus`。
    - 从 `@/lib/api/response` re-export `ResponseMeta` / `PaginationMeta` / `ApiSuccess` / `PaginatedResponse` / `ApiError`。
    - 保留/新增 `type ApiResult<T> = ApiSuccess<T> | ApiError`（向后兼容）。
    - 文件内禁止重复声明已在 `@/lib/api/*` 中定义的类型。
    - _Validates: Requirements 2.x 的类型层 + Requirement 4.1, 4.7_
    - _Depends on: 2.1, 2.2_

  - [x] 7.7 新增 `src/types/index.ts` 统一导出
    - `export * from './api'; export * from './pattern'; export * from './user'; export * from './collection'; export * from './comment'; export * from './notification'; export * from './search'; export * from './ai'`。
    - 验收：随机业务文件 `import type { Collection, PaginationMeta, Comment } from '@/types'` 通过 `tsc --noEmit`。
    - _Validates: Requirements 4.1, 4.8, 4.9_
    - _Depends on: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

---

- [x] 8. `src/proxy.ts` 请求 ID 前置注入
  - [x] 8.1 扩展 `src/proxy.ts` 透传 `X-Request-Id`
    - 在现有 Supabase 会话校验逻辑**之前**插入：读取入站 `x-request-id`；非合法 UUID v4 则用 `crypto.randomUUID()` 生成；通过 `request.headers.set('x-request-id', requestId)` 写回 `NextResponse.next({ request })`。
    - 该段逻辑必须"失败安全"（不得抛错），并保留现有 Supabase 会话刷新与受保护路由重定向行为不变。
    - 不新增 `src/middleware.ts`（Next.js 16 已以 `proxy.ts` 为准）。
    - 验收：单测用 `NextRequest` 触发 `proxy()`，断言返回的 `NextResponse` 的 `request.headers.get('x-request-id')` 为 UUID v4；入站已带合法 ID 时透传不覆盖。
    - _Validates: Requirements 2.4, 2.11；design.md §Request_Id 生成与传播策略_
    - _Depends on: 2.3_

---

- [x] 9. Checkpoint — 基础模块落地
  - Ensure all tests pass, ask the user if questions arise.
  - 建议执行：`npx tsc --noEmit` 与 `npm run test` 确认 Property 2–10 + 单测全绿。任何 PBT 失败都不得进入 Route_Handler 迁移阶段。

---

- [x] 10. Route Handler 迁移（薄 handler + 组合调用）
  - [x] 10.1 迁移 `src/app/api/patterns/route.ts` 的 `GET`
    - 用 `withApi` 包装；第一行 `const query = parseOrThrow(ListPatternsQuery, Object.fromEntries(new URL(req.url).searchParams))`；之后 `await getPatterns(query)` 并返回 `okList(patterns, { page, limit, total })`。
    - 删除该 handler 内的手写 try/catch、`NextResponse.json` 字面量错误、`page`/`limit` 手写边界检查。
    - 不得与 Task 10.2 并行（两者都修改同一文件）。
    - 验收：`curl '/api/patterns?limit=9999'` 返回 400 `VALIDATION_ERROR`；`limit=5` 返回 200 + `pagination.limit=5`。
    - _Validates: Requirements 2.1, 2.7, 2.8, 3.3, 3.5；Property 2, 3, 6, 7_
    - _Depends on: 2.4, 3.1, 3.2_

  - [x] 10.2 迁移 `src/app/api/patterns/route.ts` 的 `POST`
    - 用 `withApi` 包装；顺序：`parseOrThrow(CreatePatternBody, await req.json())` → `await requireAuth()` → `rateLimit('POST /api/patterns', user.id)` → Supabase `insert`（失败 `throw new AppError('INTERNAL_ERROR','创建失败',{cause:error})`）→ 回填 `hp_pattern_media` → `return ok(pattern, { status: 201 })`。
    - 删除内联 `supabase.auth.getUser()` 判空与手写字段必填校验。
    - **必须在 Task 10.1 完成后串行执行**（同一文件）。
    - _Validates: Requirements 2.7, 2.9, 3.3, 3.6, 5.7, 7.3；Property 2, 5, 7, 8, 10_
    - _Depends on: 10.1, 2.4, 3.1, 3.2, 4.2, 6.1_

  - [x] 10.3 迁移 `src/app/api/patterns/[id]/route.ts`
    - 对所有导出的 HTTP 方法（`GET` 至少，若存在 `PATCH`/`DELETE` 同步迁移）套 `withApi<T, { params: Promise<{ id: string }> }>`。
    - Handler 第一行 `const { id } = parseOrThrow(PatternIdParam, await ctx.params)`；`await ctx.params` 属 Next.js 16 样板，允许置于 `parseOrThrow` 参数位。
    - `GET`：调 `getPatternById(id)`；为空时 `throw new AppError('PATTERN_NOT_FOUND', '纹样不存在')`；成功返回 `ok({ ...pattern, related })`。
    - _Validates: Requirements 1.4, 2.1, 2.7, 3.3；Property 2, 3, 7_
    - _Depends on: 2.4, 3.1, 3.2_

  - [x] 10.4 迁移 `src/app/api/upload/route.ts` 的 `POST`
    - 顺序：`parseOrThrow(UploadFileForm, Object.fromEntries(await req.formData()))` → `requireAuth()` → `rateLimit('POST /api/upload', user.id)` → `validateUpload(form.file)` → `extractExt` 计算 `path = ${user.id}/${Date.now()}.${ext}` → Supabase Storage `upload`（失败 `throw new AppError('INTERNAL_ERROR','上传失败',{cause:error})`）→ `getPublicUrl` → `return ok({ url: publicUrl }, { status: 201 })`。
    - 未登录用户必须在 `requireAuth` 抛 401，**不得**进入 `validateUpload` 或 storage 调用。
    - _Validates: Requirements 2.7, 5.7, 6.5, 6.6, 6.7, 6.8, 6.10, 7.3；Property 2, 3, 5, 8, 9, 10_
    - _Depends on: 2.4, 3.1, 3.2, 4.2, 5.1, 6.1_

  - [x] 10.5 迁移 `src/app/api/patterns/[id]/comments/route.ts`
    - `GET`：`withApi` 包装；`parseOrThrow(PatternIdParam, await ctx.params)`；返回 `okList(comments, { page, limit, total })`（若本路由支持分页）或 `ok(comments)`。
    - `POST`：`parseOrThrow(PatternIdParam, await ctx.params)` → `parseOrThrow(CreateCommentBody, await req.json())` → `requireAuth()` → `rateLimit('POST /api/patterns/[id]/comments', user.id)` → 写库 → `return ok(comment, { status: 201 })`。
    - _Validates: Requirements 2.7, 3.3, 5.7, 7.3；Property 2, 7, 8, 10_
    - _Depends on: 2.4, 3.1, 3.2, 4.2, 6.1_

  - [x] 10.6 迁移 `src/app/api/patterns/[id]/like/route.ts`
    - `POST`：`withApi` + `parseOrThrow(PatternIdParam, await ctx.params)` + `requireAuth()`；保留原 RPC 调用；返回 `ok({ liked: boolean, likeCount: number })`。
    - `GET`：`withApi` + `parseOrThrow(PatternIdParam, await ctx.params)`；未登录走 `ok({ liked: false })` 分支（不调 `requireAuth`），已登录正常查询。
    - 不接入限流（读操作 + 低敏写操作）。
    - _Validates: Requirements 2.7, 3.3, 5.2；Property 2, 5, 7, 8_
    - _Depends on: 2.4, 3.1, 3.2, 4.2_

  - [x] 10.7 迁移 `src/app/api/patterns/[id]/moderate/route.ts`
    - `PATCH`：`withApi` + `parseOrThrow(PatternIdParam, await ctx.params)` + `parseOrThrow(ModeratePatternBody, await req.json())` + `await requireRole(['admin'])` → 写库。
    - 删除内联的 `role === 'admin'` 判断；禁止出现 Requirement 5.8.a 所说的 `// TODO(auth-layer)` 注释（过渡态不应在新代码中出现）。
    - _Validates: Requirements 2.7, 3.3, 5.4, 5.5, 5.8；Property 7, 8_
    - _Depends on: 2.4, 3.1, 3.2, 4.2_

  - [x] 10.8 迁移 `src/app/api/regions/route.ts`
    - `GET`：`withApi` 包装；返回 `ok(regions)`。删除手写 try/catch 与错误 JSON 字面量。
    - _Validates: Requirements 2.7, 2.9；Property 2, 5_
    - _Depends on: 2.4_

  - [x] 10.9 迁移 `src/app/api/stats/route.ts`
    - `GET`：`withApi` 包装；返回 `ok(stats)`。删除手写 try/catch。
    - _Validates: Requirements 2.7, 2.9；Property 2, 5_
    - _Depends on: 2.4_

---

- [x] 11. Critical Bug 回归守护 — Gallery 详情页
  - [x] 11.1 加固 `src/app/gallery/[id]/page.tsx`
    - 确认默认导出与 `generateMetadata` 均使用 `params: Promise<{ id: string }>` 并在使用 `id` 前 `await params`。
    - 数据来源一律经 `getPatternById(id)`（`@/lib/queries`）；文件顶部 **禁止** 出现 `from '@/data/mock/patterns'` 或等价 import。
    - 在主 `try` 外层加一层兜底 `catch (err)`：若 `isNextNotFoundError(err)` 则 `throw err`；否则 `console.error(JSON.stringify({ ts, level:'error', path:'/gallery/[id]', id, err: String(err), stack:(err as Error)?.stack }))` 后 `notFound()`。
    - 验收：对 `id` 不存在的请求返回 404；对关联数据缺失/模板异常也返回 404 而非 500（Requirement 1.2.a）。
    - _Validates: Requirements 1.1, 1.2, 1.2.a, 1.3；Property 1_
    - _Depends on: 7.7（类型入口存在以便页面使用 `@/types`）_

  - [x] 11.2 PBT Property 1 — Gallery 详情页数据来自数据库
    - **Property 1: Gallery detail page renders from DB**
    - **Validates: Requirements 1.1**
    - 文件：`src/app/gallery/[id]/__tests__/page.property1.test.tsx`。
    - 用 `fast-check` 生成合法 `patternId`（UUID v4）与对应的 `{ id, name, status ∈ {'approved','featured'} }` 记录，mock `getPatternById`；执行页面默认导出的 async 组件（`await Component({ params: Promise.resolve({ id }) })`），用 `@testing-library/react` 或 `renderToStaticMarkup` 断言 `<h1>` 的 accessible name 严格等于 `record.name`。
    - 同文件补一个 `it` 调用 `fs.readFileSync('src/app/gallery/[id]/page.tsx','utf8')` 做 AST/字符串搜索，断言不出现 `mockPatterns` 字符串。
    - _Depends on: 11.1_

---

- [x] 12. SiteFooter 收敛
  - [x] 12.1 `SiteFooter` 根元素添加 `role="contentinfo"`
    - 修改 `src/components/layout/SiteFooter.tsx` 的根 `<footer>` → `<footer role="contentinfo">`；保留 `variant: 'light' | 'dark'` 与 `className` props。
    - 不得破坏现有 5 个消费方（`app/page.tsx`、`gallery/page.tsx`、`gallery/[id]/page.tsx`、`profile/page.tsx`、`dashboard/page.tsx`）。
    - _Validates: Requirement 8.2, 8.6_

  - [x] 12.2 Map 页注释横幅 + 其他页面审查
    - 在 `src/app/map/page.tsx` 文件顶部添加 design.md 迁移计划 G 指定的注释横幅（"全屏 3D/地图交互视图，不渲染 Footer"）。
    - 审查 `src/app/login/**`、`src/app/auth/**`、`src/app/upload/**`、`src/app/create/**`、`src/app/workshop/**` 等 page.tsx：若页面结构包含主布局则补 `<SiteFooter variant="light" />`；若为全屏/弹窗式页面则按 Map 的格式加注释横幅。
    - 每个被修改的页面 SHALL 在"使用 SiteFooter"或"刻意不渲染"两态之一，禁止同时保留内联 `<footer>` 与 `<SiteFooter>`。
    - _Validates: Requirements 8.1, 8.3, 8.4, 8.7_

  - [x] 12.3 SiteFooter 渲染 + a11y 快照测试
    - 文件：`src/components/layout/__tests__/SiteFooter.test.tsx`。
    - 使用 `@testing-library/react` 渲染 `<SiteFooter variant="light" />` 与 `<SiteFooter variant="dark" />`；断言 `getByRole('contentinfo')` 存在、`querySelectorAll('footer').length === 1`、版权区含可聚焦 `<a>` 元素。
    - _Validates: Requirement 8.6；design.md §Testing Strategy（快照 / a11y）_
    - _Depends on: 12.1, 1.3_

---

- [x] 13. CI 静态守护（grep-based guardrails）
  - [x] 13.1 实现 `scripts/lint-guards.mjs`
    - 创建 Node ESM 脚本，使用 `node:fs` + `node:path` 递归扫描 `src/`（可调 `node:child_process` 的 `spawnSync` 跑 ripgrep，但 Windows 上退回纯 JS 实现以保证可移植）。
    - 必须逐条检查并在任一命中时 `process.exit(1)` 并打印命中位置（文件:行号:内容）：
      1. `aspect-\[\$\{` 在 `src/**/*.{ts,tsx}` 中零命中（Requirement 1.5）。
      2. `class(Name)?=["'][^"']*min-screen` 在 `src/**/*.{ts,tsx}` 中零命中（Requirement 1.6）。
      3. 在 `src/app/api/**/route.ts` 中 `z\.(object|string|number|enum|array)\(` 零命中（Requirement 3.4.b / design.md §CI 检查清单）。
      4. `from ['"]@/data/mock/patterns['"]` 在 `src/app/gallery/[id]/page.tsx` 中零命中（Requirement 1.1 回归守护）。
      5. `^\s*<footer` 在 `src/**/*.{ts,tsx}` 中除 `SiteFooter.tsx` 外零命中（Requirement 8.4 / 8.5）。
    - 全部通过时 `console.log('lint-guards: OK')` 并 `process.exit(0)`。
    - _Validates: Requirements 1.5, 1.6, 3.4.b, 8.4, 8.5；Requirement 1.1 的结构性守护_

  - [x] 13.2 将 lint-guards 钩入 `package.json` 脚本
    - 新增 script `"lint:guards": "node scripts/lint-guards.mjs"`。
    - 修改（或新增）`"lint": "next lint && npm run lint:guards"`，保证 `npm run lint` 同时驱动 ESLint 与 grep 守护。
    - 若仓库已有 CI 工作流（如 `.github/workflows/ci.yml`），在不属于本任务的前提下**不改动** CI 配置；仅通过 `npm run lint` 形成本地 + CI 的统一入口。
    - 该任务与 Task 1.1/1.2 都触碰 `package.json`，必须在 1.1/1.2 之后执行。
    - _Validates: Requirement 1.7；design.md §CI 检查清单_
    - _Depends on: 13.1, 1.2_

---

- [x] 14. Checkpoint — 迁移完结
  - Ensure all tests pass, ask the user if questions arise.
  - 建议执行：`npm run lint`（含 `lint:guards`）、`npm run test`、`npx tsc --noEmit`。任何命中或失败都必须回到对应 Task（10.x / 11.x / 12.x / 13.x）修复，不得带病进入最终验证。

---

- [x] 15. 最终验证
  - [x] 15.1 运行 `npm run build` 并确认零 error 零 warning
    - 命令：`npm run build`；抓取 stdout/stderr 并 grep `warn|error`（大小写不敏感）：若有命中即判定失败，回到对应实现任务修复。
    - _Validates: Requirement 1.7_

  - [x] 15.2 运行 `npm run lint` 并确认零 error 零 warning
    - 命令：`npm run lint`（此时已含 `lint:guards`）；断言输出尾部出现 `0 problems`。
    - _Validates: Requirements 1.5, 1.6, 1.7, 3.4.b, 8.4, 8.5_

  - [x] 15.3 运行 `npx tsc --noEmit` 确认零类型错误
    - 命令：`npx tsc --noEmit`；退出码必须为 0。
    - _Validates: Requirements 4.9, 3.4.a_

  - [x] 15.4 运行 `npm run test`（vitest run）确认全部 PBT + 单测通过
    - 命令：`npm run test`；PBT 每条至少 100 runs，无 counterexample。
    - 该任务被标记为可选：若 Task 2.5–2.9 / 3.3 / 4.3 / 5.2 / 6.2 / 11.2 / 12.3 被跳过，本任务失去意义；若任一 PBT 任务被实现，则本任务**必须**执行。
    - _Validates: design.md §Correctness Properties 1–10_

  - [x] 15.5 运行 `node scripts/lint-guards.mjs` 确认 5 项 grep 均为零命中
    - 命令：`node scripts/lint-guards.mjs`；退出码 0 且输出 `lint-guards: OK`。该任务独立于 Task 15.2 的包装层，用于人工定位具体命中。
    - _Validates: Requirements 1.1, 1.5, 1.6, 3.4.b, 8.4, 8.5_

## Notes

- 带 `*` 后缀的子任务均为可选；所有带 `*` 的测试任务对应 design.md 中的 10 条 Correctness Properties，强烈建议全部执行以满足 Requirement 1.7 的"结构化守护"目标。
- 所有 Property 测试文件命名统一为 `*.propertyN.test.ts(x)`，并在文件顶部注释 `Feature: phase-0-tech-debt-cleanup, Property N`；`fc.assert` 的 `numRuns` ≥ 100。
- 本计划**不**包含数据访问层（Prisma ↔ Supabase）迁移（ADR #1）、Auth 栈替换（ADR #2）、Zustand / TanStack Query 启用（ADR #3），也不引入 Redis；以上均为 Phase 1+/3+ 工作。
- 检查点 Task 9 / Task 14 是"停下来自检并与用户确认"的点；若 PBT 或 lint-guards 红灯，必须回到对应实现任务修复而非跳过。
- Route_Handler 迁移（Task 10.x）可与 Gallery 页加固（Task 11.1）并行，因为它们写的是不同文件。
- Task 10.1 与 10.2 写同一个文件（`src/app/api/patterns/route.ts`），**必须**串行；Task 1.1 / 1.2 / 13.2 均修改 `package.json`，三者**必须**在不同波次串行执行。

## Task Dependency Graph

下列 JSON 为并行执行波次调度依据；同一波次内任务相互独立，可并发执行；波次 N 的任务仅在波次 0..N-1 全部完成后方可启动。同一波次内所有任务不共享目标文件。

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.3", "7.1", "7.2", "7.3", "7.4", "7.5", "12.1", "12.2", "13.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.1", "3.2", "4.1", "5.1", "6.1", "7.6", "8.1"] },
    { "id": 2, "tasks": ["1.3", "2.4", "4.2", "7.7", "13.2"] },
    { "id": 3, "tasks": ["2.5", "2.6", "2.7", "2.8", "2.9", "3.3", "4.3", "5.2", "6.2", "11.1", "12.3"] },
    { "id": 4, "tasks": ["10.1", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9", "11.2"] },
    { "id": 5, "tasks": ["10.2"] },
    { "id": 6, "tasks": ["15.1", "15.2", "15.3", "15.4", "15.5"] }
  ]
}
```

### 波次说明（可读注释）

- **Wave 0 — 独立基础**：`package.json` 首次写入（1.1）、`errors.ts` / `requestId.ts`（零依赖）、类型叶子文件（7.1–7.5）、SiteFooter a11y 修饰（12.1）、Map / 其他页面 Footer 审查（12.2）、lint-guards 脚本主体（13.1）。
- **Wave 1 — 依赖 errors.ts / zod**：`package.json` 二次写入（1.2）、`response.ts`、Zod schemas / parse、`AuthError.ts`、`upload/config.ts`、`rate-limit.ts`、`types/api.ts`、`proxy.ts`。
- **Wave 2 — 组合 / 汇总**：vitest 配置（依赖 fast-check）、`withApi.ts`、`auth/checks.ts`、`types/index.ts`、`package.json` 三次写入（13.2 钩入 lint-guards）。
- **Wave 3 — PBT 测试 + 页面加固**：Property 2–10（依赖 withApi + 对应实现 + vitest）、Gallery 详情页加固（依赖类型入口）、SiteFooter 测试。
- **Wave 4 — Route_Handler 迁移 + Gallery PBT**：各自独立文件可并行；Task 10.1 先于 10.2（同一文件）。
- **Wave 5 — 同文件串行**：Task 10.2。
- **Wave 6 — 最终验证**：只读命令，互不冲突，可并行。

### 同文件冲突清单（本表驱动波次隔离）

| 目标文件 | 相关任务 | 隔离策略 |
| --- | --- | --- |
| `package.json` | 1.1, 1.2, 13.2 | 三个不同波次（0 / 1 / 2）串行 |
| `src/app/api/patterns/route.ts` | 10.1（GET）, 10.2（POST） | 10.1 在 Wave 4、10.2 在 Wave 5 |
| `src/types/api.ts` | 7.6（仅本任务写） | 单任务，无冲突 |
| `src/proxy.ts` | 8.1（仅本任务写） | 单任务，无冲突 |
| `src/components/layout/SiteFooter.tsx` | 12.1（仅本任务写） | 单任务，无冲突 |

---

## Workflow Completion

本 workflow 的职责到此结束 —— 它只负责生成 design.md 与 tasks.md 两份规划物件。**不**在此 workflow 内实现 Phase 0。

开始执行时，请打开本文件 (`d:\project\HBPattern\HBPattern\.kiro\specs\phase-0-tech-debt-cleanup\tasks.md`)，点击任一任务右侧的 **Start task** 进入实现阶段。建议严格按 Task Dependency Graph 波次顺序推进；若需并行，同一波次内的任务可同时派发给不同执行者，不会产生文件冲突。
