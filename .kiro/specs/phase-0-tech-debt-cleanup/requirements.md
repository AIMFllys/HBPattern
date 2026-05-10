# Requirements Document

## Introduction

Phase 0（技术债清理 + 规范建立）是 HBPattern 项目的基础工程化阶段，目标是在进入 Phase 1 数据层迁移之前，消除 `CODE_REVIEW_AND_ARCHITECTURE_PLAN.md` 第 1.2 节列出的阻塞性缺陷，并落地第 2 节所述的长期接口规范骨架。本规范聚焦以下八个需求域：

1. Critical Bug 修复与回归守护（详情页数据、动态类名、拼写错误、Next.js 16 params 契约）
2. 统一 API 错误响应契约（英文 `code` / 中文 `message` / `requestId` / 状态码映射）
3. 输入验证层（Zod 集中 schema，所有 Route Handler 首步校验）
4. 类型系统补全（`collection.ts`/`comment.ts`/`notification.ts`/统一导出入口）
5. 权限检查中间件（`requireAuth` / `requireRole` + 错误到 HTTP 映射）
6. 文件上传安全校验（大小 / MIME / 扩展名白名单）
7. 速率限制（进程内存版，敏感写操作配额）
8. `SiteFooter` 组件统一使用（消除重复 Footer）

本文档只描述"必须满足什么"。具体实现方案（文件结构、函数签名、技术栈细节）放到 design.md。

> **工程约束**
> - 项目运行于 **Next.js 16.2**（App Router / Route Handlers / 动态 `params` 为 `Promise`）。所有新代码前请先阅读 `node_modules/next/dist/docs/` 对应章节（见 AGENTS.md）。
> - 保留 Supabase Auth（ADR #2），不引入 NextAuth.js。
> - Prisma 与 Supabase 直连并行期（ADR #1），Phase 0 不强制迁移数据访问层。
> - Zustand + TanStack Query 已安装（ADR #3），Phase 0 不启用。

## Glossary

- **HBPattern**：湖北传统纹样展示平台，本规范的目标系统。
- **API_Route**：Next.js 16 `src/app/api/**/route.ts` 中的 Route Handler（GET/POST/PATCH/DELETE）。
- **Route_Handler**：API_Route 中处理单一 HTTP 方法的导出函数。
- **Validation_Layer**：基于 Zod 的集中式输入校验模块，位于 `src/lib/validation/schemas.ts`。
- **Auth_Layer**：统一权限检查模块，位于 `src/lib/auth/checks.ts`，导出 `requireAuth` / `requireRole`。
- **Upload_Layer**：文件上传校验模块，位于 `src/lib/upload/config.ts`，导出 `UPLOAD_CONFIG` 与校验辅助。
- **Rate_Limiter**：进程内存实现的速率限制模块，位于 `src/lib/rate-limit.ts`。
- **Site_Footer**：已存在的布局组件 `src/components/layout/SiteFooter.tsx`，本规范要求它成为全站唯一 Footer 实现。
- **Request_Id**：每次 HTTP 请求在进入 API_Route 时生成的 UUID v4 字符串，用于日志与错误追踪。
- **Api_Error_Code**：错误响应中的业务错误码，格式为英文大写蛇形（如 `VALIDATION_ERROR`、`PATTERN_NOT_FOUND`），与 HTTP 状态码解耦。
- **Pagination_Meta**：分页响应的元数据，包含 `page` / `limit` / `total` / `totalPages` / `hasNext` / `hasPrev`。
- **Response_Meta**：响应顶层的 `meta` 对象，包含 `requestId` 与 ISO 8601 `timestamp`。
- **Critical_Bug**：`CODE_REVIEW_AND_ARCHITECTURE_PLAN.md` 第 1.2 节表格中列出的 4 个阻塞性缺陷。
- **Public_Status**：纹样状态枚举中对终端用户可见的取值集合（`approved` 与 `featured`）。

## Requirements

### Requirement 1: Critical Bug 修复与回归守护

