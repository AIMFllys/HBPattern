# 生产上线就绪度审查与修复

日期：2026-05-26

## 范围

对全栈代码库（前端 + API + 数据访问 + 安全/部署配置）进行系统性审查，并对发现的问题进行修复。审查通过 5 个并行专项代理覆盖：安全与凭据合规、API 路由正确性、数据访问层、前端/Next 16、部署与可观测性。

## 基线（修复前后均通过）

- `npx tsc --noEmit` ✓
- `npm run lint`（ESLint + lint-guards）✓
- `npm test` ✓（27 文件 / 95 用例）
- `npm run build`（Next.js 16.2.1）✓

## 本轮已修复

### 安全 / API
- **公开搜索过滤注入**（`src/lib/queries.ts`）：搜索词 `q` 现额外剥离 `,()*\`，堵住通过 PostgREST `.or()` 表达式注入额外过滤子句、进而暴露 `pending/rejected` 纹样的风险。
- **公开 v1 API 限流**（`src/lib/rate-limit.ts` + `src/app/api/v1/**`）：原先 `/api/v1/*` 既无鉴权也无限流。新增按来源 IP 的配额（120/min）与 `clientIp()` 辅助函数，并接入全部 4 个 v1 路由，缓解匿名抓取 / DoS。
- **CORS 一致性 & HSTS**（`src/proxy.ts`）：v1 的 CORS 头改用 `corsHeaders()`（尊重 `CORS_ALLOWED_ORIGINS` 白名单），与 OPTIONS 预检统一；生产环境注入 `Strict-Transport-Security`。
- **CSP 收紧**（`src/lib/security/csp.ts`）：新增 `object-src 'none'`、`base-uri 'self'`。
- **写入前可见性校验**（comments / like 路由）：发表评论 / 点赞前确认目标纹样为 `approved/featured`，否则返回干净的 404，避免孤儿写入与原始 500。
- **评论列表上限**：评论 GET 增加 `.limit(200)`，防止热门纹样返回无上限列表。
- **纹样创建的补偿写入**（`src/app/api/patterns/route.ts`）：媒体记录写入失败时删除刚创建的纹样，避免无图孤儿记录（PostgREST 无跨语句事务）。

### 前端
- **3D 几何体释放**（create/models 的 Scarf/TShirt/Fan/TeaCup）：卸载时 `dispose()` 手动创建的几何体，修复切换产品时的 WebGL 显存泄漏。
- **上传预览 URL 回收**（upload 页）：替换 / 卸载时 `revokeObjectURL`。
- **可访问性**（gallery/[id]）：装饰性图标 `<span>` 增加 `aria-hidden`，避免读屏器朗读连字文本。
- **CommentSection**：`AbortController` 取消未完成请求 + 关联用户空值保护。
- **LikeButton**：登录用户挂载后拉取真实点赞状态，修复「已点赞却显示空心」（页面以 `initialLiked={false}` 占位）。

### 运维 / 合规
- **移除提交的开发机指纹**（`scripts/import-ai-patterns.ts`、`upload-seed-images.ts`）：原硬编码 `C:\Users\Lenovo\.gemini\...` 改为 `AI_IMAGES_DIR` / `SEED_IMAGES_DIR` 环境变量（符合 AGENTS.md）。
- **环境变量校验前置**（`scripts/check-env.ts` + `package.json` `prebuild`）：通过 `@next/env` 加载 `.env*`，`prebuild` 自动执行；缺失必需变量时在构建阶段快速失败，而非运行时宕机。新增对 `NEXT_PUBLIC_SITE_URL` 的推荐告警。
- **CI 与凭据扫描**（`.github/workflows/ci.yml`）：lint / typecheck / test + gitleaks 密钥扫描（AGENTS.md 建议）。
- **性能索引迁移**（`supabase/migrations/0001_performance_indexes.sql`）：补齐 `hp_patterns` 等热点表的索引与搜索的 `pg_trgm` GIN 索引。

## 数据库可复现性与安全（本轮新增可应用的迁移）

仓库原先无 `prisma/migrations/`，live DB 由带外流程创建。本轮补齐了可复现、可评审的 SQL 迁移（见 `supabase/migrations/`）：

- `0001_performance_indexes.sql`：热点表索引 + `pg_trgm` 搜索索引（附加、安全）。
- `0002_rls_policies.sql`：完整 RLS 策略，与应用层鉴权一致（anon key 公开，RLS 为硬性安全门槛）。
- `0003_hp_toggle_like.sql`：点赞 RPC 的参考定义（原未入库）。
- `README.md`：应用顺序、分支测试与校验步骤；并记录 **Prisma 决策**（`schema.prisma` 仅作 schema-of-record，运行时全程 Supabase 直连）。

新增只读诊断脚本 `scripts/check-db-security.ts`：连库核验各 `hp_*` 表的 RLS 开关、策略、RPC、索引现状（不打印任何机密）。

## 上线前仍需负责人在其环境执行（本审查沙箱网络被代理至 198.18.0.0/15 黑洞，无法连真实 Supabase，故以下必须在你的环境完成）

1. **【硬性门槛】应用并验证 RLS**：在 Supabase 分支/预发应用 `0002_rls_policies.sql`，按 `supabase/migrations/README.md` 冒烟测试所有页面，再用 `get_advisors(type: security)` 确认 `public.hp_*` 无「RLS disabled」告警，最后晋级生产。**未开 RLS = 公开 anon key 可绕过应用层直连读写，绝对不可上线。**
2. **应用性能索引**：`0001_performance_indexes.sql`（大表建议 `CONCURRENTLY`）。
3. **核对/应用点赞 RPC**：`0003` 与 live `\df+ public.hp_toggle_like` 对比后再决定是否覆盖。
4. **限流后端**：进程内存计数仅单实例有效；PM2 cluster / 多实例 / serverless 前换 Redis。
5. **设置 `NEXT_PUBLIC_SITE_URL`**：生产 `metadataBase` / OG / 规范链接，否则回退 localhost。
6. **凭据卫生**：`.env.local` 含真实 DB 口令（已 gitignore、未入库）；若曾外泄请轮换。CI 已加 gitleaks 防线。
7. **（可选）启用 v1 API Key 鉴权**：`src/lib/api/apiKey.ts` 当前明文比较 `key_hash`（死代码），启用前需哈希存储 + 时间安全比较。

## 结论

代码层面的安全 / 正确性 / 资源泄漏 / 合规问题已全部修复并验证通过（tsc/lint/test/build 全绿），数据库的 RLS / 索引 / RPC 已写成可应用、可评审的迁移并入库。**剩余事项均需在能访问真实 Supabase 的环境执行**（本审查沙箱网络被黑洞，无法连库自动完成），其中第 1 项 RLS 为硬性安全门槛——执行迁移 `0001–0003` 并通过 advisors 校验后即可放行上线。
