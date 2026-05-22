# Code Review PADC 分析清单

> 分析日期：2026-05-22
> 审查基准：`D:\project\HBPattern\HBPattern\docs\issues\code_review_report.md`

## 基线事实

- 当前分支：`fix/code-review-padc`。
- 任务开始前已有无关改动：`.gitignore` 修改、`docs/workshop-plan/` 未跟踪；本轮不纳入提交。
- Phase 0 已提交审查报告与执行计划：`docs/issues/code_review_report.md`、`docs/plans/code-review-padc/00-padc-execution-plan.md`。
- 当前验证基线在计划阶段已通过：`npm run test`、`npm run lint`、`npm run build`。
- `src/components/map/HubeiMapClient.tsx` 当前 1152 行，`M-ARCH-01` 仍是首要结构风险。
- Workshop 已有部分测试补强：`colorAdjust.test.ts`、`exportUtils.test.ts`；仍需补 `symmetry`、`layerCompositor`、history 与状态相关覆盖。

## Next.js 16 约束

已按 `AGENTS.md` 读取本地版本文档：

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`

落实到本轮实现：

- `/map` 和 `/workshop` 页面继续由 Server Component 做入口，交互组件继续使用 `'use client'`。
- 拆分地图组件时只在 client 组件层移动状态、事件和浏览器 API，不把 `window`、`localStorage`、`FileReader` 泄入 Server Component。
- 新增内部组件放在 `src/components/map/`、`src/components/workshop/` 和对应 `utils/`、`hooks/` 下，不改变路由结构。

## 按审查报告映射的修复清单

### P0

- `M-ARCH-01`：拆分 1152 行 `HubeiMapClient.tsx`，主文件只保留状态编排与布局连接。

### P1

- `M-ARCH-02` / `M-CODE-01`：用 reducer 收敛地图 view、selection、mode、form、storage 状态，替换多处级联 `setState`。
- `M-SEC-01` / `M-PERF-01`：为 `hbpattern.mapDemo.v1` 增加 Zod schema 校验和 debounce 写入。
- `M-WEB-01`：全局补 `prefers-reduced-motion`，避免地图动画无条件运行。
- `W-CODE-01`：合并 Workshop Canvas render effect，避免同一状态变更触发同步 render 和 RAF render。
- `W-PERF-02`：Workshop 草稿写入 debounce，并优先使用 `requestIdleCallback`。
- `W-A11Y-01`：ExportDialog 改为原生 `<dialog>`，保留现有 store 控制和登录门槛行为。

### P2

- `W-ARCH-01`：抽离 `WorkshopTopBar`。
- `W-CODE-03` / `W-SEC-01`：重构 `PatternAssetCard` 图片加载，避免手写 `backgroundImage` URL 拼接。
- `W-WEB-01` / `W-WEB-02`：补素材卡 `content-visibility` 与标准 scrollbar 样式。
- `M-CODE-02`：为 SVG `clipPath` 增加 `useId()` 前缀。
- `M-A11Y-01` / `M-A11Y-02`：图例加入形状差异，表单控件使用显式 `id`/`htmlFor`。
- 共性测试缺口：补地图 reducer/storage、图片处理工具、Workshop 纯函数和 history 行为测试。

## 验证清单

- 每阶段：`npm run test`、`npm run lint`、`git diff --check`。
- 结构阶段与最终：`npm run build`。
- 最终浏览器 smoke：
  - `http://localhost:6427/map`
  - `http://localhost:6427/workshop`
- UTF-8 扫描：本轮修改的 `docs/**/*.md`、`src/**/*.ts`、`src/**/*.tsx` 不含 `U+FFFD`。
