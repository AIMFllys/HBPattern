# 敏感数据与秘密、依赖与供应链、配置与默认凭据

审查范围是当前工作区整棵树，不是某一次 diff。命令：`npm audit --json`（未执行 `npm audit fix`）。退出码 `1`。npm 在存在漏洞时用这个退出码，JSON 已完整写出，命令本身没有失败。`auditReportVersion` 为 `2`。`metadata.vulnerabilities` 为 info 0、low 2、moderate 16、high 17、critical 2，合计 37 个包。`metadata.dependencies.total` 为 765。

下面的严重程度用高/中/低。audit 原文的 critical 与 high 都记为高，并在括号里保留 audit 用词。advisory 编号取自输出里的 GitHub Advisory URL（`GHSA-...`）和 `source` 整数。CVE 只在输出文本里真实出现时列出。没有 CVE 的条目写「无」。不收录利用步骤、请求样例或标题中的攻击描述。

`package.json` 与 `package-lock.json` 根节点的依赖集合不一致，这次没有改任何一边。`package.json` 的 `dependencies` 没有 `@prisma/adapter-pg`、`@prisma/client`、`pg`；lockfile 根 `dependencies`（约第 10–24 行）仍有这三项。`package.json` 的 `devDependencies` 有 `pg`（第 50 行），没有 `prisma`；lockfile 根 `devDependencies` 第 47 行仍有 `prisma`。`src/` 没有引用 `@prisma` 或 `pg`。本次 audit 仍按现有 lockfile 计算，因此 prisma、mysql2、hono 等条目来自 lockfile 里仍在的依赖树。本次没有跑 `npm ci`，不写它的退出码。

lockfile 里抽查到的 `resolved` 都指向 `https://registry.npmjs.org`。没有 git 或明文 http 包地址。`.github/workflows/ci.yml` 使用 `actions/checkout@v4`、`actions/setup-node@v4`、`gitleaks/gitleaks-action@v2` 的主版本标签。npm audit 不覆盖 GitHub Actions，这里不另编号。

## 敏感数据与秘密

### DATA-001 开放 API 密钥按原文与 key_hash 等值比较

- 编号：DATA-001
- 严重程度：低
- 状态：已确认
- 路径：`src/lib/api/apiKey.ts`
- 符号：`resolveApiCaller`
- 行号：17–27
- 触发条件：有代码调用 `resolveApiCaller`，并且请求带 `x-api-key`。当前仓库没有路由调用它。`hp_api_keys` 在 `supabase/migrations/0002_rls_policies.sql` 第 126–132 行只启用了 RLS，没有策略，默认拒绝 anon 与 authenticated。
- 影响：请求头里的原文被直接拿去和 `key_hash` 列比较（第 25 行），调用前没有哈希。列名表示应存放哈希。若列里是哈希，原文比对不会对应到哈希；若列里是原文，则名为 hash 的列保存的是密钥本身。表结构在 `supabase/migrations/0000_init.sql` 第 245–255 行，`key_hash` 为 `TEXT NOT NULL UNIQUE`，迁移里没有哈希函数。
- 修复方向：写入前只保存单向哈希；校验时对请求头做同一种哈希再查询。接入任何路由之前补上表策略。日志里不要记录请求头原文。

### 已检查，无

仓库里没有提交 `.env`、`.env.local` 或 `*.pem`。`.gitignore` 第 25 行忽略 `*.pem`，第 32 行忽略 `*.log`，第 35 行忽略 `.env*`。

下列位置里的密钥形态是占位符，不记为已泄露秘密：

- `README.md` 第 107–112 行：`your-supabase-url`、`your-supabase-anon-key`、`postgresql://user:password@host:5432/hbpattern`
- `docs/deploy-edgeone.md` 第 40–42 行：说明 `SUPABASE_SERVICE_ROLE_KEY` 不要配到 EdgeOne，并允许用 `postgresql://placeholder` 这种占位串通过构建
- `docs/deploy-baota.md` 第 58–60 行：`你的-anon-key`、`你的-数据库连接串`
- `docs/plans/ai-backend-strategy/deployment-runbook.md` 第 62–84 行：`eyJhbGciOi...`、`postgres:xxx`、`sk-xxx`、`<生成一个 256-bit 随机十六进制字符串>`
- `docs/plans/MVP/phase-1-data-flow.md` 第 76–78 行：`[password]`、`[project-ref]`、`[region]`
- `src/__tests__/proxy.test.ts` 第 49–50 行：`https://example.supabase.co`、`test-anon-key`

