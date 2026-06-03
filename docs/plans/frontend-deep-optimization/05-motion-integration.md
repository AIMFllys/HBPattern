# 专项: Motion 动效系统集成 ✨

> **会话编号**: 3/8  
> **预计时长**: 4小时  
> **依赖**: Phase 0 完成  
> **优先级**: ⭐⭐⭐⭐

---

## 🎯 本次会话目标

全面启用 `motion@12` (原 Framer Motion)，建立三级动效系统。

### 具体目标
1. **Level 1 - 微交互**: 卡片hover、按钮反馈、表单交互
2. **Level 2 - 页面切换**: 路由过渡动画
3. **Level 3 - 滚动揭示**: 元素进入视口时淡入

---

## 📋 上下文信息

### 当前状态
- ✅ `motion@^12` 已安装
- ✅ `src/lib/motion.ts` 已封装
- ✅ `src/app/(main)/template.tsx` 已存在（页面切换容器）
- ⚠️ 当前零使用！

### Motion v12 关键变化
- 导入路径: `motion/react` (不再是 `framer-motion`)
- Spring 默认值更优化
- 性能提升 30%

---

## ✅ 验收标准

### Level 1 - 微交互
- [ ] 纹案卡片 hover 浮起 + 阴影增强
- [ ] 按钮 hover 上移 + 阴影
- [ ] 按钮 active 下压反馈
- [ ] 筛选 checkbox 勾选动画
- [ ] 滑块拖动有惯性

### Level 2 - 页面切换
- [ ] 页面切换有淡入淡出
- [ ] 持续时间 300ms
- [ ] 使用 ease-out 曲线

### Level 3 - 滚动揭示
- [ ] 首页精选纹案逐个淡入（stagger 50ms）
- [ ] 画廊卡片进入视口时淡入
- [ ] 详情页演化时间线渐进显示

---

## 🔧 实施步骤

### 步骤 1: 配置 Motion Provider（可选）

**文件**: `src/app/layout.tsx`

检查是否需要全局配置（通常不需要）

---

### 步骤 2: Level 1 - 纹案卡片微交互

**文件**: `src/components/pattern/PatternCard.tsx`（或在使用位置）

**修改**:
```tsx
import { motion } from 'motion/react'

export function PatternCard({ pattern }) {
  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow: 'var(--shadow-hover)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className="card cursor-pointer"
    >
      {/* 卡片内容 */}
    </motion.div>
  )
}
```

---

### 步骤 3: Level 1 - 按钮微交互

**文件**: `src/app/globals.css`

**增强**:
```css
/* 将 .btn-primary 改为支持 Motion */
.btn-primary {
  /* 移除 transition 和 transform */
  /* 让 Motion 接管动画 */
}
```

**使用位置**: 任何使用 `.btn-primary` 的地方

**修改**:
```tsx
import { motion } from 'motion/react'

<motion.button
  whileHover={{ y: -2 }}
  whileTap={{ scale: 0.95 }}
  className="btn-primary"
>
  点击我
</motion.button>
```

---

### 步骤 4: Level 2 - 页面切换动画

**文件**: `src/app/(main)/template.tsx`（已存在！）

**修改**:
```tsx
'use client'

import { motion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
```

---

### 步骤 5: Level 3 - 滚动揭示动画

**创建 Hook**: `src/hooks/useScrollReveal.ts`

```tsx
import { useInView } from 'motion/react'
import { useRef } from 'react'

export function useScrollReveal(options = {}) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    margin: '-50px',
    ...options,
  })
  
  return { ref, isInView }
}
```

**使用示例**: `src/app/(main)/page.tsx` - 首页精选纹案

```tsx
import { motion } from 'motion/react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export function FeaturedPatterns({ patterns }) {
  const { ref, isInView } = useScrollReveal()
  
  return (
    <div ref={ref} className="grid grid-cols-3 gap-6">
      {patterns.map((pattern, i) => (
        <motion.div
          key={pattern.id}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.4,
            delay: i * 0.05, // stagger 效果
          }}
        >
          <PatternCard pattern={pattern} />
        </motion.div>
      ))}
    </div>
  )
}
```

---

## 📁 涉及文件清单

### 需要修改
- ✏️ `src/app/(main)/template.tsx` - 页面切换
- ✏️ `src/app/(main)/page.tsx` - 首页滚动揭示
- ✏️ `src/components/gallery/GalleryClient.tsx` - 卡片滚动揭示
- ✏️ `src/app/globals.css` - 移除冲突的 transition

### 需要创建
- 📄 `src/hooks/useScrollReveal.ts` - 滚动揭示 Hook

---

## 🧪 验证方法

```bash
# 手动验证清单

# 1. 测试卡片 hover
# 访问画廊页，鼠标悬停在纹案卡片上
# 预期: 卡片平滑上浮，阴影增强

# 2. 测试页面切换
# 点击导航在不同页面间切换
# 预期: 页面淡入淡出，流畅过渡

# 3. 测试滚动揭示
# 访问首页，缓慢向下滚动
# 预期: 精选纹案逐个淡入，有 stagger 效果
```

---

## ⚠️ 注意事项

- Motion 组件必须在 Client Component 中使用
- 性能敏感区域（如画廊 100+ 卡片）谨慎使用动画
- 尊重 `prefers-reduced-motion`（Motion 自动处理）

---

## 🎉 完成标志

- [x] 卡片 hover 动效流畅
- [x] 页面切换有过渡
- [x] 滚动揭示正常
- [x] 无性能问题

**完成后** → 继续 `03-phase2-visual-depth.md` 🎨
