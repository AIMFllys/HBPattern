# 04 - 安全规范

## 响应安全 Headers

所有响应通过 `proxy.ts` 自动注入：

| Header | 值 | 作用 |
|--------|-----|------|
| `X-Content-Type-Options` | `nosniff` | 防止 MIME 嗅探 |
| `X-Frame-Options` | `DENY` | 防止点击劫持 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 控制 Referer 泄露 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | 禁用敏感 API |
| `Content-Security-Policy` | 动态生成 | 防止 XSS |

## CSP 策略

**生产环境：**
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: *.supabase.co lh3.googleusercontent.com;
font-src 'self';
connect-src 'self' *.supabase.co;
frame-ancestors 'none';
```

**开发环境额外允许：**
- `script-src`: `'unsafe-eval'` `'unsafe-inline'` (HMR 需要)
- `connect-src`: `ws://localhost:*` (WebSocket HMR)

## 认证安全

### Session 管理

- Supabase Auth 通过 httpOnly cookie 管理 session
- `proxy.ts` 在每次请求时自动刷新 session token
- Session 过期后自动重定向到 `/login`

### 路由保护

受保护路径（在 `proxy.ts` 中配置）：
- `/dashboard`
- `/upload`
- `/profile`

未登录访问 → 302 重定向到 `/login`

### API 鉴权

```typescript
// 仅需登录
const user = await requireAuth()  // 失败抛 401

// 需要特定角色
const user = await requireRole(['admin'])  // 失败抛 403
```

## 输入安全

### Zod 验证（第一道防线）

所有 API 输入必须经过 `parseOrThrow`：
- 字符串自动 `.trim()`
- 长度限制 `.max(N)`
- UUID 格式验证 `.uuid()`
- URL 格式验证 `.url()`
- 数字范围 `.min(1).max(50)`

### 文件上传安全

校验顺序（短路）：
1. **大小** → 超过 10MB 抛 `FILE_TOO_LARGE` (413)
2. **MIME** → 非 jpeg/png/webp 抛 `UNSUPPORTED_MEDIA_TYPE` (415)
3. **扩展名** → 非 jpg/jpeg/png/webp 抛 `VALIDATION_ERROR` (400)

### SQL 注入防护

- 使用 Supabase SDK 参数化查询（自动转义）
- 搜索关键词手动过滤 `%` 和 `_`：
  ```typescript
  const sanitized = q.replace(/[%_]/g, '')
  ```

## 限流

- 进程内存滑动窗口计数器
- Key: `${route}:${userId}` 或 `${route}:${ip}`
- 超限抛 `RATE_LIMIT_EXCEEDED` (429) + `Retry-After` header
- **边缘部署限制**：进程内存计数仅在单实例有效。EdgeOne Pages / Vercel Edge 等多实例环境下每个实例独立计数，限流会失效。生产环境（`NODE_ENV='production'`）默认降级为 no-op，除非显式设置 `RATE_LIMIT_DISABLED='0'`（用于自建单实例部署）。EdgeOne 部署时应依赖平台控制台的「速率限制 / WAF 规则」做边缘限流。

## 环境变量安全

| 变量 | 暴露范围 | 说明 |
|------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 客户端 + 服务端 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 客户端 + 服务端 | Supabase 公开 key |
| `DATABASE_URL` | 仅运维脚本 | Supabase 连接池地址，仅 `scripts/check-db-security.ts` 等运维脚本使用，应用运行时不读取 |
| `DIRECT_URL` | 仅运维脚本 | Supabase 直连地址，同上 |
| `CORS_ALLOWED_ORIGINS` | 仅服务端 | CORS 白名单 |
| `RATE_LIMIT_DISABLED` | 仅服务端 | `'1'` 禁用、`'0'` 显式启用、未设置时生产默认降级 |

**禁止**：将 `DATABASE_URL`、`DIRECT_URL` 等敏感变量以 `NEXT_PUBLIC_` 前缀暴露。
