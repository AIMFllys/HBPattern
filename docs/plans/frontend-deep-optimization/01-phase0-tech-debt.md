# Phase 0: 技术债清理 🔧

> **会话编号**: 1/8  
> **预计时长**: 2小时  
> **依赖**: 无（可立即执行）  
> **优先级**: ⭐⭐⭐⭐⭐ CRITICAL

---

## 🎯 本次会话目标

清除所有阻塞功能的 Critical Bug，为后续所有工作建立稳定基础。

### 具体目标
1. 修复 4 个 Critical Bug
2. 抽取 3 个重复的共享组件
3. 记录技术决策（认证方案、数据库方案）
4. 补充缺失的错误处理页面

---

## 📋 上下文信息

### 项目背景
- **项目**: 湖北纹案文化展示平台（HBPattern）
- **技术栈**: Next.js 16.2.1 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4
- **设计系统**: 朱砂红 + 烫金 + 宣纸米（中国美学）
- **当前状态**: UI 壳体完成 65%，但存在多个 Critical Bug 阻塞功能

### 已知问题
根据代码审查，发现以下 Critical 级别问题：

| # | 文件 | 问题 | 影响 |
|---|------|------|------|
| 1 | `src/app/(main)/gallery/[id]/page.tsx` | `params` 未 await，硬编码 `mockPatterns[0]` | 详情页永远显示第一个纹案 |
| 2 | `src/components/gallery/GalleryClient.tsx` | 动态 `aspect-[${ratio}]` 类被 Tailwind purge | 纹案卡片宽高比失效 |
| 3 | `src/app/(main)/map/page.tsx` | `min-screen` typo | 地图页布局错误 |
| 4 | `src/components/icons/Icon.tsx` | `smart_toy` 等图标 SVG path 错误 | 图标显示错误 |

### 重复代码
- Footer 在 3 个页面中重复（~38行 × 3）
- ParameterSlider 在 create + workshop 重复
- AssetPanel 结构在 create + workshop 重复

---

## ✅ 验收标准

### Bug 修复验收
- [ ] 纹样详情页可以正确显示任意 id 的纹案（不再是硬编码第一个）
- [ ] 画廊页纹案卡片宽高比正确显示（测试 `aspectRatio: "3/4"`, `"16/9"`, `"1/1"` 均正常）
- [ ] 地图页布局正常（`min-h-screen` 生效）
- [ ] Icon 组件所有图标显示正确（手动测试 `smart_toy`, `person` 等）

### 组件抽取验收
- [ ] 3 个页面使用同一个 `<SiteFooter>` 组件
- [ ] `<SiteFooter>` 支持 `variant="light" | "dark"` prop
- [ ] create + workshop 使用同一个 `<ParameterSlider>` 组件（已存在于 `src/components/ui/ParameterSlider.tsx`，需检查是否正在使用）

### 错误处理验收
- [ ] `src/app/error.tsx` 有完整的错误 UI
- [ ] `src/app/not-found.tsx` 有 404 页面
- [ ] `src/app/(main)/loading.tsx` 有 loading 骨架屏

---

## 🔧 实施步骤

### 步骤 1: 修复纹样详情页动态路由（Bug #1）

**文件**: `src/app/(main)/gallery/[id]/page.tsx`

**问题诊断**:
```tsx
// 当前代码（错误）
export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ id: string }>  // ❌ 定义为 Promise 但未 await
}) {
  const pattern = mockPatterns[0]  // ❌ 硬编码第一个
```

**修复方案**:
```tsx
export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // ✅ 1. await params
  const { id } = await params
  
  // ✅ 2. 根据 id 查找纹案
  const pattern = mockPatterns.find(p => p.id === id)
  
  // ✅ 3. 处理未找到的情况
  if (!pattern) {
    notFound()  // 触发 not-found.tsx
  }
  
  // ... 其余代码
}
```

**验证方法**:
```bash
# 访问不同 id 的详情页，应显示不同内容
http://localhost:6427/gallery/pattern-1
http://localhost:6427/gallery/pattern-2
http://localhost:6427/gallery/invalid-id  # 应显示 404
```

---

### 步骤 2: 修复纹案卡片宽高比（Bug #2）

**文件**: `src/components/gallery/GalleryClient.tsx`

**问题诊断**:
```tsx
// 当前代码（错误）
<div className={`aspect-[${pattern.aspectRatio}]`}>
  {/* Tailwind v4 Oxide 无法扫描动态类名 */}
</div>
```

**修复方案**:
```tsx
// ✅ 使用 style 属性代替动态类名
<div style={{ aspectRatio: pattern.aspectRatio }}>
  {/* 原生 CSS 属性，浏览器直接支持 */}
</div>
```

**验证方法**:
```bash
# 在画廊页检查不同宽高比的纹案卡片
# 应看到正确的比例（不是全部都是方形）
```

---

### 步骤 3: 修复地图页 typo（Bug #3）

**文件**: `src/app/(main)/map/page.tsx`

