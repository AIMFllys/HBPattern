# 认证与会话、授权与越权

审查对象是当前工作区全量代码（分支 `cursor/standards-cleanup-review-80d6`），不是 diff。结论只来自已读到的源码和迁移。下面不写攻击步骤、payload 或利用脚本。

匿名密钥会进浏览器。`supabase/migrations/0002_rls_policies.sql` 第 4–9 行把这写成威胁模型：路由里的 `requireAuth()` / `requireRole()` 挡不住对 PostgREST 的直接访问，数据库策略才是边界。下文凡是「已确认」的授权问题，都是这条边界上的策略或函数，不是对线上库是否已执行迁移的猜测。本次没有连库。

## 查过的位置

认证与会话：

- `src/proxy.ts`：`proxy`、`hasSupabaseEnv`、`isProtectedPagePath`、登录后的 `resolveSafeNextPath`。matcher 覆盖页面和 `/api`，但这里只做页面重定向，不代替 Route Handler 鉴权。
- `src/lib/auth/routes.ts`：`AUTH_ROUTES`、`PROTECTED_PAGE_PREFIXES`（`/dashboard`、`/upload`、`/profile`）、`resolveSafeNextPath`。
- `src/lib/auth/checks.ts`：`requireAuth`、`requireRole`。服务端用 `supabase.auth.getUser()`，缺用户或缺 id 时抛 `UNAUTHORIZED`；角色来自 `hp_users.role`，查不到则当成 `user`。
- `src/lib/auth/AuthError.ts`、`src/lib/auth/profile.ts` 的 `ensureUserProfile`。
- `src/lib/supabase/server.ts` 的 `createClient`、`src/lib/supabase/client.ts` 的 `createClient`、`src/app/auth/callback/route.ts` 的 `GET`（`exchangeCodeForSession`）。三处都没有传入 `cookieOptions`。
- `node_modules/@supabase/ssr/dist/module/utils/constants.js` 的 `DEFAULT_COOKIE_OPTIONS`（应用实际写进浏览器的 cookie 属性）。
- `src/stores/useAuthStore.ts`、`src/components/providers/AuthProvider.tsx`、`src/hooks/useAuthForm.ts`、`src/components/auth/AuthForm.tsx`、`src/components/auth/AuthModal.tsx`、`src/components/auth/PasswordUpdatePanel.tsx`、`src/components/layout/UserMenu.tsx`。
- `src/app/(auth)/login/page.tsx`、`src/app/(auth)/layout.tsx`、`src/app/(main)/dashboard/page.tsx`、`src/app/(main)/profile/page.tsx`、`src/app/(main)/upload/page.tsx`。
- `public/sw.js` 的 `fetch` 缓存。
- `src/lib/api/withApi.ts`：包装器不鉴权，只把 `AuthError` 映射成 401/403。

授权与越权：

- 全部 Route Handler：`src/app/api/patterns/route.ts`、`src/app/api/patterns/[id]/route.ts`、`src/app/api/patterns/[id]/comments/route.ts`、`src/app/api/patterns/[id]/like/route.ts`、`src/app/api/patterns/[id]/moderate/route.ts`、`src/app/api/regions/route.ts`、`src/app/api/stats/route.ts`、`src/app/api/upload/route.ts`、`src/app/api/v1/patterns/route.ts`、`src/app/api/v1/patterns/[id]/route.ts`、`src/app/api/v1/regions/route.ts`、`src/app/api/v1/stats/route.ts`、`src/app/auth/callback/route.ts`。
- `src/lib/api/apiKey.ts` 的 `resolveApiCaller`。全库只有定义，没有路由调用。
- `src/lib/queries.ts` 的 `getPatterns`、`getPatternById`、`getRelatedPatterns`、`getFeaturedPatterns`、`getStats`。公开读都带 `status in ('approved','featured')` 或只统计这类行。
- `supabase/migrations/0000_init.sql` 的表、`hp_role`、`hp_user_badges`，以及只挂在 `hp_patterns` 上的 `hp_set_updated_at`。
- `supabase/migrations/0002_rls_policies.sql`：`hp_is_admin`，以及 `hp_users`、`hp_patterns`、`hp_pattern_media`、`hp_comments`、`hp_user_likes`、公开字典表、默认拒绝表上的策略。
- `supabase/migrations/0003_hp_toggle_like.sql`：`hp_toggle_like`。
- 全库 `createClient`、`getUser`、`requireAuth`、`requireRole`、`service role` / `SUPABASE_SERVICE_ROLE_KEY`。service role 只出现在 `scripts/seed.ts`、`scripts/import-ai-patterns.ts`、`scripts/import-wikimedia.ts`、`scripts/upload-seed-images.ts` 和迁移注释里，没有进入 `src/` 客户端。