`rg` 未在源码、脚本、SQL、工作流中找到 `sk_live`、`service_role` 私钥材料、AWS 样式访问密钥，或一整段 JWT。`package-lock.json` 里的 `sha512-` integrity 不是密钥。

service role 只出现在脚本的环境变量读取里，没有写进字面量，也没有出现在 `src/`：

- `scripts/seed.ts` 第 44–49、66–69 行：`SUPABASE_SERVICE_ROLE_KEY`，以及 URL 匹配时的 `SUPABASE_SERVICE_ROLE_KEY_A` / `_B`；都缺失时落到 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `scripts/import-ai-patterns.ts` 第 12–13 行、`scripts/import-wikimedia.ts` 第 12–13 行、`scripts/upload-seed-images.ts` 第 12–13 行：同样先读 service role，缺失则用 anon key
- `src/lib/supabase/client.ts` 第 5–6 行、`src/lib/supabase/server.ts` 第 7–8 行、`src/proxy.ts` 第 63–65 行、`src/app/auth/callback/route.ts` 第 15–16 行：只用 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

anon key 按设计会进入浏览器。service role 没有 `NEXT_PUBLIC_` 前缀，当前前端包不会把它打进去。脚本在缺少 service role 时改用 anon key，这是权限下降，不是把 service role 写进客户端。

`scripts/seed.ts` 第 139–144 行写入固定资料行 `system@hbpattern.local`、`role: 'admin'`、UUID `00000000-0000-0000-0009-000000000001`。没有口令字段，不能当作可登录的默认凭据。

日志抽查没有把邮箱、口令、token、cookie 或 service role 写进格式串：

- `scripts/check-env.ts` 第 45–46、60、69 行：`mask()` 对长度大于 10 的值只打印前 6 位和后 4 位。标准 `postgresql://` 连接串的口令在中段，anon key 本身是公开值
- `scripts/check-db-security.ts` 第 12、93 行：注释要求不打印秘密；失败时只打印 `e.message`
- `scripts/upload-seed-images.ts` 第 48 行打印的是 `NEXT_PUBLIC_SUPABASE_URL`，不是密钥
- `src/lib/api/withApi.ts` 第 114–116 行：未知异常只记录 `name`、`message`、`stack`
- `src/lib/queries.ts` 第 36 行：只记录 label 与错误 message
- `src/app/(main)/gallery/[id]/page.tsx` 第 60–67 行：记录纹样 id 与错误字符串
- `src/app/error.tsx` 第 16 行：在浏览器控制台打印当前页的 `error` 对象，没有服务端收集用户资料
- `scripts/seed.ts` 第 240 行以及各 import 脚本的 `main().catch(console.error)`：打印的是抛出的 Error；`seed.ts` 第 126、134 行抛出的文本只有表名和 Supabase 的 `error.message` 或 `code`

`hp_users` 的 `SELECT` 策略是 `USING (true)`（`supabase/migrations/0002_rls_policies.sql` 第 35–36 行），表上有 `email`、`role`、`preferences`、`last_login`（`supabase/migrations/0000_init.sql` 第 39–51 行）。这是行级访问控制，不是源码里的密钥，也不是日志落点，本文件不编号。

## 依赖与供应链

37 条按包聚合。同一包的多个 advisory 放在同一条里。只经由别的包被点名、自己没有 advisory URL 的，advisory 写「无」。

### SUP-001 maplibre-gl

