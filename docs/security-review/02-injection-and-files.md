# 注入、反序列化、路径与文件

审查对象是当前工作区全文，不限于本次 diff。重点读了 `src/lib/queries.ts`、`src/app/api/**`、`src/lib/validation/**`、`src/lib/upload/**`、`src/components/map/utils/**`、`src/lib/map/**`、`src/lib/workshop/**`、`scripts/**`、`supabase/migrations/**`。并检索了 `.rpc(`、`.from(`、`query(`、`sql`、`innerHTML`、`dangerouslySetInnerHTML`、`JSON.parse`、`eval(`、`new Function`、`child_process`、`readFile`、`path.join`、`storage.from`。

`eval(`、`new Function`、`child_process` 无命中。`innerHTML` 无命中。`dangerouslySetInnerHTML` 仅一处，见下文注入节。

## 注入

### INJ-001

- 编号：INJ-001
- 严重程度：中
- 状态：已确认
- 路径：`src/lib/validation/schemas.ts`、`src/app/api/patterns/route.ts`、`src/lib/patternMedia.ts`、`src/app/(main)/page.tsx`、`src/app/(main)/gallery/[id]/page.tsx`、`src/app/(main)/profile/page.tsx`；同类拼接还出现在 `src/components/pattern/PatternHeroImage.tsx`、`src/components/gallery/GalleryClient.tsx`、`src/components/home/FeaturedPatterns.tsx`、`src/components/admin/ModerationList.tsx`、`src/components/map/PatternThumb.tsx`
- 符号：`CreatePatternBody`、`POST`、`resolveFeaturedFrameImageUrl`、`PatternDetailPage`、`ProfilePage`、`PatternHeroImage`、`GalleryClient`、`FeaturedPatterns`、`ModerationList`、`PatternThumb`
- 行号：`schemas.ts` 26；`route.ts` 53–57；`patternMedia.ts` 11–14；`page.tsx` 24、40；`gallery/[id]/page.tsx` 207；`profile/page.tsx` 94；`PatternHeroImage.tsx` 27；`GalleryClient.tsx` 148；`FeaturedPatterns.tsx` 51；`ModerationList.tsx` 41；`PatternThumb.tsx` 13
- 触发条件：已登录用户调用 `POST /api/patterns`。`CreatePatternBody.imageUrl` 使用 `z.string().url()`。当前安装的 Zod 3.23 只要 URL 解析器接受就通过，不限制协议，也不剔除 CSS 声明里有意义的标点。通过后，`route.ts` 把该字符串原样写入 `hp_pattern_media.url`。画廊、首页、个人页和管理列表再用模板字符串拼进 `style.backgroundImage` 的 `url("…")`。
- 影响：用当前安装的 `react-dom` 做服务端静态渲染可以确认，尖括号会被转义，不能借此插入 HTML 标签；但属性值在 HTML 解码后仍会被当成多条 CSS 声明。`src/lib/security/csp.ts` 的 `style-src` 含 `'unsafe-inline'`，这些声明不会被 CSP 丢掉。不需要再发网络请求就能改定位和层叠，从而改变页面上已有元素的呈现。没有发现这条地址被放进会执行脚本的容器。`KnowledgeGraph` 用 `setAttribute('href', …)`（`KnowledgeGraph.tsx` 128）写入 SVG `<image>`，该上下文不执行脚本。客户端组件在水合后按单个 CSS 属性写回，额外声明留不住，但水合前的 HTML 里有一段窗口。服务端组件会把属性留在响应里：个人页（上传者自己的记录，含 `pending`）、画廊详情的相关纹样（`getRelatedPatterns` 只返回 `approved` / `featured`，审核通过后其他访问者可见）、首页博物馆框（`resolveFeaturedFrameImageUrl` 原样返回非占位媒体地址；创建接口只写 `pending`，`PATCH /api/patterns/[id]/moderate` 只改为 `approved` 或 `rejected`，普通提交流程不会直接把地址送上首页，除非该行已经是 `featured`）。
- 修复方向：把 `imageUrl` 限制为本应用上传接口返回的、属于本项目存储主机的 https 地址。服务端渲染不要把该字符串拼接进 CSS `url()`；用 `img` 或 `next/image`，把地址作为 URL 属性传入。若仍要做背景图，先拒绝 CSS 声明分隔符，或对整个值做 CSS 字符串编码，使它只占据一个声明的值。

### 已检查且无问题

SQL / PostgREST：无。

