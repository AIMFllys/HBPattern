# SSRF 与出站请求、加密与随机数、日志与信息泄露、上传与输入校验

审查对象是当前工作区全量代码（分支 `cursor/standards-cleanup-review-80d6`），不是 diff。结论只来自已读到的源码和迁移。下面不写攻击步骤、payload 或利用脚本。

地图瓦片、字形、地形和构建脚本里的出站地址都是写死的公开 URL，调用方不能改，不记为 SSRF。`Math.random` 只出现在界面 id 和种子数据的展示计数里，没有用于口令、会话令牌或签名。非 production 错误响应带回 `details` 是 `withApi` 的既有行为；本次没有确认这些 `details` 含有密钥或堆栈，因此不编号。

## SSRF 与出站请求

### SSRF-001

- 严重程度：低
- 状态：已确认
- 路径：`next.config.ts`；`src/app/(main)/profile/page.tsx`；`src/components/layout/UserMenu.tsx`；`src/components/workshop/PatternAssetCard.tsx`；`src/components/workshop/PatternAssetPanel.tsx`；`src/lib/validation/schemas.ts`；`src/app/api/patterns/route.ts`；`supabase/migrations/0002_rls_policies.sql`
- 符号：`remotePatterns`、`<Image>`、`CreatePatternBody.imageUrl`、`hp_users_update_self`
- 行号：`next.config.ts` 20–30；`profile/page.tsx` 49；`UserMenu.tsx` 45；`PatternAssetCard.tsx` 57–58；`PatternAssetPanel.tsx` 207–208；`schemas.ts` 26；`patterns/route.ts` 56；`0002_rls_policies.sql` 40–42
- 触发条件：已登录用户可以更新自己的 `hp_users` 行，策略没有按列限制，`avatar_url` 会进入个人页和用户菜单的 `next/image`。另外，`POST /api/patterns` 接受任意可通过 URL 解析的 `imageUrl`；纹样变为 `approved` 或 `featured` 后，工坊列表用同一组件加载 `media.url` / `thumbnail_url`。
- 影响：Next 图片优化器只会对 `remotePatterns` 里的主机发服务端请求。当前允许的是 `https://*.supabase.co/storage/v1/object/public/**` 和 `https://lh3.googleusercontent.com`。落在这份名单里的用户指定地址，会由应用服务器去取图。名单之外的主机、内网地址和用户改不了的地图瓦片，不会走这条服务端请求。Route Handler 里没有把用户传入的 URL 交给 `fetch`。
- 修复方向：把 `remotePatterns` 收紧到本项目的存储主机。`avatar_url` 与 `imageUrl` 只允许该主机上的 https 地址，并避免把未审核地址送进 `next/image`。

### 已核对、不编号

- `src/lib/map/style/inkStyle.ts` 19–23、61–72：`OPENFREEMAP_TILES`、`OPENFREEMAP_GLYPHS`、`OPENFREEMAP_SPRITE`、`TERRAIN_TILES` 均为常量。`createInkStyle` 没有接收用户 URL。无。
- `src/data/map/hubei.ts` 13–17：`HUBEI_GEO_SOURCE.apiUrl` 是常量，运行时地图读取本地 GeoJSON。无。
- `scripts/build-hubei-boundaries.mjs` 3、66；`scripts/build-hubei-geojson.mjs` 11、14；`scripts/build-neighbor-provinces.mjs` 16–30：构建脚本请求写死的 DataV 地址，adcode 来自脚本内的常量列表。无。
- `scripts/import-wikimedia.ts` 19–55、87：`sourceUrl` 是脚本内的四条常量，不是请求参数。无。
- `src/lib/api/fetcher.ts` 的 `apiFetch` / `apiFetchPaginated`：仓库内没有调用点。页面上的 `fetch`（上传、评论、点赞、审核）目标都是站内 `/api/...`。无。
- `public/sw.js` 39–42：只处理与 Service Worker 同源的 GET。无。
- `src/lib/workshop/canvasEngine.ts` 129–131 `loadCanvasImage`：在浏览器里 `fetch` 图层地址，请求不经应用服务器。地址来自已入库纹样或本地占位 data URL。无。
- `src/components/admin/ModerationList.tsx` 41：审核页用 CSS 加载 `media.url`，请求发自审核员浏览器。无。
- 全库未找到 `axios`、`http.get`、`https.get`。无。

