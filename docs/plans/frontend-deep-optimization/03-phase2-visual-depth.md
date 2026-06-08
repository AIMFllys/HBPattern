# Phase 2: 视觉深化 🎨

> **会话编号**: 4/8  
> **预计时长**: 6小时  
> **依赖**: Phase 1 + Motion 集成完成  
> **优先级**: ⭐⭐⭐⭐

---

## 🎯 本次会话目标

提升视觉冲击力和文化沉浸感，创造"峰值体验"时刻。

### 具体目标
1. 深色模式支持（文化平台的夜间浏览场景）
2. 首页 Hero 升级（next/image + 视差效果）
3. 纹样详情页"峰值体验"设计
4. Skeleton Loading 覆盖

---

## 📋 上下文信息

### 设计理念
基于 UX Psychology 的 **Peak-End Rule**：
- 用户记住的是体验的峰值和结尾
- 需要在关键页面创造"Wow moment"

### 当前设计系统
- 主色：朱砂红 `--color-cinnabar: #b84a39`
- 强调色：烫金 `--color-gold: #c9a84c`
- 背景：宣纸米 `--color-rice: #f5f0e8`

---

## ✅ 验收标准

### 深色模式
- [ ] 全局深色模式切换按钮（Header）
- [ ] 所有页面适配深色模式
- [ ] 深色模式使用 `--color-ink-night` 等新 token
- [ ] localStorage 记住用户选择

### 首页 Hero
- [ ] 使用 next/image（自动 WebP、懒加载）
- [ ] Hero 区域有视差滚动效果
- [ ] 标题有打字机动画（可选）
- [ ] CTA 按钮有微光效果

### 纹样详情页
- [ ] 全屏高清纹样图作为峰值
- [ ] 自动提取的色彩色板展示
- [ ] 演化时间线有动画
- [ ] 相关纹案区域有视觉层次

### Skeleton
- [ ] 画廊页有 Skeleton
- [ ] 详情页有 Skeleton
- [ ] Skeleton 样式符合设计系统

---

## 🔧 实施步骤

### 步骤 1: 扩展设计令牌（深色模式）

**文件**: `src/app/globals.css`

**在 @theme 块中添加**:
```css
@theme inline {
  /* 现有 token... */
  
  /* ✅ 深色模式 token */
  --color-ink-night:     #f5f0e8;  /* 深色模式下的文字（米色） */
  --color-rice-night:    #12110d;  /* 深色模式下的背景（深墨） */
  --color-cinnabar-glow: rgba(184, 74, 57, 0.4);
  
  /* z-index 层级规范 */
  --z-base:    0;
  --z-content: 10;
  --z-sticky:  100;
  --z-overlay: 200;
  --z-modal:   300;
  --z-toast:   400;
}
```

**添加深色模式变体**:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: var(--color-rice-night);
    --foreground: var(--color-ink-night);
  }
}

