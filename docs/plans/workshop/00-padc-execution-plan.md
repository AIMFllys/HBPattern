# 跨界创作工坊 PADC 执行计划

## 路径锚定

本计划在 `D:\project\HBPattern\HBPattern` 的 `main` 分支执行，不新建分支。实现范围来自：

- `D:\project\HBPattern\HBPattern\docs\workshop-plan\00-overview.md`
- `D:\project\HBPattern\HBPattern\docs\workshop-plan\01-store-types-bugfix.md`
- `D:\project\HBPattern\HBPattern\docs\workshop-plan\02-pattern-data-panel.md`
- `D:\project\HBPattern\HBPattern\docs\workshop-plan\03-canvas-engine.md`
- `D:\project\HBPattern\HBPattern\docs\workshop-plan\04-tools-transforms.md`
- `D:\project\HBPattern\HBPattern\docs\workshop-plan\05-page-integration.md`
- `D:\project\HBPattern\HBPattern\docs\workshop-plan\06-export-history-polish.md`

目标是把 `/workshop` 从静态 mockup 升级为 Supabase 真实纹样驱动的 Canvas 2D 深度再创作工坊。

## PADC 阶段

### P - Plan

- 新增本执行计划。
- 保留 `docs/workshop-plan/` 作为现有输入资料，不默认纳入提交。
- 不处理 `.gitignore` 既有改动。

### A - Analyze

- 遵守 `AGENTS.md`，实现前以本地 Next.js 16 文档为准。
- 以 live repo 类型和接口为准：`getPatterns()` 返回 `{ patterns, total }`，`usePatterns()` 返回分页响应的 `data` 与 `pagination`。
- 避开并行 3D 地图相关路径：`src/app/(main)/map/**`、`docs/UI设计参考/06_3d_map/**`、`src/types/map.ts`、并行更新中的 `src/types/index.ts`。

### D - Develop

- Phase 1：类型、Store、当前 mockup Bug 修复。
- Phase 2：真实 Supabase 纹样素材面板。
- Phase 3：Canvas 引擎与图层系统。
- Phase 4：工具栏、调色、变换、对称。
- Phase 5：最终页面集成。
- Phase 6：导出、历史、移动端、草稿。

每个阶段结束后只 stage 本阶段改动并本地 commit。

### C - Check

最终收口文档写入 `D:\project\HBPattern\HBPattern\docs\plans\workshop\01-implementation-verification.md`，记录功能验收、命令验证、浏览器验证和非阻断风险。

## 验证基线

阶段验证至少包含：

```powershell
npm run build
npm run lint
```

涉及纯逻辑与历史/导出阶段时补充：

```powershell
npm run test
git diff --check
```

最终验收覆盖桌面与移动端 `http://localhost:6427/workshop`，并检查新增/修改中文文件不出现 `U+FFFD`。

## 提交边界

- 不提交 `.gitignore` 的既有 `*.log` 改动。
- 不提交 3D 地图并行改动。
- Workshop 类型从 `@/types/workshop` 直接导入，不修改 `src/types/index.ts`。
- 不新增真实云租户标识、密钥、生产 URL 或可复原的敏感资产清单。
