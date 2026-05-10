# 需求文档：Phase 0 — 技术债清理与规范建立

## Introduction

本需求覆盖 HBPattern（湖北纹案文化展示平台）架构规划中的 **Phase 0：技术债清理 + 规范建立** 阶段。目标是在不引入业务新特性的前提下，消除已知的 Critical Bug、建立长期强制执行的工程规范，并把 `CODE_REVIEW_AND_ARCHITECTURE_PLAN.md` §7 的验证清单转成机器可检查的验收条件。

本阶段范围严格限定于代码库内部的规范化与修复，**不包含**：
- Prisma 查询迁移执行（归属 Phase 1）
- 测试框架搭建（归属 Phase 4）
- AI / 3D / 地图真实接入（归属 Phase 3）
- 状态管理实际启用（归属 Phase 1）
- i18n、深色模式、PWA（归属 Phase 4）

本阶段完成后，新增代码必须可以通过清单逐条验证，任何违反项视为不合格提交。

---

## Glossary

- **HBPattern_App**: 本仓库整体 Next.js 应用（前端页面 + API Routes + 库文件）。
- **API_Route**: Next.js App Router 下位于 `src/app/api/**/route.ts` 的路由处理函数。
- **Route_Params**: Next.js 16 中动态路由的 `params` 参数对象，官方规范要求类型为 `Promise<T>` 并在处理函数内 `await`。
- **UUID_v4**: RFC 4122 版本 4 通用唯一标识符，正则 `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`。
- **Request_Id**: 每次 API 调用生成的字符串追踪标识，写入响应体 `error.requestId` 或 `meta.requestId`，并在服务端日志中一致出现，用于跨层日志串联。
- **Api_Response**: 成功响应契约，包含 `data` 字段，不含 `error` 字段。
- **Api_Error**: 错误响应契约，包含 `error: { code, message, requestId, details? }`。
- **Paginated_Response**: 列表分页响应契约，包含 `data`、`pagination`、`meta`。
- **Error_Code**: `Api_Error.error.code` 的取值，规范为英文大写蛇形格式（例如 `PATTERN_NOT_FOUND`）。
- **Error_Message**: `Api_Error.error.message` 的取值，默认为中文描述文案。
- **Http_Status_Mapping**: HTTP 状态码到 Error_Code 的映射表（见需求 3）。
- **Zod**: 运行时模式校验库，本仓库使用 `zod` 包。
- **Validation_Layer**: 位于 `src/lib/validation/schemas.ts` 的 Zod 模式集合。
- **EARS**: Easy Approach to Requirements Syntax，本文档使用的需求语法规范。
- **Tailwind_v4_JIT**: TailwindCSS v4 的 Just-In-Time 编译器，要求 class 名必须在源码中以完整字符串字面量出现才能被扫描生成。
- **Auth_Check_Module**: 位于 `src/lib/auth/checks.ts` 的统一权限检查模块，导出 `requireAuth()` 和 `requireRole()`。
- **Upload_Config**: 位于 `src/lib/upload/config.ts` 的文件上传常量配置对象 `UPLOAD_CONFIG`。
- **Rate_Limiter**: 位于 `src/lib/rate-limit.ts` 的内存版速率限制器。
- **Pattern_Status_Enum**: 纹样状态枚举，使用 `as const` 对象 + 类型别名形式定义。
- **Site_Footer**: 可复用站点页脚组件，位于 `src/components/layout/SiteFooter.tsx`。
- **Mock_Pattern**: 当前仓库中用于占位的本地静态纹样数据（`mockPatterns` 数组）。
- **Sensitive_Operation**: 指创建、修改、删除、文件上传类 API 操作。
- **Dev_Environment**: `process.env.NODE_ENV !== 'production'` 的运行环境。

---

## Requirements

### Requirement 1：画廊详情页动态参数修复

**User Story:** 作为访客，我希望访问 `/gallery/[id]` 时看到与 URL 中 `id` 对应的真实纹样，以便浏览我实际点击的那件纹样。

#### Acceptance Criteria

1. WHEN 用户访问 `/gallery/[id]` 路径，THE HBPattern_App SHALL 从 Route_Params 中解析 `id` 字段并将其用于数据查询。
2. THE HBPattern_App SHALL 在 `gallery/[id]/page.tsx` 中将 `params` 的类型声明为 `Promise<{ id: string }>` 并使用 `await` 关键字进行解包。
3. THE HBPattern_App SHALL 在 `gallery/[id]/page.tsx` 中通过 `id` 字段查找对应的纹样对象，禁止出现 `mockPatterns[0]` 或任何忽略 `id` 的硬编码索引访问。
4. IF 按 `id` 未查找到对应 Mock_Pattern，THEN THE HBPattern_App SHALL 调用 Next.js `notFound()` 返回 404 页面。
5. WHEN 用户依次访问 `/gallery/{id_a}` 与 `/gallery/{id_b}` 两个不同 `id`，THE HBPattern_App SHALL 在页面主区域渲染不同的纹样名称、图片和元数据。