## 认证与会话

### AUTH-001

- 严重程度：中
- 状态：已确认
- 路径：`src/lib/auth/routes.ts`；`src/proxy.ts`
- 符号：`resolveSafeNextPath`；`proxy` 里已登录访问登录页的分支
- 行号：`routes.ts` 13–15；`proxy.ts` 94–96
- 触发条件：浏览器已经持有会话，再请求登录页，且 `next` 被 `resolveSafeNextPath` 接受。该函数只放行「以 `/` 开头，且不是 `//` 开头」的字符串。第二个字符为反斜杠时仍会放行。`proxy` 把这个字符串交给 `new URL(nextPath, origin)` 再重定向。
- 影响：在当前安装的 Next.js 16.2.1 上，这种相对路径经 `new URL` 解析后，主机名可以不再是本站，`NextResponse.redirect` 会把该主机名写入 `Location`。已登录用户会被带到别的源。会话 cookie 按主机写入，不会跟着到新主机；`Referrer-Policy` 为 `strict-origin-when-cross-origin`。回调路由 `src/app/auth/callback/route.ts` 33 行是把 origin 和 next 拼成绝对地址再重定向，同一类字符串在这次核对里主机名仍是本站，不并入本条。登录页客户端 `router.push` 没有在浏览器里执行，不作为本条结论。
- 修复方向：收紧 `next` 的接受条件，使重定向目标在 URL 解析之后仍然落在本站源上。

### AUTH-002

- 严重程度：中
- 状态：已确认
- 路径：`src/lib/supabase/server.ts`；`src/lib/supabase/client.ts`；`src/proxy.ts`；`src/app/auth/callback/route.ts`；`node_modules/@supabase/ssr/dist/module/utils/constants.js`
- 符号：`createClient`；`proxy` 的 cookie `setAll`；回调里的 `createServerClient`；`DEFAULT_COOKIE_OPTIONS`
- 行号：`server.ts` 4–21；`client.ts` 3–7；`proxy.ts` 63–76；`callback/route.ts` 14–27；`constants.js` 1–7
- 触发条件：登录、刷新会话或兑换授权码时，服务端按库的默认选项写 cookie。应用没有覆盖 `cookieOptions`。默认是 `path=/`、`sameSite=lax`、`httpOnly=false`、`maxAge` 约 400 天，对象里没有 `secure`。
- 影响：会话凭据可以被页面脚本读到，并且会在非 HTTPS 请求里被带上。`sameSite=lax` 仍在，跨站页面发起的写请求不会自动带上这份 cookie。浏览器端客户端当前要读这份 cookie 才能自己刷新会话，所以只把服务端改成 httpOnly 会和现有刷新方式冲突。
- 修复方向：让会话凭据不能被页面脚本读取，并且只在 HTTPS 上发送。若浏览器必须参与刷新，把脚本能读到的材料限制在刷新所需范围内，或改成只在服务端持有凭据。

### AUTH-003