- 编号：SUP-001
- 严重程度：高（audit: critical）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 7937 行 `node_modules/maplibre-gl`；`package.json` 第 25 行 `dependencies`。lockfile 版本 `5.24.0`，落在 range `<=6.4.0` 内
- 符号：`maplibre-gl`（直接依赖）
- 行号：`package-lock.json:7937`
- 触发条件：安装树里该包的版本落在 audit range `<=6.4.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-jrc7-96c5-q579
- npm source：1193680
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 指向 `maplibre-gl@6.18.0`，isSemVerMajor 为 true。按这个目标处理，不要另写一个版本。

### SUP-002 next

- 编号：SUP-002
- 严重程度：高（audit: critical）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 8204 行 `node_modules/next`；`package.json` 第 27 行 `dependencies`。lockfile 版本 `16.2.1`，落在 range `9.3.4-canary.0 - 16.4.0` 内
- 符号：`next`（直接依赖）
- 行号：`package-lock.json:8204`
- 触发条件：安装树里该包的版本落在 audit range `9.3.4-canary.0 - 16.4.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-q4gf-8mx6-v5v3、GHSA-8h8q-6873-q5fj、GHSA-3g8h-86w9-wvmq、GHSA-ffhc-5mcf-pf4q、GHSA-vfv6-92ff-j949、GHSA-gx5p-jg67-6x7h、GHSA-mg66-mrh9-m8jx、GHSA-h64f-5h5j-jqjh、GHSA-c4j6-fc7j-m34r、GHSA-492v-c6pp-mqqv、GHSA-wfc6-r584-vfw7、GHSA-267c-6grr-h53f、GHSA-36qx-fr4f-26g5、GHSA-6gpp-xcg3-4w24、GHSA-m99w-x7hq-7vfj、GHSA-89xv-2m56-2m9x、GHSA-68g3-v927-f742、GHSA-4633-3j49-mh5q、GHSA-4c39-4ccg-62r3、GHSA-p9j2-gv94-2wf4、GHSA-q8wf-6r8g-63ch、GHSA-955p-x3mx-jcvp、GHSA-p293-qw3h-jr36、GHSA-2xp9-vwfh-vxw4、GHSA-vcvr-r3jv-pc5j、GHSA-4jqv-mc3x-m676、GHSA-39w2-rjm5-chcv、GHSA-f87g-xv8r-7p7x、GHSA-mcj8-r9mp-w47p、GHSA-cjq9-62q9-8jv4、GHSA-2464-fhr4-w9xw、GHSA-p3m5-59mp-jv5r、GHSA-673q-mjm6-r5xr、GHSA-26hh-7cqf-hhc6
- npm source：1116375、1117930、1118941、1118943、1118945、1118947、1118949、1118951、1118953、1118955、1118957、1118959、1118961、1124170、1124171、1124184、1124186、1124188、1124190、1124192、1124194、1124196、1193676、1193732、1240609、1241490、1241492、1241493、1241495、1241496、1242816、1242818、1242859、1244535
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：postcss、sharp
- 修复方向：audit 的 fixAvailable 指向 `next@16.4.6`，isSemVerMajor 为 false。按这个目标处理，不要另写一个版本。

### SUP-003 zod

- 编号：SUP-003
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 11001 行 `node_modules/zod`；`package.json` 第 31 行 `dependencies`。lockfile 版本 `3.25.76`，落在 range `<4.6.6` 内
- 符号：`zod`（直接依赖）
- 行号：`package-lock.json:11001`
- 触发条件：安装树里该包的版本落在 audit range `<4.6.6` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-mrhx-c7xc-m3w5
- npm source：1243066
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 指向 `zod@4.6.7`，isSemVerMajor 为 true。按这个目标处理，不要另写一个版本。

### SUP-004 @prisma/config

- 编号：SUP-004
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 2190 行 `node_modules/@prisma/config`。audit range：`6.13.0-dev.1 - 7.10.0 || 8.1.0-dev.1 - 8.1.0-dev.4`
- 符号：`@prisma/config`（传递依赖）
- 行号：`package-lock.json:2190`
- 触发条件：安装树里该包的版本落在 audit range `6.13.0-dev.1 - 7.10.0 || 8.1.0-dev.1 - 8.1.0-dev.4` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：deepmerge-ts
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-005 brace-expansion

- 编号：SUP-005
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 4681 行 `node_modules/brace-expansion`。audit range：`<=1.1.20 || 3.0.0 - 5.0.11`
- 符号：`brace-expansion`（传递依赖）
- 行号：`package-lock.json:4681`
- 触发条件：安装树里该包的版本落在 audit range `<=1.1.20 || 3.0.0 - 5.0.11` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-jxxr-4gwj-5jf2、GHSA-3jxr-9vmj-r5cp、GHSA-mh99-v99m-4gvg、GHSA-rgw5-rvv9-x895、GHSA-q2hr-2g5m-vwhr、GHSA-qhr7-859c-m2p7、GHSA-6j4f-fj2g-mc7p
- npm source：1120311、1123897、1123898、1130588、1130591、1130734、1130737、1240100、1240103、1240104、1240107、1240108、1240111
- CVE：CVE-2026-14257（只出现在 title 文本中，没有单独的 cve 字段）
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-006 browserslist

- 编号：SUP-006
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 4705 行 `node_modules/browserslist`。audit range：`<=4.28.6`
- 符号：`browserslist`（传递依赖）
- 行号：`package-lock.json:4705`
- 触发条件：安装树里该包的版本落在 audit range `<=4.28.6` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-c83g-rgw3-j3cx、GHSA-73wf-gq98-2v4g
- npm source：1153171、1153172
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-007 deepmerge-ts

