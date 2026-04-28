# Phase 3：体验增强与上线打磨

> **周期**: ~2 天
> **前置条件**: Phase 2 完成（用户交互功能全部可用）
> **产出**: 动效丰富、移动端友好、SEO 完善、性能优化的 MVP 成品

---

## Goal

在功能完整的基础上，通过 Motion 动效、移动端适配、SEO 元数据、性能优化和代码质量审计，将产品从"可用"提升到"好用"。

## Applied Skills

| Skill | 应用点 |
|-------|--------|
| `frontend-design` | 动画 timing/easing 原则，触觉反馈，UX 心理学（Visceral → Behavioral → Reflective） |
| `nextjs-react-expert` | 图片优化（next/image），动态 import 大组件，消除 barrel import，bundle 分析 |
| `clean-code` | 清理未使用依赖，代码自文档化，Boy Scout 原则 |
| `seo-fundamentals` | 每页独立 metadata，结构化数据（JSON-LD），语义 HTML |
| `web-design-guidelines` | 无障碍审计，焦点管理，动效偏好尊重 |
| `testing-patterns` | 关键路径冒烟测试 |

---

## Tasks

### 3.1 Motion 动效系统启用

```
全局动效原则（遵循 frontend-design animation 规范）:

  Duration:
    - 微交互（按钮/图标）: 150-200ms
    - 面板展开: 250-300ms
    - 页面过渡: 300-400ms
    - 奢侈感效果: 500-800ms

  Easing:
    - 进入: ease-out（减速进入）
    - 退出: ease-in（加速离开）
    - 强调: ease-in-out（平滑）
    - 弹性: spring({ stiffness: 300, damping: 20 })

  减少运动偏好:
    @media (prefers-reduced-motion: reduce) {
      所有动画 duration 设为 0
    }
```

**应用场景清单:**

```
修改: src/components/layout/SiteHeader.tsx
  - 移动端抽屉: motion.div x: [-300, 0] (已在 Phase 0 实现)

修改: src/components/pattern/LikeButton.tsx
  - 点赞心跳: motion.div scale: [1, 1.3, 1]

修改: src/components/ui/Modal.tsx
  - 弹窗进入: motion.div opacity: [0,1] + scale: [0.95, 1]
  - 遮罩: motion.div opacity: [0, 1]

新建: src/components/ui/PageTransition.tsx
  - 页面内容进入: motion.div y: [20, 0] + opacity: [0, 1]
  - 包裹每个 page.tsx 的 main 内容

修改: src/app/gallery/page.tsx (GalleryClient)
  - 纹样卡片: staggerChildren 依次出现
  - motion.div initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: index * 0.05 }}

修改: src/components/pattern/CommentSection.tsx
  - 新评论: motion.div 从底部滑入
  - AnimatePresence 管理评论添加/删除

修改: src/app/gallery/[id]/page.tsx
  - 博物馆画框图片: motion.div 进入时 scale: [0.9, 1] + opacity
  - 时间线节点: stagger 依次出现
```

→ 验证: 画廊卡片依次浮现，点赞有心跳，弹窗有过渡

### 3.2 移动端完善

```
逐页移动端审查（断点: 375px / 768px）:

首页 (/):
  - Hero 文字: clamp 缩小，按钮全宽
  - 统计卡片: grid-cols-1 sm:grid-cols-2
  - 精选纹样: grid-cols-1 sm:grid-cols-2

画廊 (/gallery):
  - 筛选面板: 默认隐藏，底部抽屉展开（Sheet 组件）
  - "筛选" FAB 按钮（固定底部右下角）
  - 瀑布流: column-count: 1 (< 640px) → 2 (< 1024px) → 3

  新建: src/components/ui/BottomSheet.tsx ('use client')
    - 移动端底部抽屉
    - 手势拖拽关闭（Motion drag）
    - 高度: 60vh

详情页 (/gallery/[id]):
  - 双栏 → 单栏堆叠
  - 博物馆画框: 全宽
  - 时间线: 横向改竖向（移动端）

创作 (/create) + 工坊 (/workshop):
  - 移动端显示提示 Banner: "此功能在桌面端体验最佳"
  - 三栏 → 单栏（隐藏工具栏，素材库改底部 Tab）

地图 (/map):
  - 左侧面板: 默认折叠，可展开
  - 标记点 touch 交互适配

管理后台 (/dashboard):
  - KPI 卡片: grid-cols-1
  - 表格: 水平滚动 overflow-x-auto
```

→ 验证: 在 375px 宽度下所有页面可正常浏览和操作

### 3.3 SEO 元数据完善

```
每个页面添加独立 metadata（遵循 seo-fundamentals）:

src/app/page.tsx:
  export const metadata = {
    title: '湖北纹案文化展示平台 — 千年纹饰之美',
    description: '探索湖北传统纹绣文化的数字化平台。浏览纹样画廊、3D文化地图、AI创作中心。',
    openGraph: {
      title: '湖北纹案文化展示平台',
      description: '...',
      images: ['/og-image.png'],
    }
  }

src/app/gallery/page.tsx:
  export const metadata = {
    title: '纹样画廊 — 湖北纹案文化展示平台',
    description: '浏览楚文化凤鸟纹、土家织锦、汉绣等湖北传统纹饰精品。',
  }

src/app/gallery/[id]/page.tsx:
  // 动态 metadata（已在 Phase 1 实现 generateMetadata）

src/app/create/page.tsx:
  export const metadata = {
    title: 'AI 创作中心 — 湖北纹案文化展示平台',
    description: '使用 AI 技术生成纹绣图案，预览 3D 文创产品效果。',
  }

src/app/map/page.tsx:
  export const metadata = {
    title: '3D 文化地图 — 湖北纹案文化展示平台',
    description: '以交互式地图探索湖北各地纹绣文化的地理分布与非遗传承。',
  }

src/app/workshop/page.tsx:
  export const metadata = { title: '跨界工坊 ...' }

src/app/login/page.tsx:
  export const metadata = { title: '登录 ...' }

src/app/profile/page.tsx:
  export const metadata = { title: '个人中心 ...' }

结构化数据（首页）:
  // JSON-LD WebSite schema
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "湖北纹案文化展示平台",
    "url": "https://hbpattern.husteread.com",
    "description": "...",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://hbpattern.husteread.com/gallery?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  </script>
```