- 严重程度：低
- 状态：已确认
- 路径：`public/sw.js`
- 符号：`fetch` 监听器
- 行号：39–80
- 触发条件：生产环境注册了该 Service Worker 之后，同源文档导航只要响应状态在 200–399 就会写入 Cache Storage，其中包含 `/profile`、`/dashboard` 这类登录后才返回 200 的 HTML。其余同源 GET 在 200 时走 stale-while-revalidate，缓存键是请求 URL，不包含用户。
- 影响：同一浏览器上换账号，或退出后在网络失败时再打开这些地址，可能读到上一份个人页或后台 HTML，以及上一份带身份的 GET 响应。缓存不出本机。
- 修复方向：带登录身份的导航和 API 响应不要进入 Cache Storage。

### AUTH-004

- 严重程度：低
- 状态：疑似
- 路径：`src/hooks/useAuthForm.ts`
- 符号：`handleSubmit`、`handlePasswordReset`
- 行号：52–53、60–61、84
- 触发条件：邮箱注册、密码登录或发送重置邮件失败时，界面直接展示 Supabase 返回的 `error.message`。
- 影响：若这些文案会因邮箱是否已注册而不同，访问者可以据此区分账号。仓库里没有 Supabase Auth 的邮件确认开关和错误文案配置，这一步还要在项目的 Auth 设置里核对失败文案。
- 修复方向：对用户只返回统一的失败原因。

### 已核对且无问题

- `requireAuth` / `requireRole`（`checks.ts` 23–59）在 `getUser` 失败、用户为空或 id 为空时拒绝；角色不在名单里时 `requireRole` 抛 `FORBIDDEN`。无。
- 未登录访问 `/dashboard`、`/upload`、`/profile` 时，`proxy.ts` 87–91 行在 `getUser` 正常返回空用户时会转到登录页。`dashboard/page.tsx` 10–14 行和 `profile/page.tsx` 14–15 行各自再查一次 `getUser`。环境变量缺失或 `getUser` 抛错时 proxy 会放行（`proxy.ts` 19–21、98–101），上传页本身没有服务端身份判断，但提交仍进入 `requireAuth`。这只让未登录者看到上传表单，不记为身份被接受。无。
- `src/app/auth/callback/route.ts` 29–33 行先兑换授权码再跳转。无。
- `PasswordUpdatePanel` 的 `updateUser({ password })` 只出现在已登录的个人页。无。
- `useAuthStore` 和 `UserMenu.tsx` 64 行的 `role === 'admin'` 只决定菜单是否画出后台链接。无。
- 全库服务端身份判断用的是 `getUser`，没有用 `getSession` 的本地用户对象做授权。无。

## 授权与越权

### AUTHZ-001

- 严重程度：高
- 状态：已确认
- 路径：`supabase/migrations/0002_rls_policies.sql`；`supabase/migrations/0000_init.sql`；`src/lib/auth/checks.ts`；`src/app/(main)/dashboard/page.tsx`
- 符号：`hp_users_insert_self`、`hp_users_update_self`、`hp_is_admin`；`requireRole`；后台页的 `profile.role`
- 行号：`0002_rls_policies.sql` 23–30、37–42；`0000_init.sql` 39–51（`hp_users` 没有保护 `role` 的触发器；全文件触发器只有 `hp_patterns` 的 `hp_set_updated_at`，257–270 行）；`checks.ts` 31–37、52–56；`dashboard/page.tsx` 13–14
- 触发条件：已登录用户写自己的 `hp_users` 行。插入策略只要求 `id = auth.uid()`，更新策略只要求目标行是自己或 `hp_is_admin()`。两处都没有按列限制。`ensureUserProfile`（`profile.ts` 20–32）自己的载荷不含 `role`，挡不住绕过该函数的直接写入。
- 影响：调用者可以把 `role` 写成 `admin`，也可以改 `contribution_points`、`contributor_level`、`email`。`requireRole`、`hp_is_admin()` 和后台页都读这一列。写成管理员之后，审核路由、待审核纹样和其他管理员策略都会把该用户当成管理员。
- 修复方向：收紧 `hp_users` 的写入，使普通用户不能修改角色、贡献分和等级；角色变更只留给既有管理员或数据库侧。