## 加密与随机数

### CRYPTO-001

- 严重程度：低
- 状态：已确认
- 路径：`src/components/map/utils/mapDemoUtils.ts`；调用见 `src/components/map/HubeiMapClient.tsx`
- 符号：`createId`；调用点 `addBinding`、`saveDraftAndBind`
- 行号：`mapDemoUtils.ts` 30–35；`HubeiMapClient.tsx` 193、208、221
- 触发条件：`crypto.randomUUID` 存在时走 UUID。只有 `crypto` 或 `crypto.randomUUID` 缺失时，才退回 `` `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}` ``。
- 影响：用途是地图 Demo 的本地 id，前缀为 `binding` 和 `demo-pattern`，写入浏览器本地状态。不参与口令、会话令牌、CSP nonce 或鉴权。退路的熵和可预测性只影响这份本地 Demo 状态的唯一性。
- 修复方向：退路改为 `crypto.getRandomValues`，或在没有 Web Crypto 时拒绝创建需要唯一 id 的本地记录。

### CRYPTO-002

- 严重程度：低
- 状态：已确认
- 路径：`src/stores/useWorkshopStore.ts`
- 符号：`createLayerId`；调用点 `addLayer`、`addPatternLayer`、`addColorLayer`
- 行号：67–70；调用约 114、140、166
- 触发条件：每次新建工坊图层都会执行。随机部分是 `Math.random().toString(36).slice(2, 8)`，再拼上 `Date.now()`。
- 影响：用途是工坊画布图层的前端 id。不参与口令、会话令牌或鉴权。碰撞只会影响同一浏览器里的图层标识。
- 修复方向：与 `createId` 的主路径一样使用 `crypto.randomUUID`。

### 已核对、不编号

- `src/lib/security/csp.ts` 63–76 `generateNonce`、`src/lib/api/requestId.ts` 15–22 `resolveRequestId`、`src/proxy.ts` 28–32：nonce 和请求 id 使用 `crypto.randomUUID`。入站 `X-Request-Id` 必须匹配 UUID v4 正则，字符集只有十六进制和连字符。无。
- `scripts/seed.ts` 72–80 `uuidFromSlug`、104–106 `pseudoCount`：SHA-1 用来从种子 slug 生成稳定 id 和展示用计数，不是口令存储或令牌。无。
- `scripts/import-ai-patterns.ts` 75、112–113；`scripts/import-wikimedia.ts` 131–132：`Math.random` 只用于种子纹样的展示名、浏览量和点赞数。无。
- 全库没有 `Math.random` 的其他调用，也没有自实现的口令哈希、HMAC 或对称加密。无。

## 日志与信息泄露

### LOG-001

- 严重程度：低
- 状态：已确认
- 路径：`src/lib/api/withApi.ts`
- 符号：`withApi` 未知异常分支
- 行号：109–116
- 触发条件：Route Handler 抛出的不是 `AppError` 及其子类。production 与非 production 都会执行。
- 影响：服务端 `console.error` 写入 JSON，字段包括异常名、`message` 和 `stack`。同一分支返回给客户端的正文只有 `INTERNAL_ERROR`、固定文案「服务器内部错误」和 `requestId`，不含 `stack` 或 `details`。本次没有看到密钥被放进这条日志；若异常 `message` 本身带有上游文本，该文本会留在平台日志里。
- 修复方向：生产日志去掉 `stack`，并对 `message` 做长度和关键字约束。客户端响应维持现在的固定文案。