→ 验证: `curl -s localhost:6427 | grep '<title>'` 显示完整标题

### 3.4 图片优化

```
配置: next.config.ts

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  }

替换所有页面的 <img> 标签:
  - 纹样卡片缩略图 → <Image width={400} height={500} ... />
  - 详情页主图 → <Image fill sizes="(max-width: 768px) 100vw, 50vw" priority />
  - 个人头像 → <Image width={40} height={40} className="rounded-full" />

  // priority 仅用于首屏可见图片（Hero、第一张卡片）
  // sizes 属性根据响应式断点配置
```

→ 验证: Network 面板看到图片为 webp 格式，有 srcset

### 3.5 性能优化

```
Bundle 分析:
  npx @next/bundle-analyzer

检查项（遵循 nextjs-react-expert）:
  □ 无 barrel import（检查 icons/index.ts 是否被全量导入）
  □ Motion 是否被 tree-shake（仅 import 使用的组件）
  □ 大组件用 dynamic import:
    - CommentSection → dynamic(() => import('./CommentSection'))
    - Modal → dynamic(() => import('./Modal'))
  □ 未使用的依赖:
    - lucide-react: 如果决定用 Icon.tsx 手写图标 → 卸载 lucide-react
    - 或者: 替换 Icon.tsx → 全部用 lucide-react（二选一，不并存）

Server Component 检查:
  □ 所有只展示数据的页面 = Server Component（无 'use client'）
  □ 仅交互组件标记 'use client'（筛选面板、评论框、点赞按钮）
  □ Client Component 尽可能小（叶子节点）
```

→ 验证: 首页 First Load JS < 100KB，画廊页 < 120KB

### 3.6 无障碍基础审计

```
检查项（遵循 web-design-guidelines）:

  □ 所有图片有 alt 文本:
    - 纹样图: alt={pattern.name}
    - 装饰图: alt=""（空 alt 标记为装饰性）
  
  □ 所有按钮有可访问名称:
    - 图标按钮: aria-label="点赞" / "收藏" / "关闭"
    - 汉堡菜单: aria-label="打开导航菜单"
    - aria-expanded={isOpen} 状态
  
  □ 颜色对比度:
    - 主文字 ink (#1a1a14) on rice (#f5f0e8) → 对比度 ~12:1 ✅
    - 辅助文字 ink-light (#6b6b58) on rice → 对比度 ~4.5:1 ✅
    - 按钮文字 rice on cinnabar → 检查是否 ≥ 4.5:1
  
  □ 焦点管理:
    - :focus-visible 样式已定义（globals.css 已有）
    - Modal 打开时 focus trap（焦点锁定在弹窗内）
    - Modal 关闭时焦点回到触发按钮
  
  □ 键盘导航:
    - Tab 顺序合理
    - Enter/Space 激活按钮
    - Escape 关闭弹窗
```

→ 验证: 纯键盘可完成 浏览 → 登录 → 点赞 → 收藏 流程

### 3.7 代码质量检查

```
运行:
  npx tsc --noEmit                    # TypeScript 零错误
  npx next lint                       # ESLint 零 error

清理:
  □ 删除 _mock/ 目录所有文件（如 Phase 1 未彻底删除）
  □ 删除 download-font.js（如无用途）
  □ 检查并删除所有 console.log
  □ 确保 .env.local 在 .gitignore 中

文档更新:
  □ README.md 更新实际技术栈版本
  □ 添加本地开发启动指南
  □ 添加环境变量说明
```

→ 验证: `npx tsc --noEmit` 退出码 0，`npx next lint` 退出码 0

---

## Done When

- [ ] 画廊卡片有 stagger 出现动效
- [ ] 点赞/收藏有视觉反馈动画
- [ ] 弹窗有进出过渡
- [ ] 375px 宽度下所有页面可正常使用
- [ ] 画廊移动端有底部筛选抽屉
- [ ] 每个页面有独立 SEO title + description
- [ ] 图片使用 next/image 优化
- [ ] `tsc --noEmit` 和 `next lint` 零错误
- [ ] 首页 First Load JS < 100KB

---

## MVP 最终验收

完成 Phase 0-3 后，一个用户可以完成以下完整流程：

```
1. 访问首页 → 看到真实统计和精选纹样
2. 进入画廊 → 筛选"战国" → 只显示战国纹样
3. 点击卡片 → 进入详情页 → 查看完整信息
4. 点击登录 → GitHub OAuth → 回到详情页
5. 点赞 → 心跳动画 → 计数+1
6. 收藏到"我的收藏" → toast 提示
7. 发表评论 → 评论滑入显示
8. 上传新纹样 → 图片上传到 Supabase Storage
9. 访问个人中心 → 看到我的上传（审核中）和收藏
10. 管理员登录 → Dashboard 审核纹样 → 通过
11. 纹样出现在画廊中
```

所有数据来自 Supabase 云端。零 Mock 数据。