### AUTHZ-002

- 严重程度：高
- 状态：已确认
- 路径：`supabase/migrations/0002_rls_policies.sql`；`src/app/api/patterns/route.ts`；`src/app/api/patterns/[id]/moderate/route.ts`；`src/lib/validation/schemas.ts`
- 符号：`hp_patterns_insert_owner`、`hp_patterns_update_owner_admin`；`POST`；`PATCH`；`CreatePatternBody`
- 行号：`0002_rls_policies.sql` 51–57；`patterns/route.ts` 31–44、53–57；`moderate/route.ts` 27–32；`schemas.ts` 26；状态列定义在 `0000_init.sql` 104
- 触发条件：已登录用户插入或更新 `uploader_id` 为自己的 `hp_patterns` 行。策略只核对上传者是不是当前用户。`POST /api/patterns` 会把 `status` 写成 `pending`，`PATCH .../moderate` 先走 `requireRole(['admin'])`，这两处都不约束直接写表。
- 影响：上传者可以自行把 `status` 写成 `approved` 或 `featured`，也可以改 `like_count`、`view_count` 以及名称、描述等已审核内容。公开列表、详情和首页精选都按这些状态和计数读取。审核路由对普通角色的拒绝因此可以被绕开。`POST` 还把任意可解析的 `imageUrl` 写入 `hp_pattern_media`，不核对这个地址是不是当前用户刚上传的对象。
- 修复方向：收紧纹样的插入和更新，审核状态与计数只允许管理员或数据库函数修改；创建接口只接受当前用户自己的媒体地址。

### AUTHZ-003

- 严重程度：高
- 状态：已确认
- 路径：`supabase/migrations/0002_rls_policies.sql`；`supabase/migrations/0000_init.sql`
- 符号：`hp_users_select`；表 `hp_users`
- 行号：`0002_rls_policies.sql` 34–36；`0000_init.sql` 39–51
- 触发条件：任意持有匿名密钥的客户端读取 `hp_users`。策略是 `FOR SELECT USING (true)`，迁移里没有按列收回权限。策略注释写的是对外昵称和头像，策略正文没有这个限制。
- 影响：邮箱、`role`、`preferences`、`last_login`、贡献分和隐私协议标记都可以被匿名读出。评论路由只投影 `nickname` 和 `avatar_url`（`comments/route.ts` 28、78 行），挡不住不经过该路由的读取。
- 修复方向：收紧 `hp_users` 的读取，匿名用户和其他用户只能看到对外展示所需的列。

### AUTHZ-004

- 严重程度：高
- 状态：已确认
- 路径：`supabase/migrations/0002_rls_policies.sql`
- 符号：`hp_pattern_media_select`；对照 `hp_patterns_select`
- 行号：64–66；纹样可见性在 47–50 行
- 触发条件：任意持有匿名密钥的客户端读取 `hp_pattern_media`。该策略对全部行开放读取。同一文件第 66 行写明这些 URL 指向公开存储对象。纹样表本身只让外人看到 `approved` 和 `featured`。
- 影响：`pending` 和 `rejected` 纹样的媒体地址可以被列出来。纹样行的名称和描述仍然受纹样策略保护，但图片地址不受这条保护。
- 修复方向：收紧媒体读取，使未公开纹样的媒体不对上传者以外的人开放。

### AUTHZ-005