- 编号：SUP-007
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 5217 行 `node_modules/deepmerge-ts`。audit range：`<8.0.0`
- 符号：`deepmerge-ts`（传递依赖）
- 行号：`package-lock.json:5217`
- 触发条件：安装树里该包的版本落在 audit range `<8.0.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-ggr8-5vv4-36mx
- npm source：1145093
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-008 fast-uri

- 编号：SUP-008
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 6209 行 `node_modules/fast-uri`。audit range：`3.0.0 - 3.1.8`
- 符号：`fast-uri`（传递依赖）
- 行号：`package-lock.json:6209`
- 触发条件：安装树里该包的版本落在 audit range `3.0.0 - 3.1.8` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-v2hh-gcrm-f6hx、GHSA-7p8r-x3mc-p8w7、GHSA-q3j6-qgpj-74h6、GHSA-v39h-62p7-jpjc、GHSA-f65p-4m7j-42xc、GHSA-jqff-g426-hqxp、GHSA-4c8g-83qw-93j6、GHSA-qw65-cvwx-89v3、GHSA-hrr3-gc8f-f4qj、GHSA-w74x-v6f9-j3xg、GHSA-xhq7-xmqj-769h、GHSA-333x-w4r6-6crp
- npm source：1124064、1130720、1145559、1153168、1158524、1158530、1204921、1239943、1240091、1243098、1243101、1243107
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-009 hono

- 编号：SUP-009
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 6745 行 `node_modules/hono`。audit range：`<=4.13.15`
- 符号：`hono`（传递依赖）
- 行号：`package-lock.json:6745`
- 触发条件：安装树里该包的版本落在 audit range `<=4.13.15` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-qp7p-654g-cw7p、GHSA-hm8q-7f3q-5f36、GHSA-p77w-8qqv-26rm、GHSA-9vqf-7f2p-gf9v、GHSA-69xw-7hcm-h432、GHSA-xrhx-7g5j-rcj5、GHSA-3hrh-pfw6-9m5x、GHSA-f577-qrjj-4474、GHSA-2gcr-mfcq-wcc3、GHSA-rv63-4mwf-qqc2、GHSA-wgpf-jwqj-8h8p、GHSA-88fw-hqm2-52qc、GHSA-wwfh-h76j-fc44、GHSA-j6c9-x7qj-28xf、GHSA-xgm2-5f3f-mvvc、GHSA-hvrm-45r6-mjfj、GHSA-w62v-xxxg-mg59、GHSA-8j4g-w8fx-2239、GHSA-f23p-vx2j-j53r、GHSA-79qm-7rj5-m7r9、GHSA-54fx-42gc-7vw4、GHSA-gqvv-2mrq-wpjv、GHSA-g6gw-c38x-mqfc、GHSA-crvj-82cr-hjcx、GHSA-hxh3-vqpv-xpqv、GHSA-5r4p-p66f-jhc7、GHSA-4m76-xfj5-7975、GHSA-h7mg-cq63-vhpq、GHSA-3gg2-335m-rxc6、GHSA-46wx-v44x-9hh2、GHSA-4h7h-rv7c-7m2v
- npm source：1117915、1118963、1118964、1118982、1118983、1120082、1120083、1120084、1120085、1123997、1123998、1123999、1124000、1124001、1124005、1124009、1124010、1130733、1138771、1138772、1138773、1193729、1193730、1193731、1240640、1242595、1246368、1246369、1246370、1246373、1246374
- CVE：CVE-2026-39408（只出现在 title 文本中，没有单独的 cve 字段）
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-010 js-yaml

- 编号：SUP-010
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 7384 行 `node_modules/js-yaml`。audit range：`4.0.0 - 4.3.1`
- 符号：`js-yaml`（传递依赖）
- 行号：`package-lock.json:7384`
- 触发条件：安装树里该包的版本落在 audit range `4.0.0 - 4.3.1` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-h67p-54hq-rp68、GHSA-52cp-r559-cp3m、GHSA-5p4m-2wfm-xmqj、GHSA-2883-xcg3-v3hh
- npm source：1121860、1123911、1138115、1193727
- CVE：CVE-2026-59870（只出现在 title 文本中，没有单独的 cve 字段）
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-011 mysql2

- 编号：SUP-011
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 8129 行 `node_modules/mysql2`。audit range：`<=3.23.0`
- 符号：`mysql2`（传递依赖）
- 行号：`package-lock.json:8129`
- 触发条件：安装树里该包的版本落在 audit range `<=3.23.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-3f6p-5ww8-9rcr、GHSA-rgwj-5xj2-c3m3
- npm source：1153173、1158532
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-012 nanoid