**User Story:** 作为 HBPattern 的产品与工程负责人，我希望第 1.2 节列出的 4 个 Critical_Bug 被彻底修复并有断言级守护，以便后续重构不会使这些缺陷回归。

> **现状说明**：截至本规范撰写时，仓库中这 4 个 Bug 的代码已被初步修复；但无任何自动化断言或人工验收条款防止回退。本需求将正确行为固化为验收条件。

#### Acceptance Criteria

1. WHEN 用户访问 `/gallery/:id` 且 `id` 存在于数据库且状态属于 Public_Status, THE HBPattern SHALL 渲染该 `id` 对应纹样的名称、描述、媒体与 palette，而非任何来源于 `mockPatterns` 的硬编码数据。
2. WHEN 用户访问 `/gallery/:id` 且 `id` 在数据库中不存在, THE HBPattern SHALL 返回 Next.js 16 `notFound()` 触发的 404 页面。
2.a. IF 页面渲染过程因纹样关联数据缺失（如 palette/region 关联对象缺失）或模板抛出异常, THEN THE HBPattern SHALL 将其视为与"记录不存在"等价并返回 404 页面（而非向用户暴露 500），同时通过结构化日志记录原始错误与 Request_Id 以便追踪。
3. THE 文件 `src/app/gallery/[id]/page.tsx` SHALL 在默认导出与 `generateMetadata` 中均使用 `params: Promise<{ id: string }>` 类型签名，并在使用 `id` 之前先 `await params`。
4. THE 文件 `src/app/api/patterns/[id]/route.ts` 的所有 Route_Handler SHALL 同样使用 `Promise` 形式的 `params` 并 `await`。
5. THE HBPattern SHALL 不在任何 `.tsx`/`.ts` 文件中使用形如 `` `aspect-[${variable}]` `` 或其他动态拼接的 Tailwind 类名；宽高比等视觉属性必须通过静态类名或内联 `style` 实现。
6. THE 文件 `src/app/map/page.tsx` 的根容器 SHALL 使用类名 `min-h-screen`，且仓库中不存在字符串 `"min-screen"` 作为 CSS 类名使用。
7. THE HBPattern SHALL 在 Phase 0 完成后始终保持代码库处于"`npm run build` 与 `npm run lint` 均可通过"的状态，且任一命令出现 error 或 warning 均视为本需求未达成（无论是否被实际执行）。

#### Correctness Properties

- FOR ALL 合法 `patternId`（存在且状态属于 Public_Status）, 访问 `/gallery/{patternId}` 渲染出的 `<h1>` 文本 SHALL 等于数据库中 `patterns.name` 字段。
- FOR ALL 提交到 `main` 分支的文件, grep 模式 `aspect-\[\$\{` 与 `class(Name)?=["'][^"']*min-screen` SHALL 返回 0 处匹配。

---

### Requirement 2: 统一 API 错误响应契约

**User Story:** 作为调用 HBPattern API 的前端与未来开放 API 消费方，我希望所有错误响应遵循同一份契约，以便我可以用统一代码路径处理错误、用 `requestId` 串联日志。

#### Acceptance Criteria

