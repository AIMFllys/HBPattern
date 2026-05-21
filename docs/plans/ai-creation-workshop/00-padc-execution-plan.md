# AI 创作中心 3D 文创预览系统 PADC 执行计划

> 工作分支：`feat/ai-creation-workshop`
> 计划日期：2026-05-21
> 目标页面：`D:\project\HBPattern\HBPattern\src\app\(main)\create\page.tsx`
> 源计划目录：`D:\project\HBPattern\HBPattern\docs\ai-creation-plan`

## 1. 源文档与路径引用

本计划以 `docs/ai-creation-plan/00-overview.md` 为总纲，并逐轮落实同目录下全部分阶段文档：

| 输入路径 | 实施含义 | 备注 |
| --- | --- | --- |
| `D:\project\HBPattern\HBPattern\docs\ai-creation-plan\00-overview.md` | 总体目标、技术选型、文件结构、产品类型、Store、验收标准 | 明确“纯前端实现，不依赖 AI API，不依赖后端持久化” |
| `D:\project\HBPattern\HBPattern\docs\ai-creation-plan\01-dependencies-setup.md` | 依赖、类型、纹样/产品配置、Zustand Store | Round 1 阶段提交 |
| `D:\project\HBPattern\HBPattern\docs\ai-creation-plan\02-3d-viewport-models.md` | R3F Canvas、产品模型路由、6 个程序化几何体 | `00-overview.md` 中表格写作 `02-product-models.md`，以实际文件名为准 |
| `D:\project\HBPattern\HBPattern\docs\ai-creation-plan\03-texture-system.md` | Canvas 程序化纹理、纹理 Hook、共享材质、缓存 | 技术核心阶段 |
| `D:\project\HBPattern\HBPattern\docs\ai-creation-plan\04-pattern-library.md` | 纹样缩略图、分类/搜索 UI、颜色选择器 | 需要避免新增 JSX inline style |
| `D:\project\HBPattern\HBPattern\docs\ai-creation-plan\05-ui-integration.md` | 产品选择器、参数面板、浮动工具栏、页面完整集成 | 替换当前 mockup |
| `D:\project\HBPattern\HBPattern\docs\ai-creation-plan\06-export-polish.md` | PNG 导出、localStorage 保存、移动端基础适配、最终验收 | 交付收口阶段 |

## 2. 当前代码事实

- 仓库根目录是 `D:\project\HBPattern\HBPattern`，外层 `D:\project\HBPattern` 不是 Git 仓库。
- 当前功能分支已创建为 `feat/ai-creation-workshop`，没有使用 `codex` 命名。
- 当前工作树中 `.gitignore` 已在本任务开始前处于修改状态；本计划不把它纳入阶段提交，除非后续实现明确需要。
- `docs/ai-creation-plan/` 当前为未跟踪目录，是本次实现的权威输入资料，阶段 0 会随计划文档一起提交。
- 项目栈来自 `package.json`：Next.js `16.2.1`、React `19.2.4`、Zustand `5.0.12`、Tailwind CSS v4、npm。
- `/create` 当前是静态 mockup，路径为 `src/app/(main)/create/page.tsx`，已经包含三栏视觉原型、`SiteHeader`、`ParameterSlider`、`Icon`、`useAuthStore`、`useAuthModal`。
- `src/components/create/`、`src/lib/textures/`、`src/types/create.ts`、`src/stores/useCreateStore.ts` 目前尚不存在。
- `src/app/globals.css` 已定义 `cinnabar/gold/rice/rice-warm/rice-deep/ink` 等 token，但没有 `rice-cool`；实现时不能照抄不存在的 `bg-rice-cool`。
- `scripts/lint-guards.mjs` 当前守护动态 Tailwind aspect、`min-screen`、API 内联 schema、gallery mock import、内联 footer。计划文档虽然提到禁止 inline style，实际守护脚本没有检查；后续新代码仍按更严格约束执行。
- `src/components/icons/Icon.tsx` 现有实现含 `style=`，这是既有文件状态；本任务新增组件不扩大该模式。