- 编号：SUP-012
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 8163 行 `node_modules/nanoid`。audit range：`<=3.3.17`
- 符号：`nanoid`（传递依赖）
- 行号：`package-lock.json:8163`
- 触发条件：安装树里该包的版本落在 audit range `<=3.3.17` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-28wg-ghj8-5hjv、GHSA-2v37-7h3g-55p8、GHSA-xwg4-73v4-xw9w
- npm source：1138811、1139427、1153189
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-013 postcss

- 编号：SUP-013
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 8737 行 `node_modules/postcss`。audit range：`<=8.5.22`
- 符号：`postcss`（传递依赖）
- 行号：`package-lock.json:8737`
- 触发条件：安装树里该包的版本落在 audit range `<=8.5.22` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-qx2v-qp2m-jg93、GHSA-6g55-p6wh-862q、GHSA-fxqj-rqcc-2cmp、GHSA-r28c-9q8g-f849。`GHSA-6g55-p6wh-862q` 同时出现在另一条的 title 里，URL 列表已包含它
- npm source：1117015、1124252、1130709、1139510
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 指向 `next@16.4.6`，isSemVerMajor 为 false。按这个目标处理，不要另写一个版本。

### SUP-014 prisma

- 编号：SUP-014
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 8873 行 `node_modules/prisma`。audit range：`6.13.0-dev.1 - 7.10.0 || 8.0.0-rc.3 - 8.1.0-dev.6`
- 符号：`prisma`（audit 的 `isDirect` 为 false。lockfile 根 `devDependencies` 第 47 行仍声明 `prisma`，`package.json` 没有）
- 行号：`package-lock.json:8873`
- 触发条件：安装树里该包的版本落在 audit range `6.13.0-dev.1 - 7.10.0 || 8.0.0-rc.3 - 8.1.0-dev.6` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：@prisma/config、@prisma/dev、mysql2
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-015 sharp

- 编号：SUP-015
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 9431 行 `node_modules/sharp`。audit range：`<=0.35.5-rc.1`
- 符号：`sharp`（传递依赖）
- 行号：`package-lock.json:9431`
- 触发条件：安装树里该包的版本落在 audit range `<=0.35.5-rc.1` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-f88m-g3jw-g9cj、GHSA-rgj7-g3m4-5g8c、GHSA-wq5f-xc86-pv6w。title 字段另出现且 URL 未单列：GHSA-g89c-p67h-r497、GHSA-2jg2-4ch7-h545
- npm source：1124066、1193725、1241331
- CVE：CVE-2026-33327、CVE-2026-33328、CVE-2026-35590、CVE-2026-35591、CVE-2026-96889（只出现在 title 文本中，没有单独的 cve 字段）
- via：无
- 修复方向：audit 的 fixAvailable 指向 `next@16.4.6`，isSemVerMajor 为 false。按这个目标处理，不要另写一个版本。

### SUP-016 source-map-js

- 编号：SUP-016
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 9621 行 `node_modules/source-map-js`。audit range：`1.0.0 - 1.2.1`
- 符号：`source-map-js`（传递依赖）
- 行号：`package-lock.json:9621`
- 触发条件：安装树里该包的版本落在 audit range `1.0.0 - 1.2.1` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-68fv-2mgg-jv7q
- npm source：1241209
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-017 undici