**问题诊断**:
```tsx
// 第 9 行（错误）
<div className="min-screen bg-rice">
  {/* typo: 应该是 min-h-screen */}
</div>
```

**修复方案**:
```tsx
// ✅ 修正为 min-h-screen
<div className="min-h-screen bg-rice">
  {/* ... */}
</div>
```

---

### 步骤 4: 修复 Icon 组件 SVG path（Bug #4）

**文件**: `src/components/icons/Icon.tsx`

**问题诊断**:
- 部分图标的 `name` 与实际 SVG path 不对应
- 例如 `smart_toy` 可能用了 `person` 的 path

**修复方案**:
```tsx
// 审查 iconComponents 对象（约第 20-200 行）
const iconComponents: Record<string, React.FC<{ className?: string }>> = {
  // ✅ 确保每个图标的 SVG path 正确
  smart_toy: ({ className }) => (
    <svg className={className} /* ... */>
      {/* 检查这个 path 是否是机器人图标 */}
      <path d="..." />
    </svg>
  ),
  // ... 其他图标
}
```

**替代方案（推荐）**:
- 项目已安装 `lucide-react`，可以直接替换手写 SVG
- 但这属于重构，不在本次 Phase 0 范围内

---

### 步骤 5: 抽取 SiteFooter 共享组件

**目标**: 消除 3 处重复的 Footer 代码

**创建文件**: `src/components/layout/SiteFooter.tsx`（已存在，检查内容）

**实现方案**:
```tsx
// src/components/layout/SiteFooter.tsx
import { Icon } from '@/components/icons/Icon'

interface SiteFooterProps {
  variant?: 'light' | 'dark'
}

export function SiteFooter({ variant = 'light' }: SiteFooterProps) {
  const isDark = variant === 'dark'
  
  return (
    <footer className={isDark ? 'bg-ink text-rice' : 'bg-rice-warm text-ink'}>
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* 左列：品牌 */}
          <div>
            <h3 className="font-serif text-xl mb-4">湖北纹案</h3>
            <p className="text-sm opacity-80">
              传承荆楚文化，展示传统纹绣之美
            </p>
          </div>
          
          {/* 中列：快速链接 */}
          <div>
            <h4 className="font-semibold mb-4">快速导航</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/gallery">纹案画廊</a></li>
              <li><a href="/map">文化地图</a></li>
              <li><a href="/create">AI 创作</a></li>
            </ul>
          </div>
          
          {/* 右列：联系方式 */}
          <div>
            <h4 className="font-semibold mb-4">关于我们</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about">关于平台</a></li>
              <li><a href="/privacy">隐私政策</a></li>
              <li><a href="/disclaimer">免责声明</a></li>
            </ul>
          </div>
        </div>
        
        {/* 底部版权 */}
        <div className="mt-12 pt-8 border-t border-current/10 text-center text-sm opacity-60">
          <p>© 2026 湖北纹案文化展示平台. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
```

**替换位置**:
1. `src/app/(main)/page.tsx` - 首页 Footer
2. `src/app/(main)/gallery/page.tsx` - 画廊页 Footer
3. `src/app/(main)/gallery/[id]/page.tsx` - 详情页 Footer（使用 `variant="dark"`）

**使用示例**:
```tsx
// 在任何页面底部
import { SiteFooter } from '@/components/layout/SiteFooter'

export default function SomePage() {
  return (
    <>
      {/* 页面内容 */}
      <SiteFooter variant="light" />
    </>
  )
}
```

---

### 步骤 6: 检查 ParameterSlider 使用情况

**文件**: `src/components/ui/ParameterSlider.tsx`（已存在）

**任务**:
1. 确认 create 和 workshop 是否都在使用这个组件
2. 如果没有使用，替换内联 slider 为这个组件

**检查命令**:
```bash
# 搜索 ParameterSlider 的使用
grep -r "ParameterSlider" src/components/create/
grep -r "ParameterSlider" src/components/workshop/

# 搜索内联的 input[type="range"]
grep -r 'type="range"' src/components/create/
grep -r 'type="range"' src/components/workshop/
```

---

### 步骤 7: 补充错误处理页面

#### 7.1 完善 `src/app/error.tsx`

**当前状态**: 文件已存在，检查内容是否完整

**期望内容**:
```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-rice flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-serif text-cinnabar mb-4">出错了</h1>
        <p className="text-ink-medium mb-8">
          {error.message || '页面加载时遇到了问题'}
        </p>
        <button onClick={reset} className="btn-primary">
          重试
        </button>
      </div>
    </div>
  )
}
```

#### 7.2 完善 `src/app/not-found.tsx`

**当前状态**: 文件已存在，检查内容是否完整

**期望内容**:
```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-rice flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-serif text-cinnabar mb-4">404</h1>
        <p className="text-ink-medium mb-8">
          页面不存在或已被移除
        </p>
        <Link href="/" className="btn-primary">
          返回首页
        </Link>
      </div>
    </div>
  )
}
```

#### 7.3 完善 `src/app/(main)/loading.tsx`

**当前状态**: 文件已存在，检查内容