### LOG-002

- 严重程度：低
- 状态：已确认
- 路径：`src/app/(main)/gallery/[id]/page.tsx`
- 符号：`PatternDetailPage`
- 行号：55–68
- 触发条件：纹样详情页取数抛出非 Next 控制流错误时。`unstable_rethrow` 先放行 `notFound` / `redirect`。
- 影响：服务端日志包含路径、路由 `id`、`String(err)` 和 `stack`，然后页面转入 404。堆栈不会出现在响应正文。`id` 是路径参数，不是密钥。没有把评论正文或口令写入这条日志。
- 修复方向：与 LOG-001 相同，生产日志只保留请求 id、路径和异常名。

### 已核对、不编号

- `src/lib/api/withApi.ts` 74、95：`fail` 和 `AppError` 的 `details` 仅在 `NODE_ENV !== 'production'` 时写入响应。production 置为 `undefined`。这是既有行为。无。
- `src/app/api/regions/route.ts` 13；`src/app/api/v1/regions/route.ts` 21：把 Supabase 查询错误对象放进 `details`。该对象是查询失败信息。本仓库没有给它附上服务角色密钥或 `Error.stack`。production 下仍被 `withApi` 丢掉。无。
- `src/lib/validation/parse.ts` 15：校验失败时 `details` 是 Zod issues，非 production 会回到发起该次请求的客户端。没有密钥或堆栈。无。
- `src/app/api/upload/route.ts` 38、`src/app/api/patterns/route.ts` 47 和 62、评论与点赞路由：数据库错误放在 `AppError` 的 `cause`，`withApi` 不把 `cause` 写入响应。无。
- `src/app/error.tsx` 16：`console.error(error)` 在浏览器错误边界，只出现在当前用户的控制台，不返回给其他客户端。无。
- `src/lib/queries.ts` 36：`console.warn` 记录标签和 `error.message`，没有 `stack`。标签 `getPatternById(${id})` 含路径 id。没有看到密钥。无。
- `src/lib/rate-limit.ts` 78–82：只打印限流降级说明，不含用户标识或密钥。无。
- `scripts/upload-seed-images.ts` 48–49 打印的是公开的 Supabase URL 和桶名，不打印服务角色密钥。`scripts/check-env.ts` 对值做了掩码。无。

## 上传与输入校验

### UPLOAD-001

- 严重程度：中
- 状态：已确认
- 路径：`src/lib/upload/config.ts`；`src/app/api/upload/route.ts`
- 符号：`validateUpload`、`POST`
- 行号：`config.ts` 34–52；`route.ts` 16–35
- 触发条件：任意已登录用户调用 `POST /api/upload`。未登录在 `requireAuth` 处被拒绝。校验顺序是大小、`file.type`、扩展名，通过后把 `form.file.type` 当作 `contentType` 写入 `pattern-images`。
- 影响：大小上限 10MB，声明类型只允许 `image/jpeg`、`image/png`、`image/webp`，扩展名只允许 `jpg`、`jpeg`、`png`、`webp`。代码不读取文件内容，没有魔数或解码校验。声明类型和扩展名可以由上传方指定，因此非图片字节也能在声明符合要求时进入存储，并以该声明类型保存。存储域名与页面域名分离，这条结论不推断浏览器会把该对象当成页面脚本执行。
- 修复方向：在通过声明校验后解码图片，只接受真实的 JPEG、PNG、WebP，再用服务端决定的内容类型和扩展名落盘。

### UPLOAD-002