### Requirement 2：画廊列表动态宽高比样式修复

**User Story:** 作为访客，我希望纹样卡片以真实的原始宽高比展示，以便获得正确的视觉比例感受。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 在 `gallery/page.tsx` 中移除动态拼接的 Tailwind class 表达式 `aspect-[${pattern.aspectRatio}]`。
2. THE HBPattern_App SHALL 使用内联 `style` 属性（例如 `style={{ aspectRatio: pattern.aspectRatio }}`）或其他 Tailwind_v4_JIT 能够静态扫描的方式实现宽高比控制。
3. WHEN Tailwind_v4_JIT 扫描 `gallery/page.tsx` 源码，THE HBPattern_App SHALL 不包含任何由模板字符串拼接而成的 `aspect-[...]`、`w-[...]`、`h-[...]`、`bg-[...]` 动态 class 字面量。
4. WHEN 渲染任一 Mock_Pattern 卡片，THE HBPattern_App SHALL 使图片容器的实际计算样式包含与 `pattern.aspectRatio` 一致的 `aspect-ratio` CSS 属性值。

### Requirement 3：地图页最小高度 Typo 修复

**User Story:** 作为访客，我希望地图页占满视口高度，以便获得完整的地图浏览体验。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 将 `map/page.tsx` 中的 `min-screen` class 名替换为 `min-h-screen`。
2. WHEN 用户访问 `/map` 路径，THE HBPattern_App SHALL 渲染根容器，且其计算样式的 `min-height` 不小于 `100vh`。
3. WHEN 对仓库源码执行正则搜索 `\bmin-screen\b`，THE HBPattern_App SHALL 返回零匹配。

### Requirement 4：统一 API 响应契约

**User Story:** 作为 API 调用方（前端或未来的开放 API 用户），我希望所有成功响应、错误响应、分页响应具有稳定一致的结构，以便统一解析和错误处理。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 在 `src/types/api.ts` 中定义 `ApiResponse<T>` 类型，字段为 `{ data: T; error?: never }`。
2. THE HBPattern_App SHALL 在 `src/types/api.ts` 中定义 `ApiError` 类型，字段为 `{ data?: never; error: { code: string; message: string; requestId: string; details?: unknown } }`。
3. THE HBPattern_App SHALL 在 `src/types/api.ts` 中定义 `PaginatedResponse<T>` 类型，`pagination` 字段必须至少包含 `page`、`limit`、`total`、`totalPages`、`hasNext`、`hasPrev` 六个属性，`meta` 字段必须至少包含 `requestId` 和 ISO 8601 格式的 `timestamp` 两个属性。
4. WHEN API_Route 返回成功响应，THE HBPattern_App SHALL 使响应体符合 `ApiResponse<T>` 或 `PaginatedResponse<T>` 的结构，不得同时包含 `data` 和 `error` 字段。
5. WHEN API_Route 返回错误响应，THE HBPattern_App SHALL 使响应体符合 `ApiError` 结构，且 `error.code` 为英文大写蛇形字符串，`error.message` 为中文描述字符串，`error.requestId` 为非空字符串。
6. WHILE 运行环境非 Dev_Environment，THE HBPattern_App SHALL 在 `ApiError.error.details` 字段中不暴露堆栈或内部对象，仅允许保留结构化的用户可见提示。
7. WHERE 运行环境为 Dev_Environment，THE HBPattern_App SHALL 允许在 `ApiError.error.details` 中返回调试信息。

### Requirement 5：Error_Code 与 HTTP 状态码映射

**User Story:** 作为 API 调用方，我希望 HTTP 状态码与业务错误码有确定的映射关系，以便在网关和客户端层面做出一致的分支决策。

#### Acceptance Criteria

