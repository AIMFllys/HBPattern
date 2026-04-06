# 湖北纹案平台 — 前端 1:1 视觉复原指南

> **目标读者**：接手前端实现任务的 AI 模型  
> **任务定义**：将 `docs/UI设计参考/` 中的 6 个 HTML 设计稿，1:1 精确复原为 Next.js React 页面  
> **范围限制**：本阶段只做前端 —— 无真实 API、无后端逻辑，全部数据用 **静态 mock 数据** 填充  
> **文档版本**：v1.0 · 2026-04-06

---

## 目录

1. [必读：关键约束与注意事项](#1-必读关键约束与注意事项)
2. [项目现状快照](#2-项目现状快照)
3. [设计系统参考](#3-设计系统参考)
4. [HTML 设计稿 → Next.js 路由映射](#4-html-设计稿--nextjs-路由映射)
5. [第一步：全局基础工作](#5-第一步全局基础工作)
6. [共享组件：站点 Header](#6-共享组件站点-header)
7. [页面实现规范（逐页详述）](#7-页面实现规范逐页详述)
   - [P1 · 纹案画廊 `/gallery`](#p1--纹案画廊-gallery)
   - [P2 · 纹案详情 `/gallery/[id]`](#p2--纹案详情-galleryid)
   - [P3 · AI 创作中心 `/create`](#p3--ai-创作中心-create)
   - [P4 · 跨界工坊 `/workshop`](#p4--跨界工坊-workshop)
   - [P5 · 3D 文化地图 `/map`](#p5--3d-文化地图-map)
   - [P6 · 管理后台 `/dashboard`](#p6--管理后台-dashboard)
8. [Mock 数据规范](#8-mock-数据规范)
9. [实现顺序建议](#9-实现顺序建议)
10. [验收标准](#10-验收标准)

---

## 1. 必读：关键约束与注意事项

> **违反以下任何一条都会导致实现不正确。请在动手前通读。**

### 1.1 Next.js 版本：16.2（不是你训练数据中的 15.x）

这个项目使用的是 **Next.js 16.2**，带有 **App Router**。  
在写任何 Next.js 相关代码前，**必须先阅读**：

```
node_modules/next/dist/docs/
```

该目录包含此特定版本的官方文档。API、文件约定、组件接口都可能与你熟悉的版本不同。

**绝对不要**凭记忆写 Next.js 专用代码（如 `generateStaticParams`、`use client` 的位置、`Metadata` 类型等）。先读文档。

### 1.2 Tailwind CSS v4（CSS-first 配置，无 `tailwind.config.js`）

项目使用 **Tailwind CSS v4**。与 v3 的核心区别：

- **没有 `tailwind.config.js`** —— 所有主题配置写在 `src/app/globals.css` 的 `@theme` 块中
- 自定义颜色已用 `--color-xxx` CSS 变量定义，Tailwind 会自动生成对应工具类 `text-xxx`、`bg-xxx`、`border-xxx`
- **不要**使用 `tailwind.config.js` 或 `tailwind.config.ts`
- 导入方式是 `@import "tailwindcss"` 而非旧的 `@tailwind base/components/utilities`

已定义的设计 token（可以直接作为 Tailwind 类名使用）：

```css
bg-cinnabar        /* #b84a39 朱砂红 */
bg-cinnabar-deep   /* #8c2f22 */
bg-cinnabar-light  /* #d4796a */
bg-rice            /* #f5f0e8 主背景 */
bg-rice-warm       /* #ede7d9 卡片 */
bg-rice-deep       /* #d6ccba 分隔线 */
bg-gold            /* #c9a84c 烫金 */
text-ink           /* #1a1a14 */
text-ink-medium    /* #3d3d30 */
text-ink-light     /* #6b6b58 */
text-ink-faint     /* #9e9e88 */
```

### 1.3 Motion v12（不是 framer-motion）

动画库已从 `framer-motion` 改名为 `motion`。导入方式：

```typescript
// ✅ 正确
import { motion } from "motion/react"

// ❌ 错误
import { motion } from "framer-motion"
```

### 1.4 图标：Material Symbols Outlined（Google 字体图标）

设计稿全部使用 **Material Symbols Outlined** 字体图标，不是 Lucide（虽然 lucide-react 已安装）。  
图标的使用方式是 HTML 字体渲染：

```jsx
<span className="material-symbols-outlined">filter_vintage</span>
```

需要在 `layout.tsx` 的 `<head>` 中加载 Google 字体 CSS。

### 1.5 纯前端 · 静态 Mock 数据

本阶段**不实现任何后端逻辑**：

- 不调用任何 API Route
- 不使用 Supabase（虽然已配置好，本阶段不触碰）
- 不使用 TanStack Query
- 所有展示数据定义在各页面文件旁的 `_mock.ts` 文件（或直接在页面文件内的 const 变量）
- 所有表单提交按钮只做视觉展示（`onClick={() => {}}` 或无 handler）

### 1.6 TypeScript：零错误

所有实现必须通过 `tsc --noEmit` 检查，不能有 TypeScript 错误。  
对于 mock 数据，定义清晰的类型接口。

### 1.7 图片处理

HTML 设计稿中的图片使用了 Google CDN 的公开 URL。在 Next.js 中使用 `<Image>` 组件时需要配置 `next.config.ts` 的 `images.remotePatterns`。  

但本阶段优先使用**占位色块**（`<div className="bg-rice-warm aspect-square" />`）或使用 `<img>` 标签（绕过 Next.js 图片优化），避免配置复杂性影响进度。等视觉验收后再替换为 `<Image>` 组件。

### 1.8 不要修改这些文件

- `src/app/globals.css` —— 设计系统已建立完善，不要改变已有 token
- `src/app/layout.tsx` —— 只向其中**添加**内容（如 icon 字体），不删除已有配置
- `src/lib/supabase/` —— auth 相关代码，本阶段不触碰
- `src/middleware.ts` —— 不修改

---

## 2. 项目现状快照

### 已存在的文件（均为空占位符，需完整重写）

| 文件路径 | 当前状态 | 对应设计稿 |
|----------|----------|-----------|
| `src/app/page.tsx` | Next.js 默认模板 | 首页（无设计稿，暂不实现） |
| `src/app/gallery/page.tsx` | 空占位 `"建设中..."` | `02_gallery/code.html` |
| `src/app/create/page.tsx` | 空占位 `"建设中..."` | `01_ai_creation/code.html` |
| `src/app/dashboard/page.tsx` | 空占位（未确认） | `04_admin/code.html` |
| `src/app/map/page.tsx` | 空占位（未确认） | `06_3d_map/code.html` |
| `src/app/workshop/page.tsx` | 空占位（未确认） | `05_workshop/code.html` |

### 需要新建的文件

| 需新建文件路径 | 原因 |
|----------------|------|
| `src/app/gallery/[id]/page.tsx` | 纹案详情页（路由不存在） |
| `src/components/layout/SiteHeader.tsx` | 共享导航栏组件 |
| `src/app/_mock/patterns.ts` | 纹案 mock 数据 |

### 已配置好的基础设施（可以直接依赖）

- `src/app/layout.tsx`：根布局，已加载 Noto Serif SC / Noto Sans SC / Newsreader 字体变量
- `src/app/globals.css`：完整的 Tailwind v4 设计系统，包括颜色 token、排版、按钮工具类

---

## 3. 设计系统参考

### 3.1 颜色体系

设计稿中使用了略有差异的颜色值，统一映射到项目设计 token：

| 设计稿颜色 | 实际值 | 使用场景 | 项目 Token |
|-----------|--------|----------|-----------|
| `#b84a39` | 朱砂红 | 主色调 CTA、激活状态 | `cinnabar` |
| `#b91c1c` | 深红 | gallery 页 primary | → 用 `cinnabar` 代替 |
| `#d2ae1e` | 烫金 | detail/admin/workshop/map 主色 | `gold` |
| `#a63d33` / `#b34d4d` | 深砖红 | 强调色 | → 用 `cinnabar-deep` 近似 |
| `#f5f3ef` / `#fdfaf1` / `#f8f8f6` | 米白背景 | 页面背景 | `rice` |
| `#e6e2d1` / `#f3eee0` | 暖米色 | 卡片、tag 背景 | `rice-warm` |
| `#1b180e` / `#211e11` | 深墨 | 深色文字、暗色模式背景 | `ink` |

> **注意**：设计稿中 `03_pattern_detail` 到 `06_3d_map` 使用金色 (`#d2ae1e`) 作为 primary，而 `01_ai_creation` 和 `02_gallery` 使用红色 (`#b84a39`) 作为 primary。实现时按各页面设计稿的实际颜色处理。

### 3.2 字体使用

```css
font-serif    /* Noto Serif SC, Newsreader — 标题、展示文字 */
font-sans     /* Noto Sans SC — 正文、UI 文字 */
```

在 className 中可以直接用 Tailwind 类 `font-serif` / `font-sans`（变量已在 layout.tsx 注入）。

### 3.3 间距与圆角

设计稿使用极小圆角（`"DEFAULT": "0.125rem"`，约 2px），整体风格偏向方正、简约。  
避免使用 `rounded-xl` / `rounded-2xl` 这类大圆角，除非设计稿明确显示。

### 3.4 图标用法

```jsx
{/* 所有图标使用 Material Symbols Outlined 字体 */}
<span className="material-symbols-outlined">search</span>
<span className="material-symbols-outlined">filter_vintage</span>
<span className="material-symbols-outlined">landscape</span>
```

尺寸通过 `text-xl`、`text-2xl`、`text-3xl` 等 Tailwind 字号类控制。

---

## 4. HTML 设计稿 → Next.js 路由映射

| 设计稿文件 | 对应 URL 路由 | 对应 Next.js 文件 | 页面用途 |
|-----------|-------------|-----------------|---------|
| `docs/UI设计参考/02_gallery/code.html` | `/gallery` | `src/app/gallery/page.tsx` | 纹案瀑布流画廊 + 筛选面板 |
| `docs/UI设计参考/03_pattern_detail/code.html` | `/gallery/[id]` | `src/app/gallery/[id]/page.tsx` | 单个纹案详情页 |
| `docs/UI设计参考/01_ai_creation/code.html` | `/create` | `src/app/create/page.tsx` | AI 创作中心 + 3D 预览 |
| `docs/UI设计参考/05_workshop/code.html` | `/workshop` | `src/app/workshop/page.tsx` | 跨界创作工坊 |
| `docs/UI设计参考/06_3d_map/code.html` | `/map` | `src/app/map/page.tsx` | 3D 非遗文化地图 |
| `docs/UI设计参考/04_admin/code.html` | `/dashboard` | `src/app/dashboard/page.tsx` | 管理后台数据看板 |

> `docs/UI设计参考/` 下每个子目录都有：
> - `code.html` — 完整 HTML 源码（实现依据）
> - `screen.png` — 页面截图（视觉验收参考）

---

## 5. 第一步：全局基础工作

在实现任何页面之前，必须完成以下两件事：

### 5.1 在 layout.tsx 中加载 Material Symbols Outlined

编辑 `src/app/layout.tsx`，在 `<html>` 或 `<head>` 等效位置添加字体 CSS：

```tsx
// 需要通过 next/head 或直接在 <html> 中使用 <link>
// Next.js 16.2 App Router 方式：在 layout.tsx 的 return 中添加
// 具体实现参考 node_modules/next/dist/docs/ 中的 Metadata / Head 文档

// 或者在 globals.css 中用 @import 方式引入（推荐，避免 layout 修改）
```

在 `src/app/globals.css` 中添加（Tailwind v4 兼容）：

```css
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* Material Symbols 默认样式 */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
}
```

> **注意**：如果网络无法访问 Google Fonts（中国网络），需要自托管字体文件，或使用项目中已有的本地字体解决方案。在本阶段可以先跳过图标渲染，用文字标签替代，后续再处理。

### 5.2 创建 Mock 数据文件

新建 `src/app/_mock/patterns.ts`，定义所有页面需要的 mock 数据。  
具体结构见 [§8 Mock 数据规范](#8-mock-数据规范)。

---

## 6. 共享组件：站点 Header

各页面的顶部导航栏结构几乎相同，建议提取为共享组件。

### 6.1 Header 组件位置

新建 `src/components/layout/SiteHeader.tsx`

### 6.2 通用 Header 结构（从设计稿提取）

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo Icon] [站点名称]    [nav1] [nav2] [nav3] [nav4]           │
│                                          [搜索框] [通知] [头像]  │
└─────────────────────────────────────────────────────────────────┘
```

关键样式特征：
- `sticky top-0 z-50`
- 背景：`bg-rice/80 backdrop-blur-md`（半透明毛玻璃效果）
- 底部边框：`border-b border-rice-deep/50`
- 高度：`py-4`
- 水平内边距：`px-8` 至 `px-10`
- 当前激活的导航项：`border-b-2 border-[主色]`（下划线样式）

### 6.3 各页面 Header 差异对比

| 页面 | Logo 图标 | 站点名称 | 主色 |
|------|-----------|---------|------|
| gallery | `filter_vintage` | 湖北传统纹样库 | cinnabar (#b91c1c) |
| pattern detail | `landscape` | 纹样大观 | gold (#d2ae1e) |
| create (AI) | `storm` | AI 创意中心 | cinnabar (#b84a39) |
| workshop | `grid_view` | 纹样+ 跨界创作工坊 | gold (#d2ae1e) |
| map | `storm` | 湖北非遗3D文化地图 | gold (#d2ae1e) |
| dashboard | `account_balance` | 2026年度管理后台 | accent-red (#b34d4d) |

> 因为各页面 logo/名称/主色不同，Header 组件应通过 props 接收这些差异。  
> 或者：为了 1:1 复原的简单性，也可以在每个页面直接内联 header，不抽提组件。选择取决于你的判断，但建议提取。

---

## 7. 页面实现规范（逐页详述）

---

### P1 · 纹案画廊 `/gallery`

**设计稿**：`docs/UI设计参考/02_gallery/code.html`  
**文件**：`src/app/gallery/page.tsx`

#### 页面布局结构

```
<body> bg-[#fdfaf1]
  <header> sticky, backdrop-blur, border-b
    Logo + 站点名 | 导航链接 | 搜索框 + 用户头像
  </header>
  
  <main> max-w-7xl mx-auto flex gap-10 py-10
    <aside> w-64 左侧筛选面板（仅 lg 显示）
      筛选标题
      年代分类（checkbox 列表）
      地域分布（checkbox 列表）
      工艺类别（checkbox 列表）
      学术研究征集卡片
    </aside>
    
    <section> flex-1 右侧主内容
      标题行：纹样画廊 + 计数 + 排序按钮
      瀑布流网格 (.masonry-grid)
        纹案卡片 × 6（带 hover 效果，含 AI 标记）
      分页控件
    </section>
  </main>
  
  <footer>
    品牌信息 | 快速链接 | 合作伙伴 | 联系方式
    版权行
  </footer>
```

#### 瀑布流实现

设计稿使用 CSS columns 实现瀑布流。在 `globals.css` 中添加：

```css
.masonry-grid {
  column-count: 2;
  column-gap: 1.5rem;
}

@media (min-width: 1024px) {
  .masonry-grid {
    column-count: 3;
  }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1.5rem;
}
```

#### 纹案卡片结构

```jsx
<div className="masonry-item group cursor-pointer">
  <div className="relative overflow-hidden rounded-xl bg-rice-warm aspect-[3/4]">
    {/* 图片或占位色块 */}
    <img alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="..." />
    {/* AI 标记（可选） */}
    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-cinnabar uppercase tracking-tight">AI 生成</div>
  </div>
  <div className="mt-4 px-1">
    <h3 className="text-base font-bold text-ink group-hover:text-cinnabar transition-colors">战国凤鸟纹</h3>
    <p className="text-sm text-ink-light font-serif italic">湖北省博物馆 · 楚文化</p>
  </div>
</div>
```

各卡片的 `aspect-ratio` 应保持多样性以体现瀑布流效果：`aspect-[3/4]`、`aspect-[1/1]`、`aspect-[4/5]`、`aspect-[3/2]`。

#### 筛选面板样式

```jsx
<h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">年代分类</h3>
<label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-rice-warm cursor-pointer group">
  <input type="checkbox" className="rounded-sm border-slate-300 text-cinnabar focus:ring-cinnabar" />
  <span className="text-sm text-ink-medium group-hover:text-cinnabar">楚式风格</span>
</label>
```

#### Mock 数据

从 `src/app/_mock/patterns.ts` 导入 6 个纹案对象（含各种 `aspectRatio` 值）。

---

### P2 · 纹案详情 `/gallery/[id]`

**设计稿**：`docs/UI设计参考/03_pattern_detail/code.html`  
**文件**：`src/app/gallery/[id]/page.tsx`（需新建目录和文件）

#### 页面布局结构

```
<body> bg-[#f8f8f6]
  <header> 同上，使用 gold 主色
  
  <main> max-w-7xl mx-auto px-6 py-12
    <!-- Hero: 艺术图书双栏布局 -->
    <div> grid grid-cols-2 gap-16
      <!-- 左：博物馆框架图片 -->
      <div className="museum-frame">
        <img 高清图片 aspect-[4/5] />
      </div>
      竖排红色标题标签（writing-vertical）
      
      <!-- 右：叙事文字 -->
      <div>
        主标题（5xl 黑体）
        英文副标题（斜体 gold）
        竖排印章标签 x2
        标签组（历史分类 + 来源）
        正文段落（带首字下沉效果）
        底部属性行：主色调色板 | 工艺类别 | 流行年代
      </div>
    </div>
    
    <!-- 演变历程 Timeline -->
    <section> mt-24
      标题行
      4列横向时间线（楚 汉 唐 清）
      中轴横线 + 节点圆点
    </section>
    
    <!-- 相关纹样 -->
    <section> mt-24
      标题 + 查看更多
      4列网格，每列：方形图 + 名称 + 年代
    </section>
  </main>
  
  <footer> bg-ink 深色
```

#### 关键样式

```css
/* 博物馆画框效果 */
.museum-frame {
  box-shadow: inset 0 0 40px rgba(0,0,0,0.1), 0 20px 25px -5px rgba(0,0,0,0.1);
  border: 12px solid #e5e7eb;
}

/* 竖排文字 */
.writing-vertical {
  writing-mode: vertical-rl;
}

/* 印章标签 */
.seal-tag {
  border: 1px solid #a63d33;
  color: #a63d33;
  padding: 0.25rem;
}
```

在 `globals.css` 中添加以上样式。

#### 首字下沉

```jsx
<p className="first-letter:text-5xl first-letter:font-bold first-letter:text-cinnabar-deep first-letter:mr-3 first-letter:float-left">
  此纹样以凤凰翱翔...
</p>
```

#### 演变时间线

水平时间线：`relative` 父容器 + `absolute top-1/2 w-full h-0.5` 中轴线 + 4列卡片。  
激活节点（唐代）使用 `border-2 border-gold/50 shadow-xl`，普通节点用 `border border-gold/10`。  
节点圆点：`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gold`。

---

### P3 · AI 创作中心 `/create`

**设计稿**：`docs/UI设计参考/01_ai_creation/code.html`  
**文件**：`src/app/create/page.tsx`

#### 页面布局结构（特殊的 3 栏编辑器布局）

```
<body> min-h-screen flex flex-col bg-rice
  <header>
  
  <main> flex flex-1 overflow-hidden
    <!-- 左：工具栏 Sidebar（窄） -->
    <aside> w-16 border-r flex flex-col items-center py-6 gap-6
      4个圆形工具按钮，第一个激活状态（bg-cinnabar text-white）
    </aside>
    
    <!-- 中：3D 预览主工作区 -->
    <section> flex-1 flex flex-col relative bg-[#efede8]
      <!-- 3D 模型预览区（上方大区域） -->
      <div> flex-1 relative overflow-hidden
        径向渐变背景
        <!-- Mock 陶瓷杯模型 -->
        <div> relative w-80 h-[450px]
          白色杯身（rounded-t-[100px] rounded-b-[40px]）
          图案叠加层（opacity-60 mix-blend-multiply）
          高光/阴影层
          杯柄（-right-12 border-[16px] rounded-full）
        </div>
        浮动标签："当前模型 白瓷茶盏"
        缩放/旋转按钮组
      </div>
      
      <!-- 底部控制面板（固定高度） -->
      <div> h-32 bg-white border-t flex items-center justify-between px-10
        3个参数滑块：图案缩放 / 图案旋转 / 透明度
        操作按钮：重置 + 保存成品
      </div>
    </section>
    
    <!-- 右：素材库 Sidebar -->
    <aside> w-80 border-l flex flex-col bg-rice
      标题："文化素材库"
      分类 Tab 切换（陶瓷 / 丝绸 / 漆器 / 壁画）
      纹案网格 2列 × 3行
      底部上传按钮
    </aside>
  </main>
```

#### 滑块样式

```css
/* 自定义 range input 滑块 */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #b84a39;
  cursor: pointer;
  border-radius: 50%;
}
```

在 `globals.css` 中添加。

#### Tab 切换（无状态交互，用 Client Component）

此页面因包含 Tab 切换交互，需要 `"use client"` 指令。使用 React `useState` 管理激活 tab。

```tsx
'use client'
import { useState } from 'react'

const categories = ['陶瓷', '丝绸', '漆器', '壁画']
const [activeTab, setActiveTab] = useState(0)
```

---

### P4 · 跨界工坊 `/workshop`

**设计稿**：`docs/UI设计参考/05_workshop/code.html`  
**文件**：`src/app/workshop/page.tsx`

#### 页面布局结构（高度等于视口的编辑器布局）

```
<body> h-screen overflow-hidden bg-[#fbfbf8]
  <header>
  
  <main> flex flex-1 overflow-hidden
    <!-- 左+中：画布区域 -->
    <div> flex-1 relative flex flex-col items-center justify-center p-12 bg-[#f4f1ea]
      面包屑导航
      <!-- 主预览展示 -->
      <div> relative w-full max-w-2xl aspect-[4/3]
        径向渐变背景光晕
        产品图（手提包）
        浮动详情标签（左侧竖线样式）
      </div>
      <!-- 底部玻璃调色面板（fixed-like bottom） -->
      <div> absolute bottom-8 w-[90%] glass-panel rounded-xl p-6
        标题 + 应用/重置按钮
        3个参数滑块：纹样密度 / 金属感 / 丝绸光泽
      </div>
    </div>
    
    <!-- 右：素材库 -->
    <aside> w-96 bg-white border-l flex flex-col
      头部：标题 + NEW badge + 搜索框 + 分类胶囊按钮
      素材网格：2列 × 3行
      底部：导出按钮（黑色大按钮）
    </aside>
```

#### 玻璃拟态面板

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

在 `globals.css` 中添加。

#### 自定义滚动条

```css
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d2ae1e; border-radius: 10px; }
```

#### 分类胶囊按钮

激活状态：`bg-gold text-white`  
未激活：`bg-[#f8f8f6] text-slate-600 hover:bg-[#e6e2d1]/40`

需要 `'use client'` + `useState` 管理激活分类。

---

### P5 · 3D 文化地图 `/map`

**设计稿**：`docs/UI设计参考/06_3d_map/code.html`  
**文件**：`src/app/map/page.tsx`

#### 页面布局结构

```
<body> min-h-screen flex flex-col bg-[#f8f8f6]
  <header>
  
  <main> flex flex-col lg:flex-row h-[calc(100vh-73px)] overflow-hidden
    <!-- 左：控制面板 + 统计 -->
    <aside> w-full lg:w-80 border-r flex flex-col overflow-y-auto bg-rice
      实时数据看板（2个统计卡片）
      层级筛选按钮组（全省概览激活）
      下载研究报告按钮
    </aside>
    
    <!-- 右：地图主视图 -->
    <section> flex-1 relative bg-[#fdfcf9]
      <!-- 背景地图纹理（opacity-40 mix-blend-multiply） -->
      <div> absolute inset-0 background-image
      
      <!-- 地图 UI 叠加层 -->
      <div> relative z-10 w-full h-full p-8 flex flex-col justify-between
        <!-- 顶部：当前视图信息 + 地图控件 -->
        <div> flex justify-between
          当前视图卡片（白色半透明）
          地图控件组（缩放+/- + 定位 + 图层）
        
        <!-- 城市标记点（绝对定位模拟） -->
        武汉市标记（红色，带脉冲动画）
        十堰市标记（金色，较小，半透明）
        恩施州标记（金色，较小，半透明）
        荆州市标记（金色，较小，半透明）
        
        <!-- 底部：地区洞察浮窗 -->
        <div> bg-white border-l-4 border-cinnabar p-6 rounded-r-xl shadow-2xl max-w-md
          武汉 (Wuhan) 标题
          国家级非遗数 + 传承人数
          重点推荐项目列表
          查看完整档案按钮
        
      <!-- 图例 -->
      <div> absolute bottom-8 right-8 bg-white/90 p-4
        3种标记说明
```

#### 脉冲动画（武汉标记）

```jsx
<div className="absolute -inset-4 bg-gold/20 rounded-full animate-pulse" />
```

Tailwind 内置 `animate-pulse`，不需要额外定义。

#### 地图标记点绝对定位

使用百分比定位来模拟地图坐标：

```jsx
{/* 武汉：相对地图容器的位置 */}
<div className="absolute top-[45%] left-[65%] pointer-events-auto group">
  <div className="relative cursor-pointer">
    <div className="absolute -inset-4 bg-gold/20 rounded-full animate-pulse" />
    <div className="relative size-4 bg-cinnabar rounded-full border-2 border-white" 
         style={{ filter: 'drop-shadow(0 0 6px rgba(184,74,57,0.8))' }} />
    <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-ink shadow-sm border border-rice-deep">
      武汉市
    </div>
  </div>
</div>
```

#### 注意：不实现真实 3D 地图

本阶段不集成 Mapbox / 高德地图等真实地图库。用背景图片 + 绝对定位标记点来模拟视觉效果。  
真实地图集成在后端联调阶段实现。

---

### P6 · 管理后台 `/dashboard`

**设计稿**：`docs/UI设计参考/04_admin/code.html`  
**文件**：`src/app/dashboard/page.tsx`

#### 页面布局结构

```
<body> min-h-screen bg-[#f8f8f6]
  <header> sticky top-0
    Logo（account_balance 图标）+ 2026年度管理后台
    导航：仪表盘 / 内容管理 / 用户分析 / 系统设置
    右侧：搜索框 + 通知铃铛 + 用户头像
  
  <main> max-w-[1200px] mx-auto p-10 space-y-8
    <!-- 页面标题 -->
    <div>
      h1: 2026年度数据概览
      副标题（text-slate-500）
    
    <!-- KPI 卡片组（3列） -->
    <div> grid grid-cols-3 gap-6
      卡片1：总模式数量 12,840 (+12.5%)
      卡片2：累计用户数 85,600 (+8.2%)
      卡片3：AI调用次数 1.2M (+24.0%)
    
    <!-- 图表区（2:1 布局） -->
    <div> grid grid-cols-3 gap-6
      <!-- 左：面积折线图（col-span-2） -->
      <div> col-span-2 bg-white rounded-xl p-6
        标题：2026年内容增长趋势
        大数字 + 增长率
        SVG 面积图（手写路径）
        月份 x 轴标签
      
      <!-- 右：区域分布进度条 -->
      <div> bg-white rounded-xl p-6
        标题：区域模式分布
        4个地区进度条（华东42% 华北28% 华南18% 西部12%）
        提示信息卡片
    
    <!-- 最近活动数据表 -->
    <div> bg-white rounded-xl overflow-hidden border
      表头 + 3行数据（模式名称 / 类别 / 状态 / 更新日期）
      状态徽章：活跃（绿色）/ 处理中（琥珀色）
  
  <footer> border-t text-center text-sm text-slate-400
```

#### KPI 卡片

```jsx
<div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-[#f3f0e8] shadow-sm hover:shadow-md transition-shadow">
  <div className="flex justify-between items-start">
    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">总模式数量</p>
    <span className="material-symbols-outlined text-cinnabar/60">schema</span>
  </div>
  <p className="text-3xl font-bold tabular-nums">12,840</p>
  <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
    <span className="material-symbols-outlined text-sm">trending_up</span>
    <span>+12.5%</span>
    <span className="text-slate-400 font-normal ml-1">较上月</span>
  </div>
</div>
```

#### SVG 折线图

直接复制设计稿中的 SVG 代码（已有完整的 path 和渐变定义），不需要使用图表库：

```jsx
<svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-red" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stopColor="#b34d4d" stopOpacity="0.3" />
      <stop offset="100%" stopColor="#b34d4d" stopOpacity="0" />
    </linearGradient>
  </defs>
  <path d="M0,150 Q100,140 200,100 T400,80 T600,120 T800,40 T1000,20 V200 H0 Z" fill="url(#gradient-red)" />
  <path d="M0,150 Q100,140 200,100 T400,80 T600,120 T800,40 T1000,20" fill="none" stroke="#b34d4d" strokeWidth="3" strokeLinecap="round" />
</svg>
```

#### 状态徽章

```jsx
{/* 活跃 */}
<span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">活跃</span>
{/* 处理中 */}
<span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">处理中</span>
```

---

## 8. Mock 数据规范

### 8.1 文件位置

```
src/app/_mock/
  patterns.ts     // 纹案数据
  regions.ts      // 地区数据（地图页用）
  stats.ts        // 后台统计数据
```

### 8.2 纹案 Mock 数据结构

```typescript
// src/app/_mock/patterns.ts

export interface MockPattern {
  id: string
  name: string                // 中文名称
  nameEn?: string             // 英文名称（详情页用）
  era: string                 // 所属时期：如"楚文化" "汉代" "唐代"
  region: string              // 所属地区：如"湖北省博物馆 · 楚文化"
  technique: string           // 工艺类别
  description: string         // 简短描述
  isAiGenerated: boolean      // 是否 AI 生成
  aspectRatio: string         // 瀑布流中的宽高比，如 "3/4" "1/1" "4/5"
  colorPalette: string[]      // 主色调 HEX 值数组
  imagePlaceholderColor: string // 占位色块颜色
}

export const mockPatterns: MockPattern[] = [
  {
    id: '1',
    name: '战国凤鸟纹',
    era: '楚文化',
    region: '湖北省博物馆 · 楚文化',
    technique: '丝绣',
    description: '以凤凰翱翔于盛开的牡丹花丛为主题...',
    isAiGenerated: true,
    aspectRatio: '3/4',
    colorPalette: ['#d2ae1e', '#a63d33', '#e8e4d9'],
    imagePlaceholderColor: '#2a1f0e',
  },
  {
    id: '2',
    name: '西兰卡普几何纹',
    era: '近现代',
    region: '恩施土家族 · 织锦',
    technique: '织锦',
    description: '西兰卡普是土家族传统织锦工艺...',
    isAiGenerated: false,
    aspectRatio: '1/1',
    colorPalette: ['#1e3a8a', '#ffffff', '#d2ae1e'],
    imagePlaceholderColor: '#1e3a8a',
  },
  // ... 共 6 条，aspectRatio 各不相同
]
```

### 8.3 地区 Mock 数据（地图页）

```typescript
// src/app/_mock/regions.ts

export interface MockRegion {
  id: string
  name: string
  namePinyin: string
  positionTop: string   // CSS top 百分比（相对地图容器）
  positionLeft: string  // CSS left 百分比
  isHighlighted: boolean // 是否为重点城市（武汉）
  stats: {
    ichProjects: number      // 国家级非遗项目数
    inheritors: number       // 省级代表传承人数
    featuredProjects: string[] // 重点推荐项目
  }
}
```

---

## 9. 实现顺序建议

### 推荐顺序（由简到难，最终效果最佳）

```
阶段 1（基础工作）
  1. 在 globals.css 添加 Material Symbols 字体 + 新增工具类
  2. 创建 src/app/_mock/patterns.ts 等 mock 数据文件
  3. 创建 src/components/layout/SiteHeader.tsx

阶段 2（内容展示类页面，难度低）
  4. P6 管理后台 /dashboard — 纯静态展示，无交互
  5. P1 画廊 /gallery — 主要是布局+列表渲染
  6. P2 详情页 /gallery/[id] — 需要新建目录

阶段 3（交互类页面，难度中）
  7. P5 3D 地图 /map — 绝对定位标记点
  8. P3 AI 创作中心 /create — Tab 交互 + 特殊 3 栏布局
  9. P4 跨界工坊 /workshop — 玻璃拟态 + 胶囊 Tab

阶段 4（首页，无设计稿）
  10. 首页 / — 可根据功能文档中的描述自由设计，风格与其他页面一致
```

---

## 10. 验收标准

每个页面实现完成后，用以下标准验收：

### 10.1 视觉对比

- 打开 `docs/UI设计参考/[页面]/screen.png` 截图
- 在浏览器中访问对应路由
- 对比布局、颜色、字体、间距是否一致

### 10.2 技术指标

- [ ] `tsc --noEmit` 零错误
- [ ] `next build` 可以成功编译
- [ ] 浏览器控制台无 React 报错
- [ ] 页面在 1440px 宽度下正常展示（设计稿针对桌面端）
- [ ] 页面在 768px 宽度下有基本可用的响应式（移动端适配不是本阶段重点）

### 10.3 功能指标（本阶段为静态，所有交互是"假"的）

- [ ] Tab 切换有视觉反馈（className 变化）
- [ ] 卡片有 hover 效果
- [ ] 滑块可以拖动（原生 `<input type="range">`，只是视觉，不影响预览）
- [ ] 按钮有 hover/active 状态
- [ ] 导航链接不报 404 错误（可以全部指向 `href="#"`）

---

## 附录：常见陷阱与解决方案

### 陷阱 1：`tailwind.config.js` 中的颜色无法使用

**原因**：Tailwind v4 不再读取 `tailwind.config.js` 中的 `theme.extend.colors`  
**解决**：在 `globals.css` 的 `@theme` 块中添加颜色变量

### 陷阱 2：图片 `<Image>` 报 hostname 错误

**原因**：Next.js `<Image>` 要求外部图片域名在 `next.config.ts` 中预先声明  
**解决**：本阶段改用 `<img>` 标签，或使用占位色块 `<div className="bg-rice-warm" />`

### 陷阱 3：`motion/react` 和 `framer-motion` 混淆

**原因**：包已经改名  
**解决**：只使用 `import { motion } from "motion/react"`

### 陷阱 4：`use client` 的位置

**原因**：Next.js 16.2 App Router 中，服务端组件和客户端组件的边界很重要  
**解决**：  
- 需要 `useState`、`useEffect`、浏览器 API 的组件：文件顶部写 `'use client'`  
- 纯展示组件（无交互）：不写，默认为服务端组件

### 陷阱 5：CSS columns 瀑布流的 `break-inside`

**原因**：`break-inside: avoid` 必须在每个卡片上单独设置，而不是容器  
**解决**：确保 `.masonry-item` 类在每个卡片 div 上

### 陷阱 6：SVG 属性名在 JSX 中不同

**原因**：JSX 使用 camelCase，HTML 使用 kebab-case  
**解决**：`preserveaspectratio` → `preserveAspectRatio`，`viewbox` → `viewBox`，`stopcolor` → `stopColor` 等

---

*本指南基于对 `docs/UI设计参考/` 全部 6 个 HTML 文件、`docs/湖北纹案文化展示平台 — 网站功能介绍.md`、`docs/湖北纹案-具体技术架构规划.md` 及当前 `src/` 目录完整分析生成。*  
*如发现与实际代码不符之处，以当前文件系统内容为准。*
