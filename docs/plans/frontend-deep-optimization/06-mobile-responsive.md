# 专项: 移动端深度适配 📱

> **会话编号**: 5/8  
> **预计时长**: 6小时  
> **依赖**: Phase 1 + Motion 集成完成  
> **优先级**: ⭐⭐⭐

---

## 🎯 本次会话目标

移动端体验达到 80 分，重点优化 3D 创作中心和地图页。

### 核心问题
- 3D 创作中心三栏布局在移动端挤压
- 地图页 absolute 定位在小屏偏移
- 汉堡菜单已有（MobileDrawer.tsx）但需验证
- 触摸目标需达到 44×44px

---

## ✅ 验收标准

### 3D 创作中心
- [ ] 移动端使用全屏 Canvas + 底部工具栏
- [ ] MobileToolbar 组件已启用
- [ ] 纹样选择器改为底部 Sheet
- [ ] 参数调节改为底部 Sheet
- [ ] 所有按钮触摸目标 ≥ 44×44px

### 地图页
- [ ] 地图在移动端可正常交互
- [ ] 标记点触摸目标 ≥ 44×44px
- [ ] 地区详情使用底部 Sheet
- [ ] 双指缩放正常

### 画廊页
- [ ] 瀑布流在移动端改为 1 列
- [ ] 筛选面板改为底部 Sheet
- [ ] 图片加载优先低分辨率

### 通用
- [ ] Header 汉堡菜单正常
- [ ] 所有表单输入框适配移动端键盘
- [ ] 所有 Modal 改为底部 Sheet

---

## 🔧 实施步骤

### 步骤 1: 3D 创作中心移动适配

**文件**: `src/app/(main)/create/page.tsx`

**核心策略**: 桌面三栏 → 移动全屏Canvas

```tsx
export default function CreatePage() {
  return (
    <>
      {/* 桌面布局（lg+） */}
      <div className="hidden lg:flex h-screen">
        <ProductSelector className="w-20" />
        <Canvas3D className="flex-1" />
        <PatternPanel className="w-80" />
        <ParameterPanel className="w-80" />
      </div>
      
      {/* 移动布局（<lg） */}
      <div className="flex lg:hidden flex-col h-screen">
        <Canvas3D className="flex-1" />
        <MobileToolbar />
      </div>
    </>
  )
}
```

**文件**: `src/components/create/MobileToolbar.tsx`（已存在，启用）

检查并确保实现：
```tsx
export function MobileToolbar() {
  const [activeSheet, setActiveSheet] = useState<'products' | 'patterns' | 'params' | null>(null)
  
  return (
    <>
      {/* 底部工具栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-rice-warm border-t border-rice-deep p-4 safe-area-bottom">
        <div className="flex justify-around">
          <button onClick={() => setActiveSheet('products')}>
            产品
          </button>
          <button onClick={() => setActiveSheet('patterns')}>
            纹样
          </button>
          <button onClick={() => setActiveSheet('params')}>
            参数
          </button>
        </div>
      </div>
      
      {/* 底部 Sheet */}
      <BottomSheet
        isOpen={activeSheet !== null}
        onClose={() => setActiveSheet(null)}
      >
        {activeSheet === 'products' && <ProductSelector />}
        {activeSheet === 'patterns' && <PatternPanel />}
        {activeSheet === 'params' && <ParameterPanel />}
      </BottomSheet>
    </>
  )
}
```

---

### 步骤 2: 创建通用 BottomSheet 组件

**文件**: `src/components/ui/BottomSheet.tsx`（新建）