[data-theme="dark"] {
  --background: var(--color-rice-night);
  --foreground: var(--color-ink-night);
}
```

---

### 步骤 2: 深色模式切换组件

**文件**: `src/components/layout/ThemeToggle.tsx`（新建）

```tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark'
    if (stored) {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    }
  }, [])
  
  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }
  
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="p-2 rounded-lg hover:bg-rice-deep dark:hover:bg-ink-medium"
      aria-label="切换主题"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </motion.button>
  )
}
```

**集成到 Header**: `src/components/layout/SiteHeader.tsx`

---

### 步骤 3: 首页 Hero 升级

**文件**: `src/app/(main)/page.tsx`

**替换当前的 div 背景图为**:
```tsx
import Image from 'next/image'
import { motion } from 'motion/react'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* ✅ 背景图片（视差效果） */}
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0"
        >
          <Image
            src="/images/hero-pattern.jpg"
            alt="湖北传统纹案"
            fill
            priority
            className="object-cover"
            quality={90}
          />
        </motion.div>
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-rice" />
        
        {/* 内容 */}
        <div className="relative container h-full flex flex-col justify-center items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-7xl font-serif text-ink mb-6"
          >
            湖北纹案
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl text-ink-medium mb-12 max-w-2xl"
          >
            传承荆楚文化，展示传统纹绣之美
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <button className="btn-primary text-lg px-8 py-4">
              探索纹案
            </button>
          </motion.div>
        </div>
      </section>
    </>
  )
}
```

---

### 步骤 4: 纹样详情页峰值体验

**文件**: `src/app/(main)/gallery/[id]/page.tsx`

**重构为三段式布局**:
```tsx
export default async function PatternDetailPage({ params }) {
  const { id } = await params
  const pattern = await getPattern(id)
  
  return (
    <div>
      {/* 段落 1: 全屏峰值 Hero */}
      <section className="h-screen relative">
        <Image
          src={pattern.imageUrl}
          alt={pattern.name}
          fill
          className="object-contain"
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-ink/80 to-transparent">
          <h1 className="text-6xl font-serif text-rice">{pattern.name}</h1>
        </div>
      </section>
      
      {/* 段落 2: 色彩色板 + 文字叙事 */}
      <section className="container py-20">
        <ColorPalette colors={pattern.colorPalette} />
        <article className="prose prose-lg mt-12">
          {pattern.description}
        </article>
      </section>
      
      {/* 段落 3: 演化时间线（动画） */}
      <section className="container py-20">
        <AnimatedTimeline relations={pattern.relations} />
      </section>
      
      {/* 段落 4: 相关纹案 */}
      <section className="container py-20">
        <RelatedPatterns patternId={id} />
      </section>
    </div>
  )
}
```

**新建组件**: `src/components/pattern/ColorPalette.tsx`

```tsx
import { motion } from 'motion/react'

export function ColorPalette({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-4">
      {colors.map((color, i) => (
        <motion.div
          key={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="w-20 h-20 rounded-lg shadow-card"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
```

---

### 步骤 5: Skeleton Loading

**文件**: `src/app/(main)/gallery/loading.tsx`

```tsx
export default function GalleryLoading() {
  return (
    <div className="container py-12">
      <div className="masonry-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="masonry-item">
            <div className="card animate-pulse">
              <div className="aspect-[3/4] bg-rice-deep rounded-lg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-rice-deep rounded w-3/4" />
                <div className="h-3 bg-rice-deep rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 📁 涉及文件清单

### 需要修改
- ✏️ `src/app/globals.css` - 深色模式 token
- ✏️ `src/app/(main)/page.tsx` - Hero 升级
- ✏️ `src/app/(main)/gallery/[id]/page.tsx` - 峰值体验
- ✏️ `src/components/layout/SiteHeader.tsx` - 添加主题切换

### 需要创建
- 📄 `src/components/layout/ThemeToggle.tsx`
- 📄 `src/components/pattern/ColorPalette.tsx`
- 📄 `src/components/pattern/AnimatedTimeline.tsx`
- 📄 `src/app/(main)/gallery/loading.tsx`

---

## 🧪 验证方法

```bash
# 1. 测试深色模式
# 点击 Header 的主题切换按钮
# 预期: 页面颜色切换，localStorage 记住选择

# 2. 测试 Hero 视差
# 访问首页，缓慢滚动
# 预期: 背景图有微妙的缩放动画

# 3. 测试详情页峰值
# 访问任意纹案详情
# 预期: 全屏高清图冲击力强，色板有动画

# 4. 测试 Skeleton
# 关闭网络，访问画廊页
# 预期: 显示骨架屏
```

---

## 🎉 完成标志

- [x] 深色模式完整支持
- [x] 首页 Hero 有视觉冲击力
- [x] 详情页有峰值体验
- [x] Skeleton 完整覆盖

**完成后** → 继续 `06-mobile-responsive.md` 📱