1. WHEN 任意 API_Route 返回非 2xx 响应, THE HBPattern SHALL 使响应体满足结构 `{ error: { code, message, requestId, details? } }`，且不包含顶层 `data` 字段。
2. THE `error.code` SHALL 仅由大写 ASCII 字母、数字和下划线组成，并匹配正则 `^[A-Z][A-Z0-9_]*$`。
3. THE `error.message` SHALL 为面向终端用户的中文可读描述，长度在 1 到 200 个字符之间。
4. THE `error.requestId` SHALL 是一个 UUID v4 字符串，且与本次请求的访问日志中记录的 `requestId` 相同。
5. WHEN 运行时环境变量 `NODE_ENV` 等于 `"production"`, THE HBPattern SHALL 不在 `error.details` 中包含堆栈信息、内部路径、数据库错误原文或 Supabase 错误对象；该禁令对所有错误消费方（终端用户、日志管道、内部服务到服务调用）一视同仁，不存在"内部调用可例外"的豁免。
6. WHEN 运行时环境变量 `NODE_ENV` 不等于 `"production"`, THE HBPattern SHALL 允许 `error.details` 包含调试信息（如 Zod 的 `issues` 数组、原始错误名）。
7. THE HBPattern SHALL 按下表将 Api_Error_Code 映射到 HTTP 状态码，且同一条错误在一次响应中仅使用一个状态码：

   | HTTP | Api_Error_Code（示例） |
   | --- | --- |
   | 400 | `VALIDATION_ERROR`、`BAD_REQUEST` |
   | 401 | `UNAUTHORIZED` |
   | 403 | `FORBIDDEN` |
   | 404 | `NOT_FOUND`、`PATTERN_NOT_FOUND` |
   | 409 | `CONFLICT` |
   | 413 | `FILE_TOO_LARGE` |
   | 415 | `UNSUPPORTED_MEDIA_TYPE` |
   | 429 | `RATE_LIMIT_EXCEEDED` |
   | 500 | `INTERNAL_ERROR` |

8. WHEN 任意 API_Route 返回 2xx 列表响应, THE HBPattern SHALL 在响应体中提供满足 Pagination_Meta 结构的 `pagination` 字段（包含 `hasNext` 与 `hasPrev`）以及 Response_Meta 结构的 `meta` 字段（包含 `requestId` 与 ISO 8601 `timestamp`）。
9. WHEN 任意 API_Route 返回 2xx 单资源响应, THE HBPattern SHALL 在响应体中提供顶层 `data` 字段与 `meta` 字段，且 `meta` 字段 SHALL 完整包含 Response_Meta 结构定义的全部成员（`requestId` 与 ISO 8601 `timestamp`）。
10. IF Route_Handler 内部抛出未捕获异常, THEN THE HBPattern SHALL 捕获异常、记录含 `requestId` 的结构化错误日志，并返回 HTTP 500 且 `error.code` 为 `INTERNAL_ERROR`。
10.a. WHERE Route_Handler 在业务逻辑中显式判定为服务端内部错误（例如下游依赖返回不可恢复错误、但未以异常形式抛出）, THE HBPattern SHALL 允许 Route_Handler 主动返回 HTTP 500 + `INTERNAL_ERROR` 并按同一结构化日志格式记录，无需等待异常抛出。
11. THE HBPattern SHALL 在响应 Header 中附加 `X-Request-Id`，其值等于 `error.requestId` 或 `meta.requestId`。

#### Correctness Properties

- FOR ALL API_Route 的非 2xx 响应, 响应体 JSON 经 Zod schema `ApiErrorSchema`（design 阶段定义）解析 SHALL 成功。
- FOR ALL API_Route 的 2xx 响应, 响应体 JSON `meta.requestId` SHALL 等于响应 Header `X-Request-Id`。
- FOR ALL API_Route, 在同一进程中对同一 URL 重复 100 次请求所得响应的 `requestId` SHALL 两两不相同（唯一性）。

---

### Requirement 3: 输入验证层（Zod）

**User Story:** 作为后端开发者，我希望所有 API_Route 在处理业务之前强制进行 Zod 校验，以便消除 `any` 入参、提前拦截非法数据，并让错误响应对前端稳定可预期。

#### Acceptance Criteria

1. THE HBPattern SHALL 在 `package.json` 中声明 `zod` 作为生产依赖。
2. THE Validation_Layer SHALL 为以下端点集中提供命名的 Zod schema，并从 `src/lib/validation/schemas.ts` 导出：
   - `ListPatternsQuery`（`GET /api/patterns` 的 query）
   - `CreatePatternBody`（`POST /api/patterns` 的 body）
   - `PatternIdParam`（所有 `/api/patterns/[id]` 的 path param）
   - `UploadFileForm`（`POST /api/upload` 的 multipart form，至少校验 `file` 字段存在）
   - `CreateCommentBody`（未来 `POST /api/patterns/:id/comments` 的 body，提前定义）
