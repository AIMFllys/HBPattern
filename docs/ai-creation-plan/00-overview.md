# AI 创作中心 - 纯前端 3D 文创预览系统

## 项目概述

将现有的静态 mockup `/create` 页面升级为完整可交互的 3D 文创预览系统，用户可以：
1. 选择文创产品（茶杯、T恤、手机壳等）
2. 在 3D 视口中查看产品模型
3. 选择传统纹样并应用到产品上
4. 通过参数调节纹样的缩放、旋转、位置、透明度等
5. 实时预览效果并导出截图

**核心原则：纯前端实现，不依赖 AI API，不依赖后端持久化**

---

## 技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| React Three Fiber | ^9.x | React 3D 渲染核心 |
| @react-three/drei | ^10.x | 3D 辅助工具（Controls, Environment 等） |
| Three.js | ^0.170.x | 底层 3D 引擎 |
| Zustand | 已有 | 状态管理 |
| Tailwind CSS v4 | 已有 | 样式 |

---

## 轮次划分总览

| 轮次 | 文档 | 内容 | 预估复杂度 |
|------|------|------|-----------|
| **Round 1** | `01-dependencies-setup.md` | 安装依赖 + 基础 3D 视口 | ⭐⭐ |
| **Round 2** | `02-product-models.md` | 6 种文创产品程序化几何体 | ⭐⭐⭐ |
| **Round 3** | `03-texture-system.md` | 动态纹理系统 + 参数化控制 | ⭐⭐⭐⭐ |
| **Round 4** | `04-pattern-library.md` | 纹样库 UI + 程序化纹理生成 | ⭐⭐⭐ |
| **Round 5** | `05-ui-integration.md` | 完整页面集成 + 产品选择器 | ⭐⭐⭐ |
| **Round 6** | `06-export-polish.md` | 导出功能 + 交互优化 + 收尾 | ⭐⭐ |

---

## 文件结构规划

```
src/
├── app/(main)/create/
│   ├── page.tsx                    # 主页面（重构）
│   └── layout.tsx                  # 保持不变
├── components/
│   ├── create/                     # 新建目录
│   │   ├── Canvas3D.tsx            # R3F Canvas 容器
│   │   ├── ProductModel.tsx        # 产品模型渲染器
│   │   ├── ProductSelector.tsx     # 产品选择器 UI
│   │   ├── PatternPanel.tsx        # 纹样选择面板
│   │   ├── ParameterPanel.tsx      # 参数调节面板
│   │   ├── ExportButton.tsx        # 导出按钮
│   │   └── models/                 # 各产品几何体
│   │       ├── TeaCup.tsx
│   │       ├── TShirt.tsx
│   │       ├── PhoneCase.tsx
│   │       ├── Fan.tsx
│   │       ├── Scarf.tsx
│   │       └── Frame.tsx
│   └── ui/
│       └── ColorPicker.tsx         # 新增：颜色选择器
├── stores/
│   └── useCreateStore.ts           # 新增：创作状态管理
├── lib/
│   └── textures/                   # 新增目录
│       ├── generatePattern.ts      # 程序化纹理生成
│       └── patternPresets.ts       # 纹样预设数据
└── types/
    └── create.ts                   # 新增：创作相关类型
```

---

## 产品类型定义

| 产品 | 英文 ID | 几何体类型 | UV 复杂度 | 优先级 |
|------|---------|-----------|----------|--------|
| 画框/屏风 | `frame` | PlaneGeometry | 最低 | P0 |
| 丝巾/方巾 | `scarf` | PlaneGeometry + 微变形 | 低 | P0 |
| 手机壳 | `phone-case` | BoxGeometry 圆角 | 低 | P1 |
| 扇面 | `fan` | CircleGeometry 裁切 | 中 | P1 |
| 茶杯/陶瓷 | `tea-cup` | LatheGeometry | 中 | P2 |
| T恤 | `tshirt` | PlaneGeometry 展开 | 中 | P2 |

---

## 状态管理设计

```typescript
interface CreateStore {
  // 产品
  selectedProduct: ProductType
  setProduct: (product: ProductType) => void

  // 纹样
  selectedPattern: PatternPreset | null
  setPattern: (pattern: PatternPreset | null) => void

  // 参数
  params: {
    scale: number        // 0-200, default 100
    rotation: number     // 0-360, default 0
    offsetX: number      // -100 to 100, default 0
    offsetY: number      // -100 to 100, default 0
    opacity: number      // 0-100, default 100
    tiling: 'single' | 'repeat' | 'mirror'
    baseColor: string    // hex color
  }
  setParam: <K extends keyof Params>(key: K, value: Params[K]) => void
  resetParams: () => void

  // 视角
  cameraPreset: 'front' | 'side' | 'top' | 'free'
  setCameraPreset: (preset: CameraPreset) => void
}
```

---

## 验收标准

### 功能验收
- [ ] 可选择 6 种文创产品
- [ ] 3D 模型可旋转/缩放/平移
- [ ] 可选择至少 6 种纹样
- [ ] 参数调节实时反映到 3D 模型
- [ ] 可切换底色
- [ ] 可导出 PNG 截图
- [ ] 移动端基本可用

### 性能验收
- [ ] 首次加载 < 3s（3D 资源懒加载）
- [ ] 参数调节响应 < 100ms
- [ ] 内存占用 < 200MB

### 代码质量
- [ ] TypeScript 严格模式无报错
- [ ] ESLint 无警告
- [ ] 组件职责单一，可复用

---

## 执行顺序

```
Round 1 → Round 2 → Round 3 → Round 4 → Round 5 → Round 6
   ↓         ↓         ↓         ↓         ↓         ↓
 依赖     几何体     纹理      纹样库     集成      收尾
```

每轮完成后需验证：
1. `npm run build` 无报错
2. `npm run lint` 无警告
3. 页面可正常访问

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| R3F 与 Next.js 16 SSR 冲突 | 所有 3D 组件使用 `'use client'` + dynamic import |
| 纹理加载性能 | 使用 Canvas 程序化生成，避免大图片 |
| 移动端性能 | 降级渲染（减少光照、简化几何体） |
| 包体积过大 | Tree-shaking + 按需导入 drei 组件 |

---

**下一步：执行 Round 1 (`01-dependencies-setup.md`)**
