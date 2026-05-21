# 02 - API 接口规范

## 路由体系

### 内部 BFF API (`/api/*`)

供前端页面调用，需 Supabase Session 认证。

| 方法 | 路径 | 说明 | 认证 | 限流 |
|------|------|------|------|------|
| GET | `/api/patterns` | 纹样列表 | 否 | 否 |
| POST | `/api/patterns` | 创建纹样 | 是 | 10/min |
| GET | `/api/patterns/[id]` | 纹样详情 | 否 | 否 |
| GET | `/api/patterns/[id]/comments` | 评论列表 | 否 | 否 |
| POST | `/api/patterns/[id]/comments` | 发表评论 | 是 | 30/min |
| GET | `/api/patterns/[id]/like` | 点赞状态 | 否 | 否 |
| POST | `/api/patterns/[id]/like` | 切换点赞 | 是 | 否 |
| PATCH | `/api/patterns/[id]/moderate` | 审核纹样 | admin | 否 |
| GET | `/api/regions` | 地区列表 | 否 | 否 |
| GET | `/api/stats` | 平台统计 | 否 | 否 |
| POST | `/api/upload` | 上传文件 | 是 | 20/min |

### 公开 API (`/api/v1/*`)

对外提供服务，支持 CORS，未来接入 API Key。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/patterns` | 纹样列表 |
| GET | `/api/v1/patterns/[id]` | 纹样详情 |
| GET | `/api/v1/regions` | 地区列表 |
| GET | `/api/v1/stats` | 平台统计 |
| OPTIONS | `/api/v1/*` | CORS 预检 |

---

## 响应格式

### 成功 - 单资源

```json
{
  "data": { ... },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-15T00:00:00.000Z"
  }
}
```

### 成功 - 分页列表

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 156,
    "totalPages": 13,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-15T00:00:00.000Z"
  }
}
```

### 错误响应

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数校验失败",
    "requestId": "uuid-v4",
    "details": [ ... ]  // 仅开发环境
  }
}
```

---

## 错误码体系

| 错误码 | HTTP | 中文消息 | 英文消息 |
|--------|------|----------|----------|
| `VALIDATION_ERROR` | 400 | 请求参数校验失败 | Validation failed |
| `BAD_REQUEST` | 400 | 请求格式错误 | Bad request |
| `UNAUTHORIZED` | 401 | 请先登录 | Authentication required |
| `FORBIDDEN` | 403 | 无权限执行此操作 | Forbidden |
| `NOT_FOUND` | 404 | 资源不存在 | Not found |
| `PATTERN_NOT_FOUND` | 404 | 纹样不存在 | Pattern not found |
| `CONFLICT` | 409 | 资源冲突 | Conflict |
| `FILE_TOO_LARGE` | 413 | 文件过大 | File too large |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | 不支持的文件类型 | Unsupported media type |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求过于频繁 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | 服务暂时不可用 | Service unavailable |

---

## 响应 Headers

所有 API 响应包含：

| Header | 值 | 说明 |
|--------|-----|------|
| `X-Request-Id` | UUID v4 | 请求追踪 ID |
| `X-API-Version` | `v1` | API 版本 |
| `X-Content-Type-Options` | `nosniff` | 安全 |
| `X-Frame-Options` | `DENY` | 安全 |

v1 公开 API 额外包含：

| Header | 值 |
|--------|-----|
| `Access-Control-Allow-Origin` | `*` |
| `Access-Control-Allow-Methods` | `GET, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type, X-API-Key, X-Request-Id` |

---

## Route Handler 编写规范

### 标准模板

```typescript
import { NextRequest } from 'next/server'
import { withApi } from '@/lib/api/withApi'
import { ok, okList } from '@/lib/api/response'
import { parseOrThrow } from '@/lib/validation/parse'
import { SomeSchema } from '@/lib/validation/schemas'
import { requireAuth } from '@/lib/auth/checks'
import { rateLimit } from '@/lib/rate-limit'

/**
 * @api POST /api/resource
 * @summary 创建资源
 * @tag ResourceTag
 */
export const POST = withApi(async (req: NextRequest) => {
  // 1. 验证输入
  const body = parseOrThrow(SomeSchema, await req.json())
  // 2. 鉴权
  const user = await requireAuth()
  // 3. 限流
  rateLimit('POST /api/resource', user.id)
  // 4. 业务逻辑
  const result = await doSomething(body)
  // 5. 返回
  return ok(result, { status: 201 })
})
```

### 带路径参数

```typescript
export const GET = withApi<object, { params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { id } = parseOrThrow(PatternIdParam, await ctx.params)
    // ...
  },
)
```

### 执行顺序（强制）

1. `parseOrThrow` — 输入验证（必须第一步）
2. `requireAuth` / `requireRole` — 鉴权
3. `rateLimit` — 限流
4. 业务逻辑 — Supabase 查询
5. `ok()` / `okList()` — 返回

---

## 输入验证规范

所有 Schema 定义在 `src/lib/validation/schemas.ts`：

```typescript
// Query 参数 — 使用 z.coerce 处理字符串转换
export const ListPatternsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

// Body 参数 — 直接验证 JSON
export const CreatePatternBody = z.object({
  name: z.string().trim().min(1).max(100),
  imageUrl: z.string().url(),
})

// 路径参数 — UUID 验证
export const PatternIdParam = z.object({
  id: z.string().uuid(),
})
```

---

## 限流配额

| 路由 | 窗口 | 最大请求数 |
|------|------|-----------|
| `POST /api/patterns` | 60s | 10 |
| `POST /api/upload` | 60s | 20 |
| `POST /api/patterns/[id]/comments` | 60s | 30 |

限流 key = `${quota}:${userId}`，未登录使用 IP。

---

## API Key 体系（预留）

未来对外开放时启用：

| Tier | 请求/分钟 | 用途 |
|------|-----------|------|
| free | 30 | 学术研究 |
| basic | 120 | 个人项目 |
| premium | 600 | 商业用途 |

请求头：`X-API-Key: <key>`
