# Phase 0：技术债清理与基础完善

> **周期**: ~1 天（6-8 小时）
> **前置条件**: 无
> **产出**: 一个无 Bug、组件复用良好、移动端可用的前端基线

---

## Goal

清理 4 个 Critical Bug，抽取重复组件，补全缺失页面（登录/错误态），使前端达到"干净基线"状态，为后续数据化做准备。

## Applied Skills

| Skill | 应用点 |
|-------|--------|
| `clean-code` | SRP 原则抽取组件，DRY 消除 Footer 重复，Guard Clauses 处理边界 |
| `frontend-design` | 登录页遵循 UX 心理学（Hick's Law 限制选项），"米色书香"视觉一致性 |
| `plan-writing` | 每个任务 2-5 分钟，明确验证标准 |

---

## Tasks

### 0.1 修复 Critical Bugs

- [ ] **gallery/[id]/page.tsx**: `const { id } = await params` + `mockPatterns.find(p => p.id === id)` → 验证: 访问 `/gallery/pattern-1` 显示正确纹样
- [ ] **gallery/page.tsx:77**: `aspect-[${pattern.aspectRatio}]` 改为 `style={{ aspectRatio: pattern.aspectRatio }}` → 验证: 画廊卡片高度各异
- [ ] **map/page.tsx:9**: `min-screen` → `min-h-screen` → 验证: 地图页占满视口
- [ ] **SiteHeader.tsx**: `text-${primaryColor}` 动态类改为条件对象或 `data-theme` 属性 → 验证: Header 颜色在所有页面正确

### 0.2 抽取 SiteFooter 共享组件

```
新建: src/components/layout/SiteFooter.tsx

Props:
  variant: 'light' | 'dark'  // 米色背景 or 深色背景

结构:
  - 品牌信息列（Logo + 简介 + 社交链接）
  - 快速链接列（画廊/地图/创作/工坊）
  - 合作支持列（高校/博物馆/非遗中心）
  - 联系方式列（邮箱/地址）
  - 底部版权行

替换:
  - src/app/page.tsx 内联 Footer → <SiteFooter variant="light" />
  - src/app/gallery/page.tsx 内联 Footer → <SiteFooter variant="light" />
  - src/app/gallery/[id]/page.tsx 内联 Footer → <SiteFooter variant="dark" />
```

→ 验证: 3 个页面 Footer 视觉一致，代码不再重复

### 0.3 抽取 Create/Workshop 共享组件

```
新建: src/components/ui/ParameterSlider.tsx
  Props: label, value, onChange, min, max, unit
  样式: 朱砂红 thumb，带数值显示

新建: src/components/ui/AssetGrid.tsx
  Props: items[], activeCategory, onCategoryChange, onSelect
  样式: 2列网格 + 分类 Tab

替换:
  - src/app/create/page.tsx 中 3 个内联滑块 → <ParameterSlider />
  - src/app/create/page.tsx 中素材网格 → <AssetGrid />
  - src/app/workshop/page.tsx 同理替换
```

→ 验证: create 和 workshop 页面功能不变，代码量各减少 ~40 行

### 0.4 登录页 UI

```
重写: src/app/login/page.tsx

'use client'

布局（米色书香风格）:
  ┌─────────────────────────────────────────┐
  │        bg-rice 全页居中               │
  │                                         │
  │   ┌───────────────────────────────┐     │
  │   │  [纹样装饰图案背景]             │     │
  │   │                               │     │
  │   │  ── 湖北纹案文化展示平台 ──     │     │
  │   │  "探索千年纹饰之美"             │     │
  │   │                               │     │
  │   │  [GitHub 登录] btn-primary     │     │
  │   │  [Google 登录] btn-ghost       │     │
  │   │                               │     │
  │   │  ── 或使用邮箱 ──              │     │
  │   │  [邮箱输入框]                   │     │
  │   │  [密码输入框]                   │     │
  │   │  [登录] btn-primary full-width │     │
  │   │                               │     │
  │   │  还没有账号？注册               │     │
  │   └───────────────────────────────┘     │
  └─────────────────────────────────────────┘

技术要点:
  import { createBrowserClient } from '@/lib/supabase/client'
  const supabase = createBrowserClient()
  supabase.auth.signInWithOAuth({ provider: 'github' })
  supabase.auth.signInWithPassword({ email, password })
  登录成功 → router.push('/') 或 searchParams.get('next')
```

→ 验证: 点击 GitHub 登录 → 跳转 GitHub OAuth → 回调 → 回到首页

### 0.5 移动端 SiteHeader 汉堡菜单

```
修改: src/components/layout/SiteHeader.tsx

添加:
  - md:hidden 汉堡图标按钮（三横线 → X 切换）
  - 移动端侧边抽屉导航（Motion animate 滑入）
  - 导航链接列表（竖排）
  - 点击链接或外部区域关闭
  - 背景遮罩 bg-ink/50

import { motion, AnimatePresence } from "motion/react"
// 首次实际使用 Motion 库
```

→ 验证: 手机宽度下显示汉堡菜单，点击展开导航

### 0.6 错误/加载态页面

```
新建: src/app/loading.tsx
  - 全局加载骨架屏
  - 朱砂红旋转纹样图案 loading 动画

新建: src/app/error.tsx ('use client')
  - "出了点问题" 友好提示
  - 重试按钮
  - 返回首页链接

新建: src/app/not-found.tsx
  - "页面不存在" 404
  - 米色书香风格设计
  - 推荐链接（画廊/首页）

新建: src/app/gallery/[id]/not-found.tsx
  - "纹样不存在" 专属 404
```

→ 验证: 访问 `/nonexistent` 显示 404 页面；`npm run dev` 时有加载态

### 0.7 Icon 组件修复

```
修改: src/components/icons/Icon.tsx

- 修正 smart_toy 等图标 SVG path
- 添加 fallback: 未找到时渲染名称文字而非 null
- 将 iconComponents 移到组件外部（避免每次渲染重建对象）
```

→ 验证: `<Icon name="smart_toy" />` 渲染正确图标

---

## Done When

- [ ] `npm run dev` 无控制台错误
- [ ] 所有 7 个现有页面正常显示
- [ ] 登录页可执行 OAuth 登录
- [ ] 移动端 (375px) 所有页面可浏览
- [ ] Footer 使用共享组件，无代码重复
- [ ] `/nonexistent` 显示 404 页面