1. WHEN API_Route 因请求体或查询参数校验失败而失败，THE HBPattern_App SHALL 返回 HTTP 状态码 `400` 且 `error.code` 等于 `VALIDATION_ERROR`。
2. WHEN API_Route 因用户未登录而失败，THE HBPattern_App SHALL 返回 HTTP 状态码 `401` 且 `error.code` 等于 `UNAUTHORIZED`。
3. WHEN API_Route 因用户无权限而失败，THE HBPattern_App SHALL 返回 HTTP 状态码 `403` 且 `error.code` 等于 `FORBIDDEN`。
4. WHEN API_Route 因目标资源不存在而失败，THE HBPattern_App SHALL 返回 HTTP 状态码 `404` 且 `error.code` 以 `_NOT_FOUND` 结尾（例如 `PATTERN_NOT_FOUND`）。
5. WHEN API_Route 因触发 Rate_Limiter 而失败，THE HBPattern_App SHALL 返回 HTTP 状态码 `429` 且 `error.code` 等于 `RATE_LIMIT_EXCEEDED`。
6. WHEN API_Route 因未预期的服务端异常而失败，THE HBPattern_App SHALL 返回 HTTP 状态码 `500` 且 `error.code` 等于 `INTERNAL_ERROR`。
7. THE HBPattern_App SHALL 在 `src/types/api.ts` 或 `src/lib/api/errors.ts` 中以 `as const` 对象形式集中声明以上所有 Error_Code 常量，禁止在 API_Route 内部以字符串字面量形式内联声明错误码。

### Requirement 6：Request_Id 追踪

**User Story:** 作为开发者，我希望每个 API 响应都携带 Request_Id，以便在日志中定位单次调用的上下文。

#### Acceptance Criteria

1. WHEN API_Route 处理一次请求，THE HBPattern_App SHALL 为该请求生成一个符合 UUID_v4 格式的 Request_Id 字符串。
2. WHEN API_Route 返回错误响应，THE HBPattern_App SHALL 将 Request_Id 写入 `error.requestId` 字段。
3. WHEN API_Route 返回分页响应，THE HBPattern_App SHALL 将 Request_Id 写入 `meta.requestId` 字段。
4. WHEN API_Route 记录服务端日志，THE HBPattern_App SHALL 在日志条目中包含相同的 Request_Id 字符串。

### Requirement 7：动态路由参数类型规范

**User Story:** 作为 Next.js 16 的使用者，我希望所有动态路由参数都遵循异步规范，以便兼容框架的运行时要求。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 在所有位于 `src/app/**/[*]/page.tsx` 与 `src/app/api/**/[*]/route.ts` 的文件中，将 `params` 的类型声明为 `Promise<T>`。
2. WHEN 组件或 API_Route 读取 `params` 的属性值，THE HBPattern_App SHALL 先对 `params` 使用 `await` 关键字解包。
3. WHEN 对仓库源码执行正则搜索 `params\s*:\s*\{\s*\w+\s*:\s*string\s*\}` 且上下文位于 `src/app/` 目录下的动态路由文件，THE HBPattern_App SHALL 返回零匹配（即不存在非 Promise 形式的 params 类型）。

### Requirement 8：资源 ID 格式规范

**User Story:** 作为 API 设计者，我希望所有资源标识统一为 UUID_v4，以便未来接入分布式系统和开放 API。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 在 Validation_Layer 中对所有表示资源 ID 的输入字段使用 `z.string().uuid()` 或等价约束。
2. WHEN API_Route 收到的资源 ID 不符合 UUID_v4 格式，THE HBPattern_App SHALL 返回 HTTP `400` 且 `error.code` 等于 `VALIDATION_ERROR`。

### Requirement 9：Zod 输入验证层

**User Story:** 作为后端开发者，我希望所有 API_Route 的入参都经过统一的 Zod 验证，以便在类型与运行时双重保障数据安全。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 创建 `src/lib/validation/schemas.ts` 文件，导出所有共享的 Zod 模式。
2. THE HBPattern_App SHALL 在 Validation_Layer 中至少定义 `CreatePatternBody` 与 `ListPatternsQuery` 两个模式，字段规格与 `CODE_REVIEW_AND_ARCHITECTURE_PLAN.md` §2.5 描述一致。
3. WHEN API_Route 处理函数接收请求，THE HBPattern_App SHALL 在处理函数首个业务语句执行前调用对应的 Zod `.safeParse()` 或 `.parse()` 方法。
4. IF Zod 验证失败，THEN THE HBPattern_App SHALL 按 Requirement 5.1 返回 `400` + `VALIDATION_ERROR` 响应，并将 Zod 的 `issues` 放入 `error.details`（仅 Dev_Environment 可见）。
5. THE HBPattern_App SHALL 在现存的 `patterns`、`upload`、`comments` 等 API_Route 中全部接入 Validation_Layer，不留未经 Zod 校验的入口。
6. THE HBPattern_App SHALL 禁止在 API_Route 内部使用 `req.json() as any` 或等效的类型擦除写法。