3. WHEN API_Route 接收到请求, THE Route_Handler SHALL 在执行任何业务逻辑或数据库访问之前调用对应 Zod schema 的 `safeParse`。
4. IF Zod `safeParse` 返回 `success: false`, THEN THE Route_Handler SHALL 立即终止后续处理（不进入业务逻辑、不访问数据库、不发起外部调用），并以 HTTP 400 返回 `error.code = "VALIDATION_ERROR"`，`error.message` 为中文描述，且在 `error.details` 中携带 Zod `issues`（仅在非生产环境）。
4.a. WHEN Zod `safeParse` 返回 `success: true`, THE Route_Handler SHALL 继续进入业务逻辑，并以 Requirement 2 规定的 2xx 成功响应格式返回；SHALL 不因校验通过本身而返回 4xx。
4.b. THE HBPattern SHALL 将 Zod `safeParse` 调用作为"非法数据不得进入业务逻辑"这一不变式的唯一控制点；不要求 Route_Handler 在校验之外再进行冗余判空或重复校验，也不引入任何"校验被绕过时的二次防线"。因此开发者必须保证 Route_Handler 第一行即调用对应 schema 的 `safeParse`，其余正确性由 schema 本身负责。
5. THE `ListPatternsQuery` SHALL 对 `page` 强制最小值 1、`limit` 强制范围 1–50 且默认 12、`sort` 强制枚举 `"newest" | "oldest" | "popular" | "likes"`。
6. THE `CreatePatternBody` SHALL 要求 `name` 为 1–100 字符字符串、`imageUrl` 为合法 URL、`regionId`/`techniqueId` 为 UUID 或缺省。
7. WHERE 某个 API_Route 的输入结构未来扩展, THE 对应 Zod schema SHALL 放置在 `src/lib/validation/schemas.ts` 或其子模块中，而非在 Route_Handler 中内联定义。
8. THE HBPattern SHALL 在响应 400 `VALIDATION_ERROR` 时，仍然附带 Requirement 2 要求的 `requestId` 与 `X-Request-Id` Header。

#### Correctness Properties

- FOR ALL 使 Zod schema 拒绝的请求体, Route_Handler SHALL 返回 HTTP 400 且 `error.code = "VALIDATION_ERROR"`（"任意被 Zod 拒绝的请求必须返回 400"）。
- FOR ALL 使 Zod schema 接受的请求体, Route_Handler SHALL 在请求进入业务逻辑时持有的值类型 SHALL 等于 schema 的 `z.infer` 推导结果（类型级正确性）。
- FOR ALL 在 `src/app/api/**/route.ts` 中定义的 Route_Handler, AST 搜索 SHALL 证明其函数体在任何非校验分支之前存在对 `schemas.ts` 中 schema 的引用（可由 design 阶段提出的 lint 规则自动化）。

---

### Requirement 4: 类型系统补全与统一导出

**User Story:** 作为前后端开发者，我希望 `src/types/` 是所有领域类型的单一真相源，以便我在任何模块中都能通过 `@/types` 导入一致的类型。

#### Acceptance Criteria

1. THE HBPattern SHALL 在 `src/types/` 下提供以下文件，每个文件至少导出一个 `export`：
   - `api.ts`（已存在，需按 Requirement 2 扩展）
   - `pattern.ts`（已存在）
   - `user.ts`（已存在）
   - `collection.ts`（新增）
   - `comment.ts`（新增）
   - `notification.ts`（新增）
   - `search.ts`（新增）
   - `ai.ts`（新增）
   - `index.ts`（新增，统一 re-export 上述所有模块）
