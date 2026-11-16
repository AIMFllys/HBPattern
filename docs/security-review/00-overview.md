# 安全审查总览（2026-11-16）

审查对象是更新后的整个仓库，不是本次 diff。四份分项记录只新增在 `docs/security-review/`，没有改业务代码，没有改 `docs/standard/04-security.md`。

**本次没有实施安全修复。** 下面的优先级是后续修复顺序，不是已完成的加固。

## 矩阵

| 类别 | 记录 | 已确认 | 疑似 | 最高 |
|------|------|--------|------|------|
| 认证与会话 | `01-auth-and-access.md` | AUTH-001、AUTH-002、AUTH-003 | AUTH-004 | 中 |
| 授权与越权 | `01-auth-and-access.md` | AUTHZ-001 至 AUTHZ-007 | AUTHZ-008 | 高 |
| 注入 | `02-injection-and-files.md` | INJ-001 | 无 | 中 |
| 反序列化 | `02-injection-and-files.md` | 无。查过地图草稿、工坊草稿、创作存档和主题值的 `JSON.parse` | 无 | — |
| 路径与文件 | `02-injection-and-files.md` | 无。上传键是用户 id 加时间戳和白名单扩展名 | 无 | — |
| 敏感数据与秘密 | `03-secrets-supply-config.md` | DATA-001 | 无。源码和文档里的密钥形态是占位符 | 低 |
| 依赖与供应链 | `03-secrets-supply-config.md` | SUP-001 至 SUP-037，来自 `npm audit --json` | 无。输出里没有的 CVE 没有编 | 高 |
| 配置与默认凭据 | `03-secrets-supply-config.md` | CFG-001 | 无 | 中 |
| SSRF 与出站请求 | `04-outbound-crypto-log-upload.md` | SSRF-001 | 无。写死的地图瓦片不记为 SSRF | 低 |
| 加密与随机数 | `04-outbound-crypto-log-upload.md` | CRYPTO-001、CRYPTO-002 | 无 | 低 |
| 日志与信息泄露 | `04-outbound-crypto-log-upload.md` | LOG-001、LOG-002 | 无 | 低 |
| 上传与输入校验 | `04-outbound-crypto-log-upload.md` | UPLOAD-001 至 UPLOAD-004 | 无 | 中 |

## 修复优先级

只列已确认项。疑似项先核实，不排进这一轮。

1. **授权，高。** AUTHZ-001：已登录用户可以改自己的 `hp_users.role`。AUTHZ-002：上传者可以自行把纹样写成已公开或精选，并改计数。AUTHZ-003：持有匿名密钥即可读取 `hp_users` 整行，包括邮箱和角色。AUTHZ-004：未公开纹样的媒体地址可以被列出。这四条都在 `supabase/migrations/0002_rls_policies.sql`，应用层的 `requireRole` 挡不住直接写表。
2. **授权，中。** AUTHZ-005：`hp_toggle_like` 不检查纹样是否公开。AUTHZ-006：评论的读写不跟纹样可见性绑定。
3. **认证，中。** AUTH-001：已登录用户访问登录页时，`next` 里的反斜杠能通过 `resolveSafeNextPath`，`new URL` 会把它解析到别的主机。
4. **上传与注入，中。** UPLOAD-002 与 INJ-001 是同一条输入：`imageUrl` 只要求能被当成 URL，再进入公开可读的媒体表，并被拼进 CSS `url()`。UPLOAD-001：上传只校验声明的大小、MIME 和扩展名。UPLOAD-004：生产环境默认不执行应用内上传配额。
5. **配置，中。** CFG-001：`scripts/check-db-security.ts` 在带数据库口令的连接上关闭了 TLS 证书校验。
6. **供应链，高（audit 用语为 critical 的记为高）。** 先处理直接依赖：SUP-001 `maplibre-gl`、SUP-002 `next`、SUP-003 `zod`。SUP-004、SUP-011、SUP-014 等 prisma / mysql2 / hono 来自 lockfile 里仍在、`package.json` 已不再声明的依赖树，先对齐 lockfile，再看还剩哪些公告。开发依赖（vitest、eslint、vite）靠后。编号和 GHSA 以 `03-secrets-supply-config.md` 为准，这里不重复 37 条。
7. **低。** AUTH-002 会话 cookie 沿用库默认。AUTH-003 Service Worker 缓存带身份的响应。AUTHZ-007 `hp_user_badges` 没有启用行级访问控制。DATA-001 `resolveApiCaller` 尚未被路由调用，却按原文比较 `key_hash`。SSRF-001 只发生在 `next/image` 的主机白名单内。CRYPTO-001、CRYPTO-002 的 `Math.random` 只用于本地 id。LOG-001、LOG-002 把未知异常的堆栈写进服务端日志。UPLOAD-003 在读入整份表单之后才判断大小，空文件可以通过。

## 疑似，先核实

- AUTH-004：登录失败文案是否会区分账号，取决于供应商配置，仓库里看不全。
- AUTHZ-008：仓库没有 `pattern-images` 的 `storage.objects` 策略，用户前缀是否在库上生效还要连到存储配置核对。

## 声明

本次审查没有修改业务代码，没有收紧策略，没有升级依赖，没有改默认配置。修复不在本分支的提交范围内。
