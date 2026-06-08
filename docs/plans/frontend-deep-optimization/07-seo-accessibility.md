# 专项: SEO 与可访问性 🔍

> **会话编号**: 6/8  
> **预计时长**: 4小时  
> **依赖**: Phase 1 完成  
> **优先级**: ⭐⭐⭐⭐

---

## 🎯 本次会话目标

确保 SEO 友好 + WCAG AA 可访问性达标。

### 具体目标
1. 所有页面有独立 `generateMetadata`
2. 结构化数据（Schema.org）
3. 所有图片有 `alt`
4. 所有按钮有 `aria-label`
5. 色彩对比度 ≥ 4.5:1
6. 键盘导航完整支持

---

## ✅ 验收标准

### SEO
- [ ] 每个页面有独立的 `title` 和 `description`
- [ ] 纹样详情页有 Open Graph 图片
- [ ] 首页有 JSON-LD 结构化数据
- [ ] 所有图片有 `alt` 属性
- [ ] robots.txt 和 sitemap.xml 存在

### 可访问性
- [ ] 所有图标按钮有 `aria-label`
- [ ] 筛选 checkbox 用 `<fieldset>` 分组
- [ ] 色彩对比度通过 WCAG AA
- [ ] 键盘可以操作所有交互
- [ ] Skip to content 链接

---

## 🔧 实施步骤

### 步骤 1: 补全页面 Metadata

#### 首页
**文件**: `src/app/(main)/page.tsx`

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '湖北纹案 - 传承荆楚文化展示传统纹绣之美',
  description: '湖北纹案文化展示平台，数字化展示湖北传统纹绣艺术，包含纹案画廊、3D文化地图、AI创作中心等功能',
  keywords: ['湖北纹案', '传统纹绣', '荆楚文化', '非遗', '文化遗产'],
  openGraph: {
    title: '湖北纹案文化展示平台',
    description: '传承荆楚文化，展示传统纹绣之美',
    images: ['/images/og-home.jpg'],
  },
}
```

#### 画廊页
**文件**: `src/app/(main)/gallery/page.tsx`

```tsx
export const metadata: Metadata = {
  title: '纹案画廊 - 湖北纹案',
  description: '浏览和探索湖北传统纹绣图案，支持按年代、地域、工艺筛选',
}
```

#### 纹样详情页（动态）
**文件**: `src/app/(main)/gallery/[id]/page.tsx`

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params
  const pattern = await getPattern(id)
  
  return {
    title: `${pattern.name} - 湖北纹案`,
    description: pattern.description.slice(0, 160),
    openGraph: {
      images: [{ url: pattern.imageUrl }],
    },
    // ✅ 结构化数据
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'VisualArtwork',
        name: pattern.name,
        description: pattern.description,
        creator: pattern.creator || '湖北纹案平台',
        dateCreated: pattern.era,
        image: pattern.imageUrl,
      }),
    },
  }
}
```

---

### 步骤 2: 补充图片 alt

**策略**: 所有 Image 和 img 必须有 alt

**示例修复**:
```tsx
// ❌ 错误
<Image src="/pattern.jpg" width={300} height={400} />

// ✅ 正确
<Image 
  src="/pattern.jpg" 
  width={300} 
  height={400} 
  alt="楚文化凤鸟纹 - 武汉出土战国时期丝绸纹样"
/>
```

**批量检查命令**:
```bash
# 搜索所有没有 alt 的 Image 组件
grep -r "<Image" src/ | grep -v "alt="
```

---

### 步骤 3: 补充 ARIA 标签

#### 图标按钮
```tsx
// ❌ 错误
<button onClick={onClose}>
  <Icon name="close" />
</button>

// ✅ 正确
<button onClick={onClose} aria-label="关闭">
  <Icon name="close" />
</button>
```

#### 筛选面板分组
```tsx
<fieldset>
  <legend className="font-semibold mb-2">年代筛选</legend>
  <div className="space-y-2">
    <label>
      <input type="checkbox" name="era" value="楚文化" />
      楚文化
    </label>
    {/* ... */}
  </div>
</fieldset>
```

