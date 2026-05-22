# Code Review PADC 修复执行计划

> 计划日期：2026-05-22
> 工作分支：`fix/code-review-padc`
> 审查基准：`D:\project\HBPattern\HBPattern\docs\issues\code_review_report.md`

## 输入基准

本轮修复必须以 `D:\project\HBPattern\HBPattern\docs\issues\code_review_report.md` 为唯一审查基准，按该文件中的问题编号、模块结构和 P0/P1/P2 优先级推进。若报告建议与当前代码事实冲突，以可构建、可测试、可交互的 live repo 行为为准，并在收口文档记录调整。

## PADC 流程

| 阶段 | 本轮动作 | 提交边界 |
| --- | --- | --- |
| P - Plan | 建立专用分支，提交审查报告与本执行计划 | 只提交 `docs/issues/code_review_report.md` 与本计划 |
| A - Analyze | 复核报告结构、Next.js 16 本地文档、当前测试基线和修复清单 | 提交分析/清单文档，不修改业务代码 |
| D - Develop P0 | 拆分 `HubeiMapClient.tsx`，修复 `M-ARCH-01` | 地图结构拆分独立提交 |
| D - Develop P1 | 修复地图状态/存储、Workshop Canvas/history/dialog | 按模块分阶段提交 |
| D - Develop P2 | 抽离轻量组件、补现代 Web 与可访问性细节、扩展测试 | 低风险 polish 与测试独立提交 |
| C - Check | 全量验证、浏览器 smoke、UTF-8 扫描、收口文档 | 提交最终验收记录 |

## 修复顺序

1. `M-ARCH-01`：优先拆分 1150+ 行地图巨型组件，保持 `/map` 可见行为不变。
2. P1：处理 `M-ARCH-02`、`M-SEC-01`、`M-WEB-01`、`W-CODE-01`、`W-PERF-02`、`W-A11Y-01`。
3. P2：处理 `W-ARCH-01`、`W-CODE-03`、`W-WEB-*`、`M-CODE-02`、`M-PERF-01`、`M-A11Y-*` 与测试覆盖缺口。

## 验证要求

每个开发阶段结束至少执行：

```powershell
npm run test
npm run lint
git diff --check
```

结构性阶段和最终收口补充：

```powershell
npm run build
```

最终浏览器 smoke 覆盖：

- `http://localhost:6427/map`
- `http://localhost:6427/workshop`

最终 UTF-8 检查覆盖本轮新增/修改的 `docs/**/*.md`、`src/**/*.ts`、`src/**/*.tsx`，确保没有 `U+FFFD` 或中文 mojibake。

## 明确边界

- 不提交任务开始前已有的 `.gitignore` 修改。
- 不提交未纳入本轮修复范围的 `docs/workshop-plan/`。
- 不改变 `/map`、`/workshop` 路由 URL。
- 不改变 localStorage key：`hbpattern.mapDemo.v1`、`hbpattern-workshop-draft`。
- 不写入真实云租户标识、密钥、生产 URL 或敏感资产清单。
- P2 中只记录 i18n 风险，不启动完整国际化重构。
