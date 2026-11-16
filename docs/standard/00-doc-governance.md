# 00 - 文档治理

一份事实只写一处。

## 权威来源

| 事实 | 唯一位置 |
|------|----------|
| 现行工程规范 | `docs/standard/`。入口是 `docs/standard/README.md` |
| 数据库 schema | `supabase/migrations/`。说明见 `supabase/migrations/README.md` |
| 运行时数据访问 | Supabase 直连 |
| 行为 | 代码 |

仓库没有 Prisma client，没有 `src/lib/db.ts`，没有 `prisma/`。

规范与代码冲突时，在同一改动里改规范或改代码。不要再写第三份说明。

## 名称

| 名称 | 取值 | 用法 |
|------|------|------|
| GitHub 仓库 | `AIMFllys/HBPattern` | 仓库名 |
| npm 包名 | `package.json` 的 `pattern` | 包名。不要把它当仓库名 |
| EdgeOne 项目名 | `edgeone.json` 的 `hbpattern` | EdgeOne 项目名 |

现行路径用仓库根目录。不要用 `HubeiPattern`。不要用 `D:\project\HBPattern\HBPattern`。

## 新文档放哪

新增现行规范：

1. 先把条目登记进 `docs/standard/README.md`。
2. 再建 `docs/standard/NN-主题.md`。

不要新建 `docs/README.md`。

下列路径是历史记录。不得当现行规范引用。

| 路径 | 性质 |
|------|------|
| `docs/plans/` | 历史记录 |
| `docs/summary/` | 历史记录 |
| `docs/workshop-plan/` | 历史记录 |
| `docs/ai-creation-plan/` | 历史记录 |
| `docs/issues/` | 历史记录 |
| `docs/UI设计参考/` | 历史记录 |
| 根目录 `CODE_REVIEW_AND_ARCHITECTURE_PLAN.md` | 历史记录 |
| 根目录中文长文 | 历史记录 |

## 避免多处矛盾

| 主题 | 权威文档 |
|------|----------|
| 目录树 | `01-architecture.md` |
| API 形状 | `02-api-specification.md` |
| 测试与 CI | `05-testing.md` |
| 文件体积 | `06-file-size.md` |
| 死代码 | `07-dead-code.md` |
| 改代码要同步哪份文档 | `08-doc-sync.md` |

`README.md` 只做摘要，并链接到上表。摘要与权威文不一致时，改 README。