```tsx
'use client'

import { motion, AnimatePresence } from 'motion/react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxHeight?: string
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  children,
  maxHeight = '80vh'
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/50 z-[var(--z-overlay)]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-0 left-0 right-0 bg-rice rounded-t-2xl z-[var(--z-modal)]"
            style={{ maxHeight }}
          >
            {/* 拖拽指示器 */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-ink-faint rounded-full" />
            </div>
            
            {/* 内容 */}
            <div className="px-4 pb-8 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

### 步骤 3: 地图页移动适配

**文件**: `src/app/(main)/map/page.tsx`

**问题诊断**: SVG 地图使用 `position: absolute` + 百分比定位

**解决方案**: 移动端改用真实坐标系统

```tsx
export default function MapPage() {
  return (
    <div className="min-h-screen">
      {/* 桌面布局 */}
      <div className="hidden lg:flex">
        <MapSidebar />
        <MapCanvas />
      </div>
      
      {/* 移动布局 */}
      <div className="flex lg:hidden flex-col h-screen">
        <MapCanvas />
        <BottomSheet {...regionDetails}>
          <RegionInfo />
        </BottomSheet>
      </div>
    </div>
  )
}
```

**文件**: `src/components/map/MapCanvas.tsx`

**增强触摸支持**:
```tsx
export function MapCanvas() {
  const handleTouchStart = (e: React.TouchEvent) => {
    // 记录初始触摸位置
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // 平移地图
  }
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="relative w-full h-full"
    >
      {/* SVG 地图 */}
    </div>
  )
}
```

---

### 步骤 4: 画廊页移动优化

**文件**: `src/app/globals.css`

**调整瀑布流**:
```css
.masonry-grid {
  column-count: 1;        /* 移动端默认 1 列 */
  column-gap: 1rem;
}

@media (min-width: 640px) {
  .masonry-grid {
    column-count: 2;      /* 小平板 2 列 */
    column-gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .masonry-grid {
    column-count: 3;      /* 桌面 3 列 */
  }
}
```

**文件**: `src/components/gallery/GalleryClient.tsx`

**筛选面板移动适配**:
```tsx
export function GalleryClient() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  return (
    <>
      {/* 移动端：筛选按钮 */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="btn-primary w-full"
        >
          筛选条件
        </button>
      </div>
      
      {/* 桌面端：侧边栏 */}
      <div className="hidden lg:block w-64">
        <FilterPanel />
      </div>
      
      {/* 移动端：BottomSheet */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      >
        <FilterPanel />
      </BottomSheet>
      
      {/* 画廊网格 */}
      <div className="masonry-grid flex-1">
        {/* ... */}
      </div>
    </>
  )
}
```

---

### 步骤 5: 触摸目标优化

**文件**: `src/app/globals.css`

**添加移动端增强**:
```css
/* 移动端触摸目标最小尺寸 */
@media (hover: none) {
  .btn-primary,
  .btn-ghost,
  button,
  a {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* 地图标记点 */
  .map-marker {
    width: 44px;
    height: 44px;
  }
}

/* 安全区域适配（iPhone 刘海） */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

### 步骤 6: 验证汉堡菜单

**文件**: `src/components/layout/MobileDrawer.tsx`（已存在）

**检查内容**:
- 是否在 SiteHeader 中已启用
- 抽屉动画是否流畅
- 点击遮罩是否关闭
- 导航链接是否完整

---

## 📁 涉及文件清单

### 需要创建
- 📄 `src/components/ui/BottomSheet.tsx`

### 需要修改
- ✏️ `src/app/(main)/create/page.tsx`
- ✏️ `src/app/(main)/map/page.tsx`
- ✏️ `src/components/gallery/GalleryClient.tsx`
- ✏️ `src/app/globals.css`

### 需要检查
- 🔍 `src/components/create/MobileToolbar.tsx`
- 🔍 `src/components/layout/MobileDrawer.tsx`

---

## 🧪 验证方法

```bash
# 使用 Chrome DevTools 移动设备模拟

# 1. 测试 3D 创作中心
# 切换到 iPhone 14 Pro
# 访问 /create
# 预期: 全屏 Canvas，底部有工具栏
# 预期: 点击工具栏按钮，底部滑出 Sheet

# 2. 测试地图页
# 切换到 iPad Mini
# 访问 /map
# 预期: 可以拖拽地图
# 预期: 点击标记点，底部显示详情

# 3. 测试画廊页
# 切换到 iPhone SE
# 访问 /gallery
# 预期: 瀑布流 1 列显示
# 预期: 点击筛选按钮，底部滑出筛选面板

# 4. 测试触摸目标
# 所有按钮、链接点击区域 ≥ 44×44px
```

---

## 🎉 完成标志

- [x] 3D 创作移动端可用
- [x] 地图移动端可交互
- [x] 画廊移动端流畅
- [x] 所有触摸目标达标

**完成后** → 继续 `07-seo-accessibility.md` 🔍