### Requirement 10：类型系统补全与导出规范

**User Story:** 作为开发者，我希望所有领域类型集中在 `src/types/`，以便跨层复用并避免重复定义。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 在 `src/types/` 目录下新增 `collection.ts`、`comment.ts`、`notification.ts`、`search.ts`、`ai.ts` 文件，内容字段与 `CODE_REVIEW_AND_ARCHITECTURE_PLAN.md` §2.2 与 §3 描述一致。
2. THE HBPattern_App SHALL 在 `src/types/` 目录下新增 `index.ts` 文件，重新导出 `api`、`pattern`、`user`、`collection`、`comment`、`notification`、`search`、`ai` 全部模块。
3. THE HBPattern_App SHALL 禁止在仓库任意源文件中出现 `as unknown as` 形式的双重断言。
4. WHEN 定义枚举语义的常量集合，THE HBPattern_App SHALL 使用 `as const` 对象加 `typeof ... [keyof typeof ...]` 类型别名的形式（例如 Pattern_Status_Enum），禁止使用 TypeScript 原生 `enum` 关键字。
5. THE HBPattern_App SHALL 在 `src/types/pattern.ts` 或 `src/types/index.ts` 中提供 Pattern_Status_Enum 并使其包含至少 `PENDING`、`APPROVED`、`REJECTED`、`FEATURED` 四个成员。

### Requirement 11：统一权限检查层

**User Story:** 作为后端开发者，我希望身份与角色校验集中在一个模块，以便避免内联 `if (!user)` 散落各处。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 创建 Auth_Check_Module（`src/lib/auth/checks.ts`），导出 `requireAuth()` 与 `requireRole(roles)` 两个异步函数。
2. WHEN `requireAuth()` 执行且 Supabase Auth 会话解析失败或用户为空，THE HBPattern_App SHALL 抛出一个可被统一错误处理器识别的错误（对应 Requirement 5.2 的 `401` + `UNAUTHORIZED`）。
3. WHEN `requireRole(roles)` 执行且当前用户角色不在传入的角色数组内，THE HBPattern_App SHALL 抛出一个对应 Requirement 5.3 的 `403` + `FORBIDDEN` 错误。
4. THE HBPattern_App SHALL 在所有需要登录的 API_Route 中以调用 `requireAuth()` / `requireRole()` 的方式完成权限校验，禁止在 API_Route 内部直接通过 `supabase.auth.getUser()` 返回值进行 `if (!user) return ...` 的内联判断。
5. THE HBPattern_App SHALL 在本阶段保留 Supabase Auth 作为底层认证方案，不引入 NextAuth.js 依赖。

### Requirement 12：文件上传规范

**User Story:** 作为平台维护者，我希望上传接口只接受受控的文件类型与大小，以便降低存储滥用与安全风险。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 创建 Upload_Config 文件 `src/lib/upload/config.ts`，导出只读常量 `UPLOAD_CONFIG`。
2. THE HBPattern_App SHALL 在 `UPLOAD_CONFIG` 中声明 `maxSize` 字段，值等于 `10 * 1024 * 1024`（10MB）。
3. THE HBPattern_App SHALL 在 `UPLOAD_CONFIG` 中声明 `allowedTypes` 字段，值为包含且仅包含 `image/jpeg`、`image/png`、`image/webp` 三个字符串的数组。
4. THE HBPattern_App SHALL 在 `UPLOAD_CONFIG` 中声明 `allowedExts` 字段，值为包含且仅包含 `jpg`、`jpeg`、`png`、`webp` 四个字符串的数组。
5. WHEN `/api/upload` 路由收到上传请求，THE HBPattern_App SHALL 在落盘或写入存储桶之前依次校验文件大小 ≤ `UPLOAD_CONFIG.maxSize`、`file.type` ∈ `UPLOAD_CONFIG.allowedTypes`、扩展名 ∈ `UPLOAD_CONFIG.allowedExts`。
6. IF 上传文件超过 `UPLOAD_CONFIG.maxSize`、或 MIME 不在白名单、或扩展名不在白名单，THEN THE HBPattern_App SHALL 返回 HTTP `400` + `error.code` 等于 `VALIDATION_ERROR` 的响应。
7. THE HBPattern_App SHALL 在 `UPLOAD_CONFIG` 中为未来接入阿里云 OSS 预留 `oss` 配置节点（至少包含 `region`、`bucket`、`urlExpires` 字段占位），但本阶段不要求实际接入。