## 3. PADC 总流程定义

本任务按 PADC 推进，每个阶段结束后必须本地 commit：

| 阶段 | 含义 | 本项目动作 |
| --- | --- | --- |
| P - Plan | 规划和边界确认 | 建分支、整理源路径、写本执行计划、提交计划输入 |
| A - Analyze | 源文档与代码事实核对 | 对每个 Round 先核对现有组件、token、依赖和类型边界，修正文档中不适配当前仓库的细节 |
| D - Develop | 分轮实现 | Round 1-6 逐轮开发；每轮独立验证、独立 commit |
| C - Check/Close | 验收与收口 | 构建、lint、测试、UTF-8、浏览器手测、最终状态说明 |

## 4. 阶段拆分与提交边界

### Phase 0：P 阶段，计划与输入资料落库

范围：
- 新增 `docs/plans/ai-creation-workshop/00-padc-execution-plan.md`。
- 将 `docs/ai-creation-plan/` 作为本次实现输入提交入库。
- 不修改业务代码，不处理 `.gitignore` 既有改动。

验证：
- `git diff --cached --check`
- UTF-8 文件可读性抽查：`docs/ai-creation-plan/*.md` 与本计划文档。

提交建议：
- `docs: add ai creation PADC execution plan`

### Phase 1：Round 1，依赖、类型、数据、Store

对应源文档：
- `docs/ai-creation-plan/01-dependencies-setup.md`

预期改动路径：
- `package.json`
- `package-lock.json`
- `src/types/create.ts`
- `src/lib/textures/patternPresets.ts`
- `src/lib/textures/productConfigs.ts`
- `src/stores/useCreateStore.ts`
- `src/components/create/`
- `src/components/create/models/`

实现要点：
- 安装 `three`、`@react-three/fiber`、`@react-three/drei`、`@types/three`。
- 类型定义以 `ProductId`、`PatternPreset`、`TextureParams`、`MaterialParams`、`CreationSnapshot` 为核心。
- Store 默认产品为 `frame`，默认纹样来自 `PATTERN_PRESETS[0]`。
- 保持纯前端状态，不引入服务端持久化。

验证：
- `npm run build`
- `npm run lint`
- `git diff --check`

提交建议：
- `feat: add ai creation state and presets`

### Phase 2：Round 2，3D 视口和 6 个程序化模型

对应源文档：
- `docs/ai-creation-plan/02-3d-viewport-models.md`

预期改动路径：
- `src/components/create/Canvas3D.tsx`
- `src/components/create/ProductModel.tsx`
- `src/components/create/models/Frame.tsx`
- `src/components/create/models/Scarf.tsx`
- `src/components/create/models/PhoneCase.tsx`
- `src/components/create/models/Fan.tsx`
- `src/components/create/models/TeaCup.tsx`
- `src/components/create/models/TShirt.tsx`
- `src/app/(main)/create/page.tsx`
- `src/app/globals.css`

实现要点：
- `Canvas3D` 必须是 client component，并通过 `next/dynamic` 在页面层禁用 SSR。
- Canvas 初始接入只做可见 3D 视口与可旋转模型，为后续纹理阶段留接口。
- 文档中的 `bg-rice-cool` 替换为现有 token，例如 `bg-rice-warm` 或补充明确 token 后再使用。
- 6 个模型先使用程序化几何体，不引入外部 `.glb` 资源。
- `preserveDrawingBuffer: true` 提前配置，为 Round 6 PNG 导出准备。

验证：
- `npm run build`
- `npm run lint`
- `npm run dev` 后访问 `http://localhost:6427/create`
- 浏览器检查：3D 视口非空、默认画框可旋转/缩放、无 hydration 报错。

提交建议：
- `feat: add 3d viewport product models`

### Phase 3：Round 3，动态纹理系统