- `src/lib/queries.ts` 的 `getPatterns`（66–79）对 `era`、`region` 使用 `.eq()`，列名固定；`sort` 只在 `oldest` / `popular` / `likes` 三个分支里选择固定列，其余落到 `created_at`。`q` 在 72 行去掉 `% _ , ( ) * \` 后再拼进 `.or()`。`.or()` 的额外条件靠逗号和括号分隔，这几类字符已被去掉，用户片段落在 `ilike` 的值位置，不能改列名或运算符。`getPatternById`、`getRelatedPatterns`、`getFeaturedPatterns`、`getStats` 的 `.select()` / `.eq()` / `.in()` 均为常量。
- `src/app/api/**` 的写入与过滤都走 supabase-js 的 `.eq()` / `.insert()` / `.update()`，值作为过滤器参数，不拼接 SQL。`src/app/api/patterns/[id]/like/route.ts` 46 行 `rpc('hp_toggle_like', { p_pattern_id: id })` 的 `id` 先经过 `PatternIdParam`（UUID）。
- `supabase/migrations/0003_hp_toggle_like.sql` 的 `hp_toggle_like` 使用 PL/pgSQL 绑定参数，无动态 SQL。`0002_rls_policies.sql` 107–133 行的 `EXECUTE format` 只引用迁移里写死的表名，且用 `%I` 引用标识符。`scripts/check-db-security.ts` 31–56 行的 SQL 是常量。
- `src/app/(main)/gallery/page.tsx` 19–23 行把页面查询参数直接交给 `getPatterns`，未再走 `ListPatternsQuery`，但 `sort` 与 `q` 仍受上面的分支和剥离约束，`era` 仍走 `.eq()`。

命令注入：无。全库无 `child_process`、`exec`、`spawn`。`scripts/build-hubei-*.mjs`、`scripts/build-neighbor-provinces.mjs` 的远程地址是常量。

模板注入：无。`src/lib/theme.ts` 的 `createThemeScript`（35–51）只嵌入常量 `STORAGE_KEY`，由 `src/app/layout.tsx` 68 行 `dangerouslySetInnerHTML` 输出。`src/lib/patternPlaceholder.ts` 与 `scripts/seed.ts` 在拼 SVG 前对文本做了 XML 转义。`src/lib/workshop/exportUtils.ts` 102–109 行的 SVG 包住的是画布自己的 `toDataURL` 结果，不是请求参数。

其他 HTML 输出：无。评论、纹样名称、描述、昵称均在 React 文本节点中渲染（如 `src/components/pattern/CommentSection.tsx` 106）。`src/lib/image-placeholder.ts` 的 `generateBlurDataURL` 未转义颜色字符串，但应用接口没有写入 `color_palette` 的路径，调用点把它当作 `next/image` 的模糊占位图，不进入 HTML 解析。

## 反序列化

无。

- `src/components/map/utils/mapDemoUtils.ts` 73–86 行 `parseStoredState` 先 `JSON.parse`，再用 Zod 校验 `bindings` 与 `drafts`；失败则丢弃。`imageDataUrl` 仍是任意字符串，只在 `src/components/map/DraftForm.tsx` 32 行作为 `<img src>`。该状态来自本源 `localStorage`（`src/components/map/HubeiMapClient.tsx` 72、81），不进入服务端，也不进入会执行脚本的容器。
- `src/hooks/useCanvasHistory.ts` 102–111 行把 `hbpattern-workshop-draft` 按 `WorkshopDraft` 断言后恢复图层，没有 schema。恢复结果只进当前浏览器的工坊状态。`src/lib/workshop/canvasEngine.ts` 129–132 行会 `fetch` 图层里的 `sourceImageUrl`，但生产 CSP 的 `connect-src`（`src/lib/security/csp.ts` 41–48）不包含任意主机；`normalizeBlendMode`（`src/lib/workshop/layerCompositor.ts` 18–19）会把未知混合模式降为 `source-over`。解析失败会删掉该键。没有跨用户或脚本执行路径。
- `src/lib/createStorage.ts` 6–15 行 `getSavedCreations` 同样把 `JSON.parse` 断言为 `CreationSnapshot[]`。读出来的值只用于写回本源 `localStorage`（32、38 行），没有渲染或请求出口。
- `src/lib/theme.ts` 16–20 行只接受 `light` / `dark` / `system`。
- `scripts/seed.ts` 56 行和 `src/__tests__/research-data-flow.test.ts` 21 行解析的是仓库内或测试目录中的本地 JSON，不是请求体。
- `JSON.parse` 不会把 `__proto__` 装进 `Object.prototype`。全库无 `eval(`、`new Function`。

## 路径与文件

无。

- `src/app/api/upload/route.ts` 25–34 行的对象键是 `用户 id`、时间戳和扩展名。扩展名来自 `extractExt`（`src/lib/upload/config.ts` 19–23），并且必须属于 `jpg` / `jpeg` / `png` / `webp`（48–52 行）。原始文件名不进入键。`contentType` 使用已通过白名单的 `file.type`。没有按用户路径读磁盘的接口。
- `scripts/import-ai-patterns.ts` 77–81 行、`scripts/upload-seed-images.ts` 40–43 行用 `path.join` 连接的是环境变量指定的目录和 `readdir` 返回的单个文件名。这是操作者本地脚本，文件名来自目录枚举，不是 HTTP 参数。`scripts/import-wikimedia.ts` 的存储键来自脚本内的常量 `filename`。
- `scripts/generate-pwa-icons.mjs` 7–12 行、`scripts/lint-guards.mjs` 的 `collectFiles`、`scripts/build-hubei-boundaries.mjs`、`scripts/build-hubei-geojson.mjs`、`scripts/build-neighbor-provinces.mjs` 读写的都是相对仓库的固定路径。`src/__tests__/research-data-flow.test.ts` 与 `src/app/(main)/gallery/[id]/__tests__/page.property1.test.tsx` 读的是固定测试文件。
- `storage.from` 的桶名是常量 `pattern-images`（上传路由与上述导入脚本）。没有 `createSignedUrl` 或把用户输入拼进存储前缀的下载接口。