#### 3D Canvas
```tsx
<Canvas
  role="img"
  aria-label="3D 文创产品预览"
>
  {/* ... */}
</Canvas>
```

---

### 步骤 4: 修复色彩对比度

**问题**: `--color-ink-faint: #9e9e88` 在米色背景上对比度 2.8:1

**修复**: `src/app/globals.css`

```css
@theme inline {
  /* 修改前 */
  --color-ink-faint: #9e9e88;  /* ❌ 对比度 2.8:1 */
  
  /* 修改后 */
  --color-ink-faint: #75745f;  /* ✅ 对比度 4.5:1 */
}
```

**验证工具**: https://webaim.org/resources/contrastchecker/

---

### 步骤 5: 键盘导航支持

#### Skip to content 链接
**文件**: `src/app/layout.tsx`

```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[var(--z-toast)] btn-primary"
        >
          跳到主内容
        </a>
        
        <SiteHeader />
        
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}
```

#### Focus 样式增强
**文件**: `src/app/globals.css`

```css
/* 已有的 focus-visible 样式 */
:focus-visible {
  outline: 2px solid var(--color-cinnabar);
  outline-offset: 2px;
}

/* ✅ 确保所有交互元素都可见 */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--color-cinnabar);
  outline-offset: 2px;
}
```

---

### 步骤 6: robots.txt 和 sitemap

**文件**: `public/robots.txt`（新建）

```
User-agent: *
Allow: /
Sitemap: https://hbpattern.husteread.com/sitemap.xml
```

**文件**: `src/app/sitemap.ts`（新建）

```typescript
import { MetadataRoute } from 'next'
import { getAllPatterns } from '@/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const patterns = await getAllPatterns()
  
  const patternUrls = patterns.map(p => ({
    url: `https://hbpattern.husteread.com/gallery/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))
  
  return [
    {
      url: 'https://hbpattern.husteread.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://hbpattern.husteread.com/gallery',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...patternUrls,
  ]
}
```

---

## 📁 涉及文件清单

### 需要修改
- ✏️ `src/app/(main)/page.tsx` - Metadata
- ✏️ `src/app/(main)/gallery/page.tsx` - Metadata
- ✏️ `src/app/(main)/gallery/[id]/page.tsx` - 动态 Metadata
- ✏️ `src/app/globals.css` - 色彩对比度
- ✏️ `src/app/layout.tsx` - Skip link
- ✏️ 所有使用 Image 的组件 - 补充 alt
- ✏️ 所有图标按钮 - 补充 aria-label

### 需要创建
- 📄 `public/robots.txt`
- 📄 `src/app/sitemap.ts`

---

## 🧪 验证方法

### 自动化验证
```bash
# Lighthouse 审计
npm run build
npx lighthouse http://localhost:3000 --view

# 预期分数:
# Performance: ≥ 90
# Accessibility: ≥ 95
# Best Practices: ≥ 90
# SEO: ≥ 95
```

### 手动验证
```bash
# 1. 测试键盘导航
# 按 Tab 键遍历所有交互元素
# 预期: 所有按钮、链接都有清晰的 focus 样式

# 2. 测试屏幕阅读器（可选）
# macOS: 启用 VoiceOver (Cmd+F5)
# Windows: 启用 Narrator (Win+Ctrl+Enter)
# 预期: 所有内容可被正确朗读

# 3. 测试色彩对比度
# 访问 https://webaim.org/resources/contrastchecker/
# 测试 --color-ink-faint 在 --color-rice 上的对比度
# 预期: ≥ 4.5:1
```

---

## 🎉 完成标志

- [x] 所有页面有 metadata
- [x] 所有图片有 alt
- [x] 所有按钮有 aria-label
- [x] 色彩对比度达标
- [x] Lighthouse Accessibility ≥ 95

**完成后** → 继续 `04-phase3-unique-features.md` 或 `08-performance-tuning.md` 🚀