对应源文档：
- `docs/ai-creation-plan/03-texture-system.md`

预期改动路径：
- `src/lib/textures/generatePattern.ts`
- `src/hooks/usePatternTexture.ts`
- `src/components/create/TexturedMaterial.tsx`
- `src/lib/textures/textureCache.ts`
- `src/components/create/models/*.tsx`

实现要点：
- 使用浏览器 Canvas 2D API 生成纹样，不依赖 AI API、不请求图片资源。
- 所有主表面使用 `TexturedMaterial`，边框、扇骨、杯内等装饰部件保留固定材质。
- 参数映射必须完整覆盖 scale、rotation、offsetX、offsetY、opacity、tiling、baseColor、roughness、metalness。
- 注意纹理生命周期，切换纹样和卸载时 dispose，避免 WebGL 资源泄漏。
- `usePatternTexture` 只在客户端执行，避免 `document` 在服务端访问。

验证：
- `npm run build`
- `npm run lint`
- 浏览器检查：默认纹样可见，调整 Store 或 UI 参数后纹理变化即时反映。

提交建议：
- `feat: add procedural pattern texture system`

### Phase 4：Round 4，纹样库 UI 和颜色选择

对应源文档：
- `docs/ai-creation-plan/04-pattern-library.md`

预期改动路径：
- `src/components/create/PatternThumbnail.tsx`
- `src/components/create/PatternPanel.tsx`
- `src/components/ui/ColorPicker.tsx`
- 必要时追加 `src/app/globals.css`

实现要点：
- 纹样缩略图复用 `generatePatternCanvas`，不要新建静态占位图片。
- 分类、搜索、选中、取消选择、底部选中信息区必须全部可用。
- 动态色块不要在新增 JSX 中使用 `style={{...}}`；可用 ref 写入 CSS 属性或受控 CSS 变量方案。
- `ColorPicker` 要覆盖预设色板和原生自定义取色。

验证：
- `npm run build`
- `npm run lint`
- 浏览器检查：8 个纹样缩略图非纯色、分类筛选和搜索有效、选中后 3D 纹理同步切换。

提交建议：
- `feat: add pattern library controls`

### Phase 5：Round 5，页面完整集成

对应源文档：
- `docs/ai-creation-plan/05-ui-integration.md`

预期改动路径：
- `src/components/create/ProductSelector.tsx`
- `src/components/create/ParameterPanel.tsx`
- `src/components/create/ViewportToolbar.tsx`
- `src/components/create/ModelInfo.tsx`
- `src/components/create/OffsetPad.tsx`
- `src/app/(main)/create/page.tsx`

实现要点：
- 用完整 3D 创作中心替换现有 `/create` mockup。
- 保留 `SiteHeader`，保持无 Footer 行为。
- 产品选择器必须覆盖 6 个产品：`frame`、`scarf`、`phone-case`、`fan`、`tea-cup`、`tshirt`。
- 参数面板必须覆盖缩放、旋转、透明度、粗糙度、平铺模式、视角、底色、偏移。
- `OffsetPad` 从“可选”提升为实现项，因为 `00-overview.md` 明确要求位置参数调节。
- 暂不重定向 `src/app/(main)/workshop/page.tsx`，避免影响现有入口。

验证：
- `npm run build`
- `npm run lint`
- 浏览器完整流程：切产品、切纹样、调参数、切视角、改底色、重置参数。

提交建议：
- `feat: integrate ai creation workspace page`

### Phase 6：Round 6，导出、保存、移动端、性能打磨

对应源文档：
- `docs/ai-creation-plan/06-export-polish.md`

预期改动路径：
- `src/components/create/ExportButton.tsx`
- `src/lib/createStorage.ts`
- `src/components/create/MobileToolbar.tsx`
- `src/components/create/Canvas3D.tsx`
- `src/components/create/ParameterPanel.tsx`
- `src/app/(main)/create/page.tsx`
- `src/hooks/usePatternTexture.ts`
- `src/app/globals.css`