- 严重程度：中
- 状态：已确认
- 路径：`supabase/migrations/0003_hp_toggle_like.sql`；`src/app/api/patterns/[id]/like/route.ts`
- 符号：`hp_toggle_like`；`POST`
- 行号：`0003_hp_toggle_like.sql` 16–54、57；`like/route.ts` 35–46
- 触发条件：已登录用户调用 `hp_toggle_like`。函数是 `SECURITY DEFINER`，只拒绝 `auth.uid()` 为空，不看纹样状态。路由在调用前要求状态为 `approved` 或 `featured`，直接调用函数不经过这段判断。迁移把执行权授给 `authenticated`；PostgreSQL 新建函数还会保留对 `PUBLIC` 的执行权，迁移没有收回。匿名调用会在函数内因 uid 为空失败。
- 影响：已登录用户可以对未公开纹样切换点赞，并改写该行的 `like_count`。点赞表上的本人策略（`0002_rls_policies.sql` 96–103）限制的是直接写表，限制不到这个函数。函数只用 `auth.uid()`，不能替别人点赞。
- 修复方向：在函数内要求目标纹样处于对外可见状态；执行权只留给已登录角色。

### AUTHZ-006

- 严重程度：中
- 状态：已确认
- 路径：`supabase/migrations/0002_rls_policies.sql`；`src/app/api/patterns/[id]/comments/route.ts`
- 符号：`hp_comments_select`、`hp_comments_insert_self`、`hp_comments_modify_owner_admin`；`GET`、`POST`
- 行号：`0002_rls_policies.sql` 80–88；`comments/route.ts` 26–32、59–77；`schemas.ts` 49–51
- 触发条件：读取评论时，路由和策略都只看评论 `status`，不看纹样是否仍对外可见。写入时，插入策略只要求 `user_id = auth.uid()`。`POST` 在写库前会确认纹样为 `approved` 或 `featured`（59–67 行），并自行把评论标成 `approved`（76 行）。直接写表不经过这段确认。更新策略允许作者改自己的评论行，其中包括 `pattern_id` 和 `status`。`parentId` 只校验是 UUID。
- 影响：已登录用户可以在未公开纹样上留下对外可见的评论；纹样随后被拒绝或删除可见性之后，`GET /api/patterns/[id]/comments` 仍会返回这些已通过评论。父评论不要求属于同一条纹样。评论作者不能把 `user_id` 改成别人。
- 修复方向：评论的读取和写入都与纹样的可见性绑定；下架后不再对作者以外的人开放。父评论必须属于同一纹样。

### AUTHZ-007

- 严重程度：低
- 状态：已确认
- 路径：`supabase/migrations/0000_init.sql`；`supabase/migrations/0002_rls_policies.sql`
- 符号：表 `hp_user_badges`；`0002` 里两段 `ENABLE ROW LEVEL SECURITY` 的表名单
- 行号：`0000_init.sql` 222–228；`0002_rls_policies.sql` 110–117、126–132
- 触发条件：`hp_user_badges` 有表定义，但不在公开只读名单里，也不在「启用 RLS、暂不建策略」的名单里。`src/` 没有读写这张表。
- 影响：按 `0002` 第 4–9 行的权限模型，未启用 RLS 的表可以被持有匿名密钥的客户端直接读写，行主不受限制。数据只是徽章键和时间。若线上已经另行开启 RLS，以线上 `relrowsecurity` 为准；本次没有连库。
- 修复方向：给这张表补上与其他用户私有表相同的行级访问控制，默认拒绝。

### AUTHZ-008

- 严重程度：中
- 状态：疑似
- 路径：`src/app/api/upload/route.ts`；`supabase/migrations/`
- 符号：`POST`；存储桶 `pattern-images`
- 行号：`upload/route.ts` 16–35。`supabase/migrations/0000_init.sql` 至 `0003_hp_toggle_like.sql` 中没有 `storage.objects` 策略或 bucket 定义。
- 触发条件：上传路由在 `requireAuth()` 之后，用当前用户的服务器客户端把对象写到 `{user.id}/{timestamp}.{ext}`，再取公开 URL。直接访问 Storage API 时是否只能写自己的前缀，仓库里没有对应策略。
- 影响：路由本身不会在未登录时上传，扩展名也在白名单内。若桶策略允许任意已登录用户写任意对象名，或允许覆盖他人前缀，路由里的路径前缀可以被绕开。还要核实桶是否为 public，以及匿名角色能否列对象或改对象。
- 修复方向：为 `pattern-images` 补上按当前用户前缀限制的存储读写策略，并只对已公开纹样的对象开放读取。