- 严重程度：中
- 状态：已确认
- 路径：`src/lib/validation/schemas.ts`；`src/app/api/patterns/route.ts`；`supabase/migrations/0002_rls_policies.sql`
- 符号：`CreatePatternBody`、`POST`、`hp_pattern_media_select`
- 行号：`schemas.ts` 20–27；`patterns/route.ts` 20、53–57；`0002_rls_policies.sql` 64–66
- 触发条件：已登录用户调用 `POST /api/patterns`。`imageUrl` 只经过 `z.string().url()`。当前 Zod 3 的该校验接受任意能被 URL 解析器解析的字符串，不限制为 https，也不要求等于 `POST /api/upload` 刚返回的地址。纹样行本身要审核后才公开；`hp_pattern_media` 的 SELECT 策略是 `USING (true)`。
- 影响：任意可解析 URL 会写入 `hp_pattern_media.url`。匿名客户端可以读到包括待审核纹样在内的媒体 URL。审核通过后，画廊、地图和知识图谱把该字符串用于 CSS `url("...")` 或 SVG `href`；主机若同时落在 `remotePatterns` 内，还会进入 SSRF-001 的图片优化请求。迁移注释认为这些 URL 指向公开存储对象，但本仓库没有 `storage.objects` 策略，对象字节是否匿名可读仍是疑似。
- 修复方向：只接受本项目存储主机上、由本次上传产生的 https URL。媒体行的读取范围与纹样可见性保持一致。写入展示层之前不要把未编码的字符串拼进 CSS。

### UPLOAD-003

- 严重程度：低
- 状态：已确认
- 路径：`src/app/api/upload/route.ts`；`src/lib/upload/config.ts`；`next.config.ts`
- 符号：`POST`、`validateUpload`
- 行号：`route.ts` 13、22；`config.ts` 36–40；`next.config.ts` 未配置请求体上限
- 触发条件：已登录用户提交 multipart。`await req.formData()` 先读完整份表单，`validateUpload` 再比较 `file.size` 与 10MB。`file.size === 0` 且声明类型、扩展名合法时会继续上传。
- 影响：超过 10MB 的对象不会被送到 Storage，但应用代码在拒绝前已经把正文读入。本仓库的 `next.config.ts` 没有声明 Route Handler 正文上限，实际上限取决于运行平台。空文件可以占一条 `userId/时间戳.扩展名` 的存储对象。
- 修复方向：在解析前按平台能力限制正文大小；`validateUpload` 同时拒绝空文件。

### UPLOAD-004

- 严重程度：中
- 状态：已确认
- 路径：`src/lib/rate-limit.ts`；`src/app/api/upload/route.ts`
- 符号：`rateLimit`、`POST`
- 行号：`rate-limit.ts` 65–85，配额定义在 13；`route.ts` 19
- 触发条件：`NODE_ENV === 'production'` 且 `RATE_LIMIT_DISABLED` 不是 `'0'`。代码注释把这写成多实例下的有意降级，并建议改靠平台 WAF。`RATE_LIMIT_DISABLED === '1'` 时任何环境都直接返回。
- 影响：`POST /api/upload` 设计配额是每用户每 60 秒 20 次，但上述条件下应用内计数不执行。上传接口仍然要求登录，主体设计是 `user.id`，不读取 `X-Forwarded-For`。本仓库看不到 EdgeOne / WAF 规则是否另外生效；在没有那层规则时，登录用户不受这条应用配额约束。
- 修复方向：生产环境使用共享计数或已配置的平台限流。应用内保护关闭时给出明确的部署检查，而不是静默跳过。

### 已核对、不编号

- `src/app/api/upload/route.ts` 16、25–26：未登录不能上传。存储路径是 `userId/时间戳.扩展名`，扩展名来自文件名最后一段，原始文件名不进入路径。无路径穿越。无。
- `src/app/(main)/upload/page.tsx` 只是调用上述 API，浏览器端的 `accept` 不是服务端边界。无。
- `scripts/upload-seed-images.ts`、`scripts/import-ai-patterns.ts`、`scripts/import-wikimedia.ts`：操作者在本机运行，读取环境变量指定的本地目录或脚本内常量 URL，使用服务角色密钥，不接受外部请求。无。
