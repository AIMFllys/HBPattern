# 腾讯云 EdgeOne Pages 部署指南（HBPattern）

> 推荐部署方式。宝塔自建部署见 `deploy-baota.md`（备选方案）。

## 0. 架构（一句话）

```
用户浏览器
   │ HTTPS（EdgeOne 自动签发）
   ▼
腾讯云 EdgeOne 边缘节点（全球 CDN + 速率限制 + WAF）
   │ SSR / API Routes / proxy.ts 中间件
   ▼
Next.js 运行时（EdgeOne Pages 托管）
   │ HTTPS PostgREST
   ▼
Supabase 云（PostgreSQL 数据库 + Auth + Storage）
```

**数据库、登录、图片存储全在 Supabase 云上**，EdgeOne 只负责跑 Next.js 和边缘加速。

## 1. 前置条件

- 一个 Supabase 项目，已执行 `supabase/migrations/0000_init.sql` → `0003`，并完成 `npm run seed` 种子数据。
- Supabase 项目设置 → Authentication → URL 配置：把 EdgeOne 站点域名加入允许的重定向 URL（`https://<你的域名>/auth/callback`）。
- 已安装 Node.js 20+（本地开发用）。

## 2. 环境变量

在 EdgeOne Pages 控制台 → 项目设置 → 环境变量中配置（**构建时注入**，`NEXT_PUBLIC_*` 必须在 build 阶段可用）：

| 变量 | 必需 | 说明 |
|------|:---:|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | 推荐 | `https://<你的域名>`，用于 metadataBase / OG / canonical |
| `DATABASE_URL` | ✅ | Supabase 连接池地址（`postgresql://...@aws-0-<region>.pooler.supabase.com:6543/postgres`） |
| `DIRECT_URL` | ✅ | Supabase 直连地址（`:5432`） |
| `RATE_LIMIT_DISABLED` | — | EdgeOne 部署**留空**（默认降级为 no-op，依赖平台侧速率限制）；自建部署设 `0` 启用 |
| `SUPABASE_SERVICE_ROLE_KEY` | 仅 seed 用 | 本地跑 `npm run seed` 时需要，**不要**在 EdgeOne 控制台设置 |

> `DATABASE_URL` / `DIRECT_URL` 在应用运行时实际不读取（数据访问走 Supabase SDK），但 `prebuild` 的 `check-env.ts` 会校验其存在。若不想在 EdgeOne 配置真实值，可在控制台填占位符（如 `postgresql://placeholder`）使构建通过。

## 3. 部署方式

### 方式 A：CLI 部署（推荐）

```bash
npm install -g edgeone
edgeone login
edgeone pages deploy .next --project-name hbpattern
```

### 方式 B：Git 集成

在 EdgeOne Pages 控制台 → 新建项目 → 连接 GitHub/GitLab 仓库 → 选择 `AIMFllys/HBPattern`。

构建配置自动读取 `edgeone.json`：
- 构建命令：`npm run build`
- 输出目录：`.next`
- Node 版本：`20.18.0`

### 方式 C：一键部署按钮

在 README 中添加部署按钮（可选）。

## 4. 限流配置

EdgeOne Pages 的边缘函数/云函数是多实例的，应用内进程内存限流（`src/lib/rate-limit.ts`）在生产默认降级为 no-op。**必须在 EdgeOne 控制台配置平台侧速率限制**：

- EdgeOne 控制台 → 站点 → 安全与加速 → 速率限制
- 建议规则：
  - `POST /api/patterns`：60 秒 10 次
  - `POST /api/upload`：60 秒 20 次
  - `POST /api/patterns/*/comments`：60 秒 30 次
  - `GET /api/v1/*`：60 秒 120 次

## 5. 域名与 SSL

- EdgeOne Pages 自动提供 `*.edgeone.app` 预览域名。
- 绑定自定义域名：控制台 → 项目设置 → 域名管理 → 添加域名 → 按 CNAME 提示配置 DNS。
- SSL 证书自动签发，无需手动操作。

## 6. 本地调试 EdgeOne 环境

```bash
npm install -g edgeone
edgeone pages dev
```

CLI 会将前端和后端函数都映射到 `localhost:8088`，模拟边缘运行时环境。

## 7. 部署后验证

- [ ] 首页加载正常
- [ ] 画廊列表 + 详情页 SSR 正常
- [ ] Supabase 登录（邮箱 + GitHub OAuth）回调正常
- [ ] 图片上传 + next/image 优化加载正常
- [ ] 评论 / 点赞全链路正常
- [ ] 管理后台审核功能正常
- [ ] `/api/v1/*` 公开 API 正常 + CORS 预检通过

## 8. 常见问题

| 现象 | 排查 |
|------|------|
| 构建报「缺少环境变量」 | EdgeOne 控制台环境变量未配全 4 个必需项 |
| 登录后回调 404 | Supabase Auth URL 配置未加 EdgeOne 域名 |
| 图片加载 403 | `next.config.ts` 的 `remotePatterns` 已配 `*.supabase.co`，检查 Supabase Storage bucket 是否 public |
| API 限流不生效 | 正常现象，应用内限流已降级；在 EdgeOne 控制台配置速率限制规则 |
| `proxy.ts` 中间件未生效 | 确认文件名是 `proxy.ts`（Next.js 16 规范），EdgeOne 已支持 |