### 已核对且无问题

- `GET /api/patterns`、`GET /api/patterns/[id]`、四个 `/api/v1/*` 的 GET、`GET /api/regions`、`GET /api/stats`：无登录要求，查询落在 `getPatterns` / `getPatternById` / `getRelatedPatterns` / `getFeaturedPatterns` / `getStats` 或字典表上。纹样查询带公开状态条件（`queries.ts` 64、105、120、138、151）。无越权读取未公开纹样行。
- `queries.ts` 69–73 行会去掉搜索串里的 `%`、`_`、逗号、括号和星号，再放进 `.or()`。不能靠搜索串再追加一条状态条件。无。
- `POST /api/upload`、`POST /api/patterns`、`POST .../comments`、`POST .../like` 都先 `requireAuth()`。`PATCH .../moderate` 先 `requireRole(['admin'])`（`moderate/route.ts` 27）。角色值可信时，这条路由会拒绝普通用户；角色值被 AUTHZ-001 改写后除外。无单独的路由缺陷。
- `hp_user_likes` 的直接插入、删除、读取都要求 `user_id = auth.uid()`（`0002_rls_policies.sql` 96–103）。无跨用户点赞。越权点赞见 AUTHZ-005。
- `hp_regions`、`hp_techniques`、`hp_ich_records`、`hp_tags`、`hp_pattern_tags`、`hp_pattern_relations` 只有公开 SELECT（`0002_rls_policies.sql` 110–117），没有写策略。无匿名改字典。
- `hp_collections`、`hp_collection_items`、`hp_user_view_history`、`hp_notifications`、`hp_reports`、`hp_ai_tasks`、`hp_api_keys` 只启用 RLS、不建策略（126–132 行），默认拒绝。无。
- `hp_is_admin()`（`0002_rls_policies.sql` 23–30）只返回当前 `auth.uid()` 是否为管理员，`search_path` 已固定。它不返回其他用户的行。无独立的信息泄露；它信任的 `role` 列见 AUTHZ-001。
- 上传者删除自己的纹样由 `hp_patterns_delete_owner_admin`（`0002_rls_policies.sql` 59–60）允许，条件仍是本人或管理员。无跨用户删除。
- `src/lib/api/apiKey.ts` 17–31 行的 `resolveApiCaller` 把请求头原文拿去和 `key_hash` 比较，没有先哈希。没有任何路由调用它，`hp_api_keys` 又是默认拒绝，当前读不到行，也不形成入口。无。
- `src/lib/api/cors.ts` 只被 `/api/v1` 使用，允许的方法是 GET 和 OPTIONS，没有带凭证的响应头。带会话的写接口没有这套跨源放行。无。
- service role 只在种子和导入脚本中使用，并在缺少该密钥时回退到 anon key（例如 `scripts/seed.ts` 45–49）。回退不会把 service role 送进浏览器。无。

## 不记为漏洞

- 生产环境限流降级只影响计数是否生效，不改变身份判断，不收入本文件。
- `moderator` 这个枚举值没有策略、也没有 `requireRole(['moderator'])` 调用。它现在等同普通用户，不构成越权。
- 前端 `useAuthStore.role` 可以被本地改掉，但后台数据和审核接口不读这个 store。
- 对已公开纹样发表评论时把 `status` 写成 `approved`，是 `comments/route.ts` 76 行的既有行为。可见性脱节见 AUTHZ-006，不把「评论免审核」再记一条。