**期望内容**:
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-rice flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-cinnabar border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-ink-medium">加载中...</p>
      </div>
    </div>
  )
}
```

---

### 步骤 8: globals.css 小修复

**文件**: `src/app/globals.css`

#### 8.1 修复 `.seal-tag` 硬编码

**当前**:
```css
.seal-tag {
  border: 1px solid #a63d33;
  color: #a63d33;
  /* ... */
}
```

**修复**:
```css
.seal-tag {
  border: 1px solid var(--color-cinnabar);
  color: var(--color-cinnabar);
  /* ... */
}
```

#### 8.2 补充 Firefox range slider 样式

**当前**: 仅有 `::-webkit-slider-thumb`

**补充**:
```css
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-cinnabar);
  cursor: pointer;
  border-radius: 50%;
}

/* ✅ 添加 Firefox 支持 */
input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-cinnabar);
  cursor: pointer;
  border: none;
  border-radius: 50%;
}
```

---

## 📁 涉及文件清单

### 需要修改的文件
- ✏️ `src/app/(main)/gallery/[id]/page.tsx` - 修复动态路由
- ✏️ `src/components/gallery/GalleryClient.tsx` - 修复 aspect ratio
- ✏️ `src/app/(main)/map/page.tsx` - 修复 typo
- ✏️ `src/components/icons/Icon.tsx` - 修复 SVG path（可选）
- ✏️ `src/app/globals.css` - 2处小修复
- ✏️ `src/app/(main)/page.tsx` - 替换为 SiteFooter
- ✏️ `src/app/(main)/gallery/page.tsx` - 替换为 SiteFooter
- ✏️ `src/app/(main)/gallery/[id]/page.tsx` - 替换为 SiteFooter

### 需要检查的文件
- 🔍 `src/components/layout/SiteFooter.tsx` - 检查是否存在及内容
- 🔍 `src/components/ui/ParameterSlider.tsx` - 检查使用情况
- 🔍 `src/app/error.tsx` - 检查内容是否完整
- 🔍 `src/app/not-found.tsx` - 检查内容是否完整
- 🔍 `src/app/(main)/loading.tsx` - 检查内容是否完整

---

## 🧪 验证方法

### 自动化验证
```bash
# 1. 类型检查
npm run build

# 2. Lint 检查
npm run lint

# 3. 测试（如果有）
npm run test
```

### 手动验证清单
```bash
# 启动开发服务器
npm run dev

# 1. 测试详情页动态路由
# 打开: http://localhost:6427/gallery/pattern-1
# 预期: 显示 pattern-1 的内容
# 打开: http://localhost:6427/gallery/pattern-2
# 预期: 显示 pattern-2 的内容
# 打开: http://localhost:6427/gallery/invalid
# 预期: 显示 404 页面

# 2. 测试画廊页宽高比
# 打开: http://localhost:6427/gallery
# 预期: 不同纹案卡片有不同的宽高比（不全是方形）

# 3. 测试地图页布局
# 打开: http://localhost:6427/map
# 预期: 页面高度填满整个屏幕（min-h-screen 生效）

# 4. 测试 Footer 统一性
# 访问首页、画廊、详情页
# 预期: Footer 样式一致（除了详情页是深色）

# 5. 测试错误页面
# 打开不存在的路径: http://localhost:6427/nonexistent
# 预期: 显示 404 页面
```

---

## ⚠️ 注意事项

### 潜在问题与解决方案

**问题 1**: 详情页修改后 TypeScript 报错
```
Solution: 确保导入 notFound
import { notFound } from 'next/navigation'
```

**问题 2**: Footer 组件导入路径错误
```
Solution: 使用 @ alias
import { SiteFooter } from '@/components/layout/SiteFooter'
```

**问题 3**: aspect ratio 在旧浏览器不支持
```
Solution: 现代浏览器均支持，如需兼容可添加 @supports 检测
```

### 不要做的事情
- ❌ 不要修改设计令牌（globals.css 中的 @theme）
- ❌ 不要重构 Icon 组件为 lucide-react（留到后续会话）
- ❌ 不要修改任何 Mock 数据（留到 Phase 1）
- ❌ 不要添加新功能（本次仅修 Bug）

---

## 📊 完成后的状态

### 修复前
```
Critical Bug: 4 个
组件重复: 3 处
错误处理: 不完整
代码质量: ⭐⭐
```

### 修复后
```
Critical Bug: 0 个 ✅
组件重复: 0 处 ✅
错误处理: 完整 ✅
代码质量: ⭐⭐⭐⭐
```

---

## 🎉 完成标志

当以下所有验收标准都通过时，Phase 0 完成：

- [x] 4 个 Critical Bug 全部修复
- [x] SiteFooter 组件抽取完成
- [x] 错误处理页面补充完整
- [x] globals.css 小修复完成
- [x] `npm run build` 无报错
- [x] `npm run lint` 无警告
- [x] 手动验证清单全部通过

**完成后** → 继续 `02-phase1-data-flow.md` 🚀
