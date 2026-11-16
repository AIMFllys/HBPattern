# 08 - 文档同步

同一改动改了左列，必须在同一改动里改右列。右列没有对应事实要改时，不动那份文档。

| 代码变化 | 必须同步 |
|----------|----------|
| 路由或顶层目录变化 | `README.md` 项目结构摘要（`## 项目结构`）；`docs/standard/01-architecture.md` |
| API 路径、响应字段、限流、CORS 变化 | `README.md` 的 API 节（`## API 规范`）；`docs/standard/02-api-specification.md` |
| schema 变化 | `supabase/migrations/` 与 `supabase/migrations/README.md`。规范里不复制 SQL |
| npm scripts 或 `.github/workflows/ci.yml` 变化 | `README.md` 常用脚本（`## 常用脚本`）；`docs/standard/05-testing.md` |
| 文件体积阈值或豁免变化 | `docs/standard/06-file-size.md` |
| 删除确认无引用的导出 | `docs/standard/01-architecture.md` 还列着该文件时，删掉那一行。未列出则不改 |
| 新增或改名规范文件 | 先改 `docs/standard/README.md` |

## 历史文档

plans、summary、长文不回写。

某份历史文档仍被当作现行规范引用时，只加一行，指向 `docs/standard/` 里对应的现行规范。不把规范正文抄回去。