实现要点：
- 导出 PNG 基于 R3F Canvas 的 `preserveDrawingBuffer`，导出文件名包含产品、纹样和日期。
- 保存配置只使用 `localStorage['hbpattern-creations']`，不接后端 API。
- 未登录保存/导出沿用 `useAuthStore` + `useAuthModal` 模式。
- 移动端至少提供底部 Tab：视口、纹样、参数，保证 `<768px` 可完成核心流程。
- 对纹理更新使用合理的 memo、deferred 或缓存策略，控制切换时资源释放。

验证：
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run dev` 后桌面和移动端 viewport 浏览器检查。
- 导出 PNG 实际下载，localStorage 保存后刷新可读取或至少可确认写入。

提交建议：
- `feat: add export save and mobile polish`

### Phase 7：C 阶段，最终验收和收口

范围：
- 修复前序验证发现的问题。
- 对 `docs/ai-creation-plan/00-overview.md` 的功能验收逐项复核。
- 总结实际实现、验证命令和剩余非阻塞风险。

验证总包：
- `npm run build`
- `npm run lint`
- `npm run test`
- `git diff --check`
- UTF-8 扫描：覆盖 `docs/**/*.md`、`src/**/*.{ts,tsx,css}` 中中文内容。
- 浏览器桌面：`http://localhost:6427/create`
- 浏览器移动：`390x844` 或相近视口。

提交建议：
- `docs: summarize ai creation implementation verification`

## 5. 风险清单与处理策略

| 风险 | 具体表现 | 处理策略 |
| --- | --- | --- |
| R3F 与 Next SSR 冲突 | hydration 报错、`window/document` 服务端访问 | 页面层 `dynamic(..., { ssr: false })`，Canvas/纹理 Hook 全部 client-only |
| 文档示例与当前项目 token 不一致 | `bg-rice-cool` 不存在导致样式无效 | 先使用现有 token；若确需新增 token，单独在 `globals.css` 定义并验证 |
| 转写示例代码导致类型问题 | React 19、R3F、drei 类型不完全一致 | 以本仓库 TypeScript 编译为准，必要时调整类型而非引入 `any` |
| 纹理贴图生命周期泄漏 | 多次切换纹样后显存上涨 | `dispose()` 旧纹理，缓存上限明确，避免每帧重建 Canvas |
| 新增动态颜色与 inline style 约束冲突 | JSX `style=` 扩散 | 新组件使用 ref 写入或 CSS 变量封装；不新增散落 inline style |
| 移动端 UI 过密 | 底部参数区挤压 3D 视口 | 移动端改 Tab/Sheet，桌面保留三栏布局 |
| 中文和路径乱码 | PowerShell 输出不可信或文件编码被破坏 | 使用 `Get-Content -Encoding UTF8`、`git diff --check`、UTF-8 扫描验证 |

## 6. 验收基线

功能验收以 `docs/ai-creation-plan/00-overview.md` 为准：

- 可选择 6 种文创产品。
- 3D 模型可旋转、缩放、平移。
- 至少 6 种纹样可选，本计划实现 8 种预设。
- 缩放、旋转、位置、透明度、平铺、底色等参数实时反映到 3D 模型。
- 可导出 PNG 截图。
- 移动端基本可用。
- 不依赖 AI API，不依赖后端持久化。

代码质量验收：

- TypeScript strict 构建通过。
- ESLint `--max-warnings=0` 通过。
- `lint-guards: OK`。
- 无新增 `any`、无新增 `console.log`、无无意义占位 UI。
- 新增中文文件保持 UTF-8。

## 7. 下一步执行入口

Phase 0 提交完成后，从 Phase 1 开始按 `docs/ai-creation-plan/01-dependencies-setup.md` 实施。每轮结束后先验证，再 commit；如果某轮发现源文档示例与当前代码事实冲突，以当前仓库可构建、可交互、可验证为准，并在提交说明或最终总结中写明调整原因。