- 编号：SUP-017
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 10407 行 `node_modules/undici`。audit range：`7.0.0 - 7.30.0`
- 符号：`undici`（传递依赖）
- 行号：`package-lock.json:10407`
- 触发条件：安装树里该包的版本落在 audit range `7.0.0 - 7.30.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-vmh5-mc38-953g、GHSA-p88m-4jfj-68fv、GHSA-hm92-r4w5-c3mj、GHSA-g8m3-5g58-fq7m、GHSA-pr7r-676h-xcf6、GHSA-8xcm-r25x-g524、GHSA-4cwx-7wf7-3272、GHSA-m8rv-5g2x-5cg5、GHSA-jr45-8vmc-qm54、GHSA-v3r7-h72x-cjcm、GHSA-35p6-xmwp-9g52、GHSA-pmjh-fq2x-6v4x、GHSA-r53p-7pc4-xj5r、GHSA-rfgv-xxqx-mfg5、GHSA-3xpg-4rpp-hhhm、GHSA-2jfj-6hjv-fm6j、GHSA-2gqq-gqf2-x968、GHSA-w293-vg96-wgc3、GHSA-8436-99hf-9mmv、GHSA-rx4f-c7p8-82vq、GHSA-4qv8-2p9j-2685、GHSA-f72v-6w45-q472、GHSA-xjj6-f33q-929c、GHSA-4w7w-5xrc-9h26、GHSA-2m5v-pch6-74hx、GHSA-qrxm-fqhp-jwvm、GHSA-9fm3-97px-rjf6、GHSA-55wc-3pg8-jfw6、GHSA-vxpw-j846-p89q
- npm source：1121187、1121241、1121247、1121254、1121428、1130715、1130718、1130726、1130729、1130731、1137242、1240036、1240038、1240041、1240044、1240046、1240048、1240050、1240052、1240055、1243078、1243081、1243113、1243473、1243475、1243478、1243481、1243484、1244533
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-018 vite

- 编号：SUP-018
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 10532 行 `node_modules/vite`。audit range：`8.0.0 - 8.1.5`
- 符号：`vite`（传递依赖）
- 行号：`package-lock.json:10532`
- 触发条件：安装树里该包的版本落在 audit range `8.0.0 - 8.1.5` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-v6wh-96g9-6wx3、GHSA-698v-4r3x-3vcv、GHSA-r825-w8mm-5pxw、GHSA-587h-7wmj-h5pm、GHSA-9jrq-w75r-8gcw、GHSA-rq7h-c2jc-7f22、GHSA-fx2h-pf6j-xcff
- npm source：1120786、1242624、1242653、1242660、1242726、1242732、1243434
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-019 ws

- 编号：SUP-019
- 严重程度：高（audit: high）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 10923 行 `node_modules/ws`。audit range：`8.0.0 - 8.20.1`
- 符号：`ws`（传递依赖）
- 行号：`package-lock.json:10923`
- 触发条件：安装树里该包的版本落在 audit range `8.0.0 - 8.20.1` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-58qx-3vcg-4xpx、GHSA-96hv-2xvq-fx4p
- npm source：1119108、1123259
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-020 @vitest/ui

- 编号：SUP-020
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 4266 行 `node_modules/@vitest/ui`；`package.json` 第 45 行 `devDependencies`。audit range：`2.1.0-beta.1 - 4.1.10`
- 符号：`@vitest/ui`（直接依赖）
- 行号：`package-lock.json:4266`
- 触发条件：安装树里该包的版本落在 audit range `2.1.0-beta.1 - 4.1.10` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：vitest
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-021 eslint-config-next

- 编号：SUP-021
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 5762 行 `node_modules/eslint-config-next`；`package.json` 第 47 行 `devDependencies`。audit range：`>=15.6.0-canary.0`
- 符号：`eslint-config-next`（直接依赖）
- 行号：`package-lock.json:5762`
- 触发条件：安装树里该包的版本落在 audit range `>=15.6.0-canary.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：typescript-eslint
- 修复方向：audit 的 fixAvailable 指向 `eslint-config-next@15.5.29`，isSemVerMajor 为 true。按这个目标处理，不要另写一个版本。

### SUP-022 vitest

- 编号：SUP-022
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 10623 行 `node_modules/vitest`；`package.json` 第 54 行 `devDependencies`。audit range：`2.1.0-beta.1 - 4.1.10`
- 符号：`vitest`（直接依赖）
- 行号：`package-lock.json:10623`
- 触发条件：安装树里该包的版本落在 audit range `2.1.0-beta.1 - 4.1.10` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-82fw-gwwq-j7x9
- npm source：1193683
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：@vitest/mocker、@vitest/ui
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-023 @hono/node-server

- 编号：SUP-023
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 1194 行 `node_modules/@hono/node-server`。audit range：`<=2.1.2`
- 符号：`@hono/node-server`（传递依赖）
- 行号：`package-lock.json:1194`
- 触发条件：安装树里该包的版本落在 audit range `<=2.1.2` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-92pp-h63x-v22m、GHSA-frvp-7c67-39w9、GHSA-rmxm-3fg6-px4f、GHSA-jpvv-r467-5p4w
- npm source：1116281、1139322、1243661、1246357
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-024 @prisma/dev

- 编号：SUP-024
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 2209 行 `node_modules/@prisma/dev`。audit range：`<=0.24.16`
- 符号：`@prisma/dev`（传递依赖）
- 行号：`package-lock.json:2209`
- 触发条件：安装树里该包的版本落在 audit range `<=0.24.16` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：@hono/node-server、valibot
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-025 @typescript-eslint/eslint-plugin

- 编号：SUP-025
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 3586 行 `node_modules/@typescript-eslint/eslint-plugin`。audit range：`6.16.0 - 8.72.2`
- 符号：`@typescript-eslint/eslint-plugin`（传递依赖）
- 行号：`package-lock.json:3586`
- 触发条件：安装树里该包的版本落在 audit range `6.16.0 - 8.72.2` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：@typescript-eslint/parser、@typescript-eslint/type-utils、@typescript-eslint/utils
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-026 @typescript-eslint/parser