2. THE `collection.ts` SHALL 至少导出 `Collection` 与 `CollectionItem` 接口。
3. THE `comment.ts` SHALL 至少导出 `Comment` 与 `CommentWithReplies` 接口。
4. THE `notification.ts` SHALL 至少导出 `Notification` 接口与 `NotificationType` 字面量联合。
5. THE `search.ts` SHALL 至少导出 `ImageSearchParams` 与 `ColorSearchParams` 接口（可为占位定义，允许后续扩展）。
6. THE `ai.ts` SHALL 至少导出 `AiTask` 与 `GenerationParams` 接口（可为占位定义）。
7. THE `api.ts` SHALL 按 Requirement 2 新增/扩展以下类型：`ApiError`（含 `requestId`）、`ApiErrorCode`（字面量联合）、`PaginatedResponse<T>`（含 `hasNext` / `hasPrev` / `meta`）、`ResponseMeta`、`ApiSuccess<T>`。
8. WHERE 项目代码需要使用领域类型, THE 导入 SHALL 从 `@/types` 统一导入（可从子路径导入）；业务模块允许存在未被任何代码引用的重复同名 `type` / `interface` 声明（不强制删除），但禁止在业务模块中重新导出这些本地定义作为替代真相源；本条约束仅规范"被实际使用的路径"。
9. THE HBPattern SHALL 在 Phase 0 完成后，通过 `tsc --noEmit` 无类型错误。

#### Correctness Properties

- FOR ALL 新增类型模块, `src/types/index.ts` SHALL 通过 `export * from './xxx'` 或具名 re-export 将其全部对外暴露（无孤岛文件）。

---

### Requirement 5: 权限检查中间件

**User Story:** 作为后端开发者，我希望所有 API_Route 使用统一的权限检查函数而非各自内联 `if (!user)`，以便权限策略变更时只需改一处。

#### Acceptance Criteria

1. THE Auth_Layer SHALL 位于 `src/lib/auth/checks.ts`，并至少导出 `requireAuth` 与 `requireRole`。
2. WHEN Route_Handler 调用 `requireAuth`, THE Auth_Layer SHALL 调用 Supabase 服务端 client 并确认成功获取到非空用户对象后方可返回。
3. IF Supabase 返回无用户、返回错误、或返回的用户对象缺少 `id` 字段, THEN THE Auth_Layer SHALL 抛出 `AuthError`，其 `code = "UNAUTHORIZED"` 且 `status = 401`。
4. WHEN Route_Handler 调用 `requireRole(roles)`, THE Auth_Layer SHALL 先执行 `requireAuth`，再从数据库读取当前用户的 `role` 字段。
5. IF 用户角色不在 `roles` 参数中, THEN THE Auth_Layer SHALL 抛出 `AuthError`，其 `code = "FORBIDDEN"` 且 `status = 403`。
6. THE HBPattern SHALL 在 API_Route 公共错误处理环节将 `AuthError` 映射为对应 HTTP 状态码的 Requirement 2 标准错误响应（含 `requestId`）。
7. THE HBPattern SHALL 在 `POST /api/patterns` 与 `POST /api/upload` 中使用 `requireAuth` 替代内联的 `supabase.auth.getUser()` 判空。
8. WHERE 存在需要管理员权限的端点（未来管理后台审核）, THE Route_Handler SHALL 调用 `requireRole(['admin'])` 而非内联判断。
8.a. WHERE 在本规范交付的 Auth_Layer 尚未合并到主干之前就必须上线某个管理员端点, THE Route_Handler SHALL 允许临时使用内联权限检查，但必须在源文件中以 `// TODO(auth-layer): 迁移至 requireRole(['admin'])` 注释显式标注，并在 Auth_Layer 合并后 1 个工作日内完成迁移；该过渡态不视为本规范的合规交付。
9. THE `requireAuth` 返回值 SHALL 为非空的用户对象，使调用方无需再做存在性判断。

#### Correctness Properties

- FOR ALL 调用 `requireAuth()` 且抛出 `AuthError` 的请求, Route_Handler 返回的 HTTP 状态码 SHALL 等于 `AuthError.status`。
- FOR ALL `AuthError`，映射生成的响应体 SHALL 满足 Requirement 2 的 `ApiError` 契约（含合法 `requestId`）。

---

### Requirement 6: 文件上传安全校验

**User Story:** 作为平台运营与安全负责人，我希望上传接口拒绝超大或非预期类型的文件，以便防止存储滥用与攻击面扩大。

#### Acceptance Criteria

