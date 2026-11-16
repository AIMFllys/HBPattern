# 规范与清理记录（2026-11-16）

本次只处理规范里写明的违规。对外仍从原路径导出测试和页面在用的符号。没有做安全加固。

验证命令与结果：

- `npx tsc --noEmit`：通过
- `npm run lint`（ESLint `--max-warnings=0` 加 `scripts/lint-guards.mjs`）：通过
- `npm test`（`vitest run`，全量，不是烟测）：27 个文件，95 个测试，通过

## 已拆

| 原文件 | 拆分后 | 保留的导出 |
|--------|--------|------------|
| `src/lib/textures/generatePattern.ts`（原 336，现 50） | `src/lib/textures/motifs/geometric.ts`（82）、`field.ts`（104）、`creature.ts`（106） | `generatePatternCanvas` |
| `src/components/workshop/AdjustPanel.tsx`（原 324，现 17） | `src/components/workshop/adjust/AdjustChrome.tsx`（61）、`ColorAdjustSection.tsx`（99）、`TransformSection.tsx`（91）、`SymmetrySection.tsx`（77） | `AdjustPanel` |

`draw*` 没有从 `generatePattern.ts` 再导出。调节区块没有从 `AdjustPanel.tsx` 再导出。

## 已删除（确认无引用）

整文件：

- `src/components/home/HeroBackground.tsx`
- `src/data/mock/regions.ts`
- `src/data/mock/stats.ts`
- `src/hooks/queries/usePattern.ts`
- `src/hooks/mutations/useToggleLike.ts`

符号：

- `filterOptions`（`src/data/mock/patterns.ts`，`mockPatterns` 保留）
- `DEFAULT_VIEW`、`DragState`、`MIN_ZOOM`、`MAX_ZOOM`、`clampZoom`
- `HUBEI_BOUNDARY_SOURCE`（`hubeiBoundaryFeatures` 保留）
- `MapLibreMapHandle`
- `useMapLibre` 返回的 `ready`、`setReady`、`getZoom`
- `hubeiGeoJSONSource`
- `hubeiPlaces.ts` 对 `FeatureCollection`、`Geometry` 的再导出
- `schemas.ts` 的六个 `*Input` 类型别名（Zod schema 常量保留）
- 仅默认导出、没有 default import 的一行：`Icon`、`Logo`、`ThemeToggle`、`HeroContent`、`AnimatedTimeline`、`ColorPalette`、`PatternHeroImage`

## 已合并（行为相同）

- `canvasToBlob`：工坊 `exportUtils.ts` 导出，创作 `exportAssets.ts` 改为导入。`quality` 保持可选。两边的文件名清洗没有合并，空串回退分别是 `design` 和 `workshop-design`。
- `HUBEI_REGION_NAMES` 改为 `hubeiRegions.map(region => region.name)`。17 个地市顶层名称与原字面量同序。`inkStyle.ts` 的导出没有改。

## 未拆

| 路径 | 行数 | 原因 |
|------|------|------|
| `src/data/map/hubei.ts` | 697 | 纯数据名录。查找函数只在尾部。拆开仍过硬线，并被地图、测试和 `scripts/seed.ts` 引用 |
| `src/lib/map/style/inkStyle.ts` | 422 | 一份必须一次返回的 MapLibre style 文档。不是多职责业务模块 |
| `src/components/map/HubeiMapClient.tsx` | 393 | 单屏容器。状态机在 `useMapDemoState.ts`，没有这个组件的测试，桌面和移动端共用同一组 props |
| `src/lib/workshop/canvasEngine.ts` | 285 | 未过 320 硬线 |
| `supabase/migrations/*.sql` | 最长 270 | schema 真相源，且未过硬线 |
| `scripts/hubei-patterns-data.json` | 1221 | 种子数据 |
| `src/data/map/*.json` | — | GeoJSON 纯数据 |

当前没有「单一状态机、没有测试、又强耦合」且超过硬线、却被硬拆的文件。`HubeiMapClient.tsx` 属于这一类，已写入上表，没有拆。

## 疑似，未删

还要核实产品是否保留、是否预留、是否手工入口。本轮不删。

- `src/lib/api/apiKey.ts`、`src/lib/api/quota.ts`（文件头写明预留）
- `src/lib/api/response.ts` 的 `fail`，以及 `src/lib/api/error-messages.ts`
- `src/lib/utils.ts` 的 `cn`，`src/lib/motion.ts` 里未接入的四个动效预设
- `src/lib/textures/textureCache.ts` 的 `clearTextureCache`，`patternPresets.ts` 的 `getPatternsByCategory`
- `src/lib/createStorage.ts` 的 `deleteCreation`、`clearAllCreations`
- `useCreateStore` 的 `isExporting` / `setIsExporting`
- `useWorkshopStore` 的 `addLayer`、`setSelectedSourcePattern`
- `src/types/` 里只经 barrel 再导出、业务代码未按名字引用的占位类型
- `scripts/` 里未接入 `package.json` 的 GeoJSON 生成、图标、导入和安全检查脚本