### Requirement 13：基础速率限制

**User Story:** 作为平台维护者，我希望敏感操作能被速率限制，以便防止短时间被刷接口。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 创建 Rate_Limiter 文件 `src/lib/rate-limit.ts`，实现基于内存的计数器限流函数，接受至少 `key: string`、`limit: number`、`windowMs: number` 三个参数。
2. WHEN Rate_Limiter 判定某 `key` 在 `windowMs` 时间窗口内的调用次数已达到 `limit`，THE HBPattern_App SHALL 使该次调用返回拒绝状态（由上层按 Requirement 5.5 映射到 `429` + `RATE_LIMIT_EXCEEDED`）。
3. THE HBPattern_App SHALL 在所有 Sensitive_Operation 对应的 API_Route 中调用 Rate_Limiter，至少覆盖 `patterns`（POST/PATCH/DELETE）、`upload`（POST）、`comments`（POST）。
4. WHERE 运行环境为 Dev_Environment，THE HBPattern_App SHALL 允许通过环境变量关闭或放宽 Rate_Limiter（例如 `RATE_LIMIT_DISABLED=true`）以便开发调试。
5. THE HBPattern_App SHALL 在 `src/lib/rate-limit.ts` 中以注释标明内存版实现为临时方案，并预留替换为 Redis/Upstash 的接口签名占位。

### Requirement 14：SiteFooter 组件抽取与统一

**User Story:** 作为前端维护者，我希望站点页脚是单一组件，以便后续文案与样式只改一处。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 创建 Site_Footer 组件文件 `src/components/layout/SiteFooter.tsx`，导出默认组件 `SiteFooter`。
2. THE HBPattern_App SHALL 为 Site_Footer 提供 `variant` 属性，取值至少包含 `default` 与 `minimal` 两种，类型以联合字面量或 Pattern_Status_Enum 同款 `as const` 对象定义。
3. WHEN 页面布局需要渲染页脚，THE HBPattern_App SHALL 引用 Site_Footer 组件而非内联 `<footer>` 标签。
4. THE HBPattern_App SHALL 在本阶段完成至少一个现有页面/布局从内联页脚迁移至 Site_Footer 的改造，作为规范落地样例。

### Requirement 15：僵尸依赖评估标注

**User Story:** 作为项目管理者，我希望已安装但未使用的依赖被显式标注，以便后续阶段决定是否移除。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 在仓库根目录创建或更新一份 `DEPENDENCY_AUDIT.md` 文档，列出 `motion`、`lucide-react`、`zustand`、`@tanstack/react-query` 四项依赖的当前引用计数与下一步处理计划。
2. THE HBPattern_App SHALL 在 `DEPENDENCY_AUDIT.md` 中对每项依赖标注以下字段之一：`keep-phase-1-usage`、`keep-phase-2-usage`、`keep-phase-3-usage`、`remove-candidate`。
3. THE HBPattern_App SHALL 在本阶段不从 `package.json` 中删除上述任一依赖。

### Requirement 16：验证清单机器化

**User Story:** 作为代码审查者，我希望 `CODE_REVIEW_AND_ARCHITECTURE_PLAN.md` §7 的清单可以通过 grep 或脚本自动核查，以便每次提交都能被客观验证。

#### Acceptance Criteria

1. THE HBPattern_App SHALL 在仓库根目录提供一份验证清单 `PHASE_0_CHECKLIST.md`，其每一项均对应本需求文档中的一条 Acceptance Criteria 编号。
2. WHEN 对仓库执行正则搜索 `req\.json\(\)\s+as\s+any`，THE HBPattern_App SHALL 返回零匹配。
3. WHEN 对仓库执行正则搜索 `as\s+unknown\s+as`，THE HBPattern_App SHALL 返回零匹配。
4. WHEN 对仓库执行正则搜索 `\baspect-\[\$\{`，THE HBPattern_App SHALL 返回零匹配。
5. WHEN 对仓库执行正则搜索 `\bmin-screen\b`，THE HBPattern_App SHALL 返回零匹配。
6. WHEN 对仓库 `src/app/api/` 目录执行正则搜索 `if\s*\(\s*!\s*user\s*\)`，THE HBPattern_App SHALL 返回零匹配。
7. WHEN 对仓库 `src/app/api/` 目录执行正则搜索 `mockPatterns\s*\[\s*0\s*\]`，THE HBPattern_App SHALL 返回零匹配。
8. THE HBPattern_App SHALL 在 `PHASE_0_CHECKLIST.md` 中为每条机器化校验项给出可复制执行的 grep/ripgrep 命令。