- 编号：SUP-026
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 3625 行 `node_modules/@typescript-eslint/parser`。audit range：`6.16.0 - 8.72.2`
- 符号：`@typescript-eslint/parser`（传递依赖）
- 行号：`package-lock.json:3625`
- 触发条件：安装树里该包的版本落在 audit range `6.16.0 - 8.72.2` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：@typescript-eslint/typescript-estree
- 修复方向：audit 的 fixAvailable 指向 `eslint-config-next@15.5.29`，isSemVerMajor 为 true。按这个目标处理，不要另写一个版本。

### SUP-027 @typescript-eslint/type-utils

- 编号：SUP-027
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 3707 行 `node_modules/@typescript-eslint/type-utils`。audit range：`6.16.0 - 8.72.2`
- 符号：`@typescript-eslint/type-utils`（传递依赖）
- 行号：`package-lock.json:3707`
- 触发条件：安装树里该包的版本落在 audit range `6.16.0 - 8.72.2` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：@typescript-eslint/typescript-estree、@typescript-eslint/utils
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-028 @typescript-eslint/typescript-estree

- 编号：SUP-028
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 3746 行 `node_modules/@typescript-eslint/typescript-estree`。audit range：`6.16.0 - 8.72.2`
- 符号：`@typescript-eslint/typescript-estree`（传递依赖）
- 行号：`package-lock.json:3746`
- 触发条件：安装树里该包的版本落在 audit range `6.16.0 - 8.72.2` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：minimatch
- 修复方向：audit 的 fixAvailable 指向 `eslint-config-next@15.5.29`，isSemVerMajor 为 true。按这个目标处理，不要另写一个版本。

### SUP-029 @typescript-eslint/utils

- 编号：SUP-029
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 3826 行 `node_modules/@typescript-eslint/utils`。audit range：`6.16.0 - 8.72.2`
- 符号：`@typescript-eslint/utils`（传递依赖）
- 行号：`package-lock.json:3826`
- 触发条件：安装树里该包的版本落在 audit range `6.16.0 - 8.72.2` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：@typescript-eslint/typescript-estree
- 修复方向：audit 的 fixAvailable 指向 `eslint-config-next@15.5.29`，isSemVerMajor 为 true。按这个目标处理，不要另写一个版本。

### SUP-030 @vitest/mocker

- 编号：SUP-030
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 4186 行 `node_modules/@vitest/mocker`。audit range：`<=4.1.11`
- 符号：`@vitest/mocker`（传递依赖）
- 行号：`package-lock.json:4186`
- 触发条件：安装树里该包的版本落在 audit range `<=4.1.11` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-82fw-gwwq-j7x9、GHSA-qxg6-89mg-rqv8
- npm source：1193684、1242767
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-031 baseline-browser-mapping

- 编号：SUP-031
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 4653 行 `node_modules/baseline-browser-mapping`。audit range：`>=2.0.0 <2.11.0`
- 符号：`baseline-browser-mapping`（传递依赖）
- 行号：`package-lock.json:4653`
- 触发条件：安装树里该包的版本落在 audit range `>=2.0.0 <2.11.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-w5vr-8v7q-w6rv
- npm source：1193686
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-032 fflate

- 编号：SUP-032
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 6236 行 `node_modules/fflate`。audit range：`0.6.0 - 0.6.10 || 0.8.0 - 0.8.2`
- 符号：`fflate`（传递依赖）
- 行号：`package-lock.json:6236`
- 触发条件：安装树里该包的版本落在 audit range `0.6.0 - 0.6.10 || 0.8.0 - 0.8.2` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-px8p-9vwx-vf98
- npm source：1164782、1164784
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-033 minimatch

- 编号：SUP-033
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 8043 行 `node_modules/minimatch`。audit range：`7.0.0 - 11.0.0`
- 符号：`minimatch`（传递依赖）
- 行号：`package-lock.json:8043`
- 触发条件：安装树里该包的版本落在 audit range `7.0.0 - 11.0.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-g3hv-75wg-m249
- npm source：1244623
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 指向 `eslint-config-next@15.5.29`，isSemVerMajor 为 true。按这个目标处理，不要另写一个版本。

### SUP-034 typescript-eslint