1. THE Upload_Layer SHALL 位于 `src/lib/upload/config.ts`，至少导出常量 `UPLOAD_CONFIG` 与校验辅助函数（具体函数由 design 阶段确定）。
2. THE `UPLOAD_CONFIG.maxSize` SHALL 等于 `10 * 1024 * 1024`（10MB）。
3. THE `UPLOAD_CONFIG.allowedTypes` SHALL 恰好包含 `"image/jpeg"`、`"image/png"`、`"image/webp"` 三项。
4. THE `UPLOAD_CONFIG.allowedExts` SHALL 恰好包含 `"jpg"`、`"jpeg"`、`"png"`、`"webp"` 四项。
5. WHEN `POST /api/upload` 接收到文件, THE Route_Handler SHALL 在调用 Supabase Storage 之前按以下固定顺序执行三项校验，且遇到首次失败即短路返回（不再继续后续校验）：
   1. 文件大小 ≤ `UPLOAD_CONFIG.maxSize`
   2. 文件的 `Content-Type` ∈ `UPLOAD_CONFIG.allowedTypes`
   3. 文件名的扩展名（小写，去掉前导 `.`）∈ `UPLOAD_CONFIG.allowedExts`
6. IF 在步骤 1 中检测到文件大小超过限制, THEN THE Route_Handler SHALL 返回 HTTP 413，`error.code = "FILE_TOO_LARGE"`。
7. IF 在步骤 2 中检测到 `Content-Type` 不在白名单, THEN THE Route_Handler SHALL 返回 HTTP 415，`error.code = "UNSUPPORTED_MEDIA_TYPE"`。
8. IF 在步骤 3 中检测到扩展名不在白名单, THEN THE Route_Handler SHALL 返回 HTTP 400，`error.code = "VALIDATION_ERROR"`。
9. THE Route_Handler SHALL 在所有上述错误分支中附带 Requirement 2 规定的 `requestId`、`X-Request-Id` Header 与中文 `message`。
10. WHILE 用户未登录, THE `POST /api/upload` SHALL 通过 `requireAuth` 返回 401 而非执行任何校验或上传操作。

#### Correctness Properties

- FOR ALL 大小 > 10MB 的上传请求, `POST /api/upload` SHALL 返回 413 且 `error.code = "FILE_TOO_LARGE"`。
- FOR ALL `Content-Type` 不在白名单的上传请求, `POST /api/upload` SHALL 返回 415 且 `error.code = "UNSUPPORTED_MEDIA_TYPE"`。
- FOR ALL 通过所有校验的上传请求, 响应 SHALL 为 HTTP 201 且响应体包含可访问的 `data.url`。

---

### Requirement 7: 速率限制（进程内存版）

**User Story:** 作为平台负责人，我希望对敏感写操作施加基础的速率限制，以便在没有外部存储（Redis）的情况下也能防御明显的刷接口行为。

#### Acceptance Criteria

1. THE Rate_Limiter SHALL 位于 `src/lib/rate-limit.ts` 并导出一个可被 Route_Handler 调用的限流函数（具体签名由 design 阶段确定）。
2. THE Rate_Limiter SHALL 使用进程内存存储（如 `Map`）作为计数后端，且 Phase 0 不要求持久化。
3. THE HBPattern SHALL 为以下敏感操作应用速率限制配额（窗口均为 60 秒）：
   - `POST /api/patterns`：每用户 10 次 / 60 秒
   - `POST /api/upload`：每用户 20 次 / 60 秒
   - 未来 `POST /api/patterns/:id/comments`：每用户 30 次 / 60 秒