- 编号：SUP-034
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 10364 行 `node_modules/typescript-eslint`。audit range：`<=8.72.2`
- 符号：`typescript-eslint`（传递依赖）
- 行号：`package-lock.json:10364`
- 触发条件：安装树里该包的版本落在 audit range `<=8.72.2` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：无。via 只有包名，该条目没有自己的 advisory URL
- npm source：无
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：@typescript-eslint/eslint-plugin、@typescript-eslint/parser、@typescript-eslint/typescript-estree、@typescript-eslint/utils
- 修复方向：audit 的 fixAvailable 指向 `eslint-config-next@15.5.29`，isSemVerMajor 为 true。按这个目标处理，不要另写一个版本。

### SUP-035 valibot

- 编号：SUP-035
- 严重程度：中（audit: moderate）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 10517 行 `node_modules/valibot`。audit range：`<=1.4.1`
- 符号：`valibot`（传递依赖）
- 行号：`package-lock.json:10517`
- 触发条件：安装树里该包的版本落在 audit range `<=1.4.1` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-5qjj-4xww-7phc
- npm source：1124298
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-036 @babel/core

- 编号：SUP-036
- 严重程度：低（audit: low）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 150 行 `node_modules/@babel/core`。audit range：`<=7.29.0`
- 符号：`@babel/core`（传递依赖）
- 行号：`package-lock.json:150`
- 触发条件：安装树里该包的版本落在 audit range `<=7.29.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-4x5r-pxfx-6jf8
- npm source：1123528
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

### SUP-037 esbuild

- 编号：SUP-037
- 严重程度：低（audit: low）
- 状态：已确认（`npm audit --json` 的 `vulnerabilities` 条目）
- 路径：`package-lock.json` 第 5637 行 `node_modules/esbuild`。audit range：`0.27.3 - 0.28.0`
- 符号：`esbuild`（传递依赖）
- 行号：`package-lock.json:5637`
- 触发条件：安装树里该包的版本落在 audit range `0.27.3 - 0.28.0` 内。
- 影响：audit 把该包标进漏洞集合。本文件不描述如何触发。
- advisory：GHSA-g7r4-m6w7-qqqr
- npm source：1120680
- CVE：无。输出没有 CVE 字段，标题里也没有 CVE 编号
- via：无
- 修复方向：audit 的 fixAvailable 为 true，没有给出单一目标版本。按该包自己的公告修复版本处理，不要笼统升到最新。

## 配置与默认凭据

### CFG-001 数据库检查脚本关闭 TLS 证书校验

- 编号：CFG-001
- 严重程度：中
- 状态：已确认
- 路径：`scripts/check-db-security.ts`
- 符号：`new Client`
- 行号：27
- 触发条件：设置了 `DATABASE_URL` 或 `DIRECT_URL`（第 20 行）并执行该脚本。应用运行时不读这两个变量；`scripts/check-env.ts` 第 27–31 行和 `README.md` 第 110 行写明它们只给 prebuild 校验和运维脚本使用。
- 影响：连接使用 `ssl: { rejectUnauthorized: false }`，在发送含数据库口令的连接串时不校验服务器证书。
- 修复方向：校验服务器证书，或只在已确认的网络上运行，并让校验失败时停止连接。不要把连接串打进日志。

### 已检查，无

没有在源码、`edgeone.json`、`next.config.ts` 或工作流里发现写死的默认口令、默认 service role 或默认数据库账号。`edgeone.json` 只有构建命令、输出目录和静态资源缓存头。`next.config.ts` 的 `remotePatterns` 是 `*.supabase.co` 与 `lh3.googleusercontent.com`，没有密钥。

`src/proxy.ts` 与环境变量有关的分支：

- 第 19–21、61 行：`NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 缺一则跳过 Supabase 会话刷新。这是鉴权降级，不是默认凭据，本文件不编号。
- 第 126–130 行：仅当 `NODE_ENV === 'production'` 时设置 `Strict-Transport-Security`。

`src/lib/api/cors.ts` 第 3 行：未设置 `CORS_ALLOWED_ORIGINS` 时允许来源为 `*`。`src/lib/rate-limit.ts` 第 67–84 行：`RATE_LIMIT_DISABLED === '1'` 时关闭限流；生产环境且该值不是 `'0'` 时限流为 no-op。`README.md` 第 115–116、281–285 行与 `docs/deploy-edgeone.md` 第 39 行有同样说明。二者都不是默认口令或秘密处理，本文件不编号。

`.github/workflows/ci.yml` 第 9–10 行权限是 `contents: read`。第 47 行 `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` 是平台令牌引用，不是写进仓库的令牌。质量检查任务没有注入应用密钥。`npm ci` 在第 25 行。

`scripts/check-env.ts` 第 33–38 行把 `DATABASE_URL` 与 `DIRECT_URL` 列为构建必填，但只检查非空。文档里的 `postgresql://placeholder` 是占位符，不是一组能登录的默认凭据。