4. THE Rate_Limiter SHALL 以已认证用户的 `user.id` 作为主键；对未登录请求（如果未来放开），以 `request.headers['x-forwarded-for']` 首个 IP 或回落到 `"anonymous"` 作为主键。
5. IF 在当前窗口内请求次数超过配额, THEN THE Route_Handler SHALL 返回 HTTP 429，`error.code = "RATE_LIMIT_EXCEEDED"`，并在响应 Header 中包含 `Retry-After`（单位秒）。
5.a. WHERE Rate_Limiter 基于进程内存实现在多实例或冷启动场景下出现计数漂移, THE Route_Limiter SHALL 允许在当前计数尚未严格超过配额的边界情形下（例如跨实例合并计数的近似估算）仍返回 HTTP 429 + `RATE_LIMIT_EXCEEDED`；此类"宁可误杀"的响应不视为违反契约，但 Rate_Limiter SHALL 在 60 秒窗口内返回 429 的请求总数相对真实超额次数的偏差比例（误杀率）不超过 10%。
5.b. WHEN Rate_Limiter 被配置为全局禁用（如测试环境通过环境变量关闭）, THE Route_Handler SHALL 不主动返回 429；IF 在禁用状态下仍然返回了 429, THEN 视为 Rate_Limiter 的实现缺陷而非本需求允许的行为。
6. THE HBPattern SHALL 在速率限制响应中附带 Requirement 2 规定的 `requestId` 与 `X-Request-Id`。
7. WHERE 运行环境为 Vercel 等无状态 Serverless, THE 设计文档 SHALL 记录"进程内存版在水平扩容下不精确"的已知限制，并规划 Phase 3+ 切换 Redis 的迁移点（实现上 Phase 0 不处理）。
8. THE Rate_Limiter SHALL 在测试环境通过某种方式（环境变量或参数）允许关闭或降低配额，以便单元/集成测试可控。

#### Correctness Properties

- FOR ALL 用户，在同一 60 秒窗口内发起 N 次 `POST /api/patterns` 请求：第 1 到第 10 次 SHALL 不因限流而失败；第 11 次起 SHALL 返回 HTTP 429。
- FOR ALL 限流响应, `Retry-After` Header SHALL 为正整数且 ≤ 60。

---

### Requirement 8: SiteFooter 组件统一使用

**User Story:** 作为前端开发者，我希望全站 Footer 只由一个组件实现，以便视觉调整与文案更新只需改一处。

#### Acceptance Criteria

1. THE HBPattern SHALL 仅在 `src/components/layout/SiteFooter.tsx` 中定义 Footer UI，且该组件为页面内唯一被渲染的 Footer 实现。
2. THE Site_Footer SHALL 至少支持 `variant` 属性，取值为 `"light" | "dark"`，以覆盖画廊（light）与详情页（dark）两种主题。
3. WHEN 任意页面（`src/app/**/page.tsx`）在其布局中需要展示 Footer, THE 页面 SHALL 主动导入并渲染 Site_Footer（仅"Site_Footer 文件存在"不构成达标，每个需要 Footer 的页面必须显式 JSX 引用它）。
4. THE HBPattern SHALL 不允许任何页面文件同时存在 `SiteFooter` 的 JSX 引用与内联 `<footer>` 结构；每个页面 SHALL 在"使用 Site_Footer"或"刻意不渲染 Footer"（见 8.6）两种状态之一，Phase 0 合并期间不保留过渡性双写。
5. THE HBPattern SHALL 不在 `src/app/**` 或 `src/components/**` 中保留除 Site_Footer 以外任何未被引用的 Footer 组件文件（死代码零遗留）。
6. THE Site_Footer SHALL 在无障碍结构上使用 `<footer role="contentinfo">` 并为版权、链接区提供可聚焦的 `<a>` 元素。
7. WHERE 页面为全屏交互视图（当前 `src/app/map/page.tsx` 的地图主区不渲染 Footer）, THE 页面 SHALL 在源文件顶部以注释声明"刻意不渲染 Footer"的理由，而不通过重复组件变体表达。

#### Correctness Properties

- FOR ALL `src/app/**/page.tsx` 中包含导出 `default` 组件且布局含页脚的页面, 文件 AST SHALL 含对 `SiteFooter` 的 JSX 引用（可由 design 阶段提出的 lint 规则自动化）。
- FOR ALL 包含 Footer 的页面渲染输出, 文档中 `<footer>` 元素数量 SHALL 等于 1。
