# Phase 2：用户交互层

> **周期**: ~3 天
> **前置条件**: Phase 1 完成（数据库已连通，画廊/详情页已数据化）
> **产出**: 登录用户可以点赞、收藏、评论、上传纹样，管理员可在后台审核

---

## Goal

在已打通的数据流基础上，实现完整的用户交互功能链：点赞 → 收藏 → 评论 → 上传 → 审核。每个功能都是前后端垂直打通的完整 Slice。

## Applied Skills

| Skill | 应用点 |
|-------|--------|
| `api-patterns` | REST 资源命名，幂等性设计（PUT 点赞 toggle），嵌套资源路由 |
| `clean-code` | Zustand Store 单一职责，Hook 封装复用，组件 SRP |
| `nextjs-react-expert` | 乐观更新（Optimistic UI），Client/Server 组件边界划分，避免瀑布流 |
| `frontend-design` | 点赞心跳动画（Von Restorff 效应），评论区层次设计（Miller's Law 分组） |
| `database-design` | 复合唯一约束（user_id + pattern_id），计数器同步策略 |

---

## Tasks

### 2.1 用户认证状态管理

```
新建: src/stores/useAuthStore.ts

import { create } from 'zustand'

interface AuthState {
  user: { id: string; email: string; nickname: string; avatar_url: string | null } | null
  isLoading: boolean
  setUser: (user: AuthState['user']) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clear: () => set({ user: null, isLoading: false }),
}))
```

```
新建: src/components/providers/AuthProvider.tsx ('use client')

功能:
  - 挂载时调用 supabase.auth.getUser() 初始化
  - 监听 supabase.auth.onAuthStateChange 实时更新
  - 变化时同步到 useAuthStore
  - 包裹在 layout.tsx 中

// layout.tsx 中:
<AuthProvider>
  {children}
</AuthProvider>
```

→ 验证: 登录后 `useAuthStore.getState().user` 有值，退出后为 null

### 2.2 Header 用户态显示

```
修改: src/components/layout/SiteHeader.tsx

已登录:
  - 右侧显示用户头像（Supabase avatar_url）
  - 点击头像 → 下拉菜单（个人中心 / 退出登录）
  - 退出: supabase.auth.signOut() → router.push('/login')

未登录:
  - 显示"登录"按钮 → Link to /login
```

→ 验证: 登录后 Header 显示头像，点击可退出

### 2.3 点赞功能

**API:**
```
新建: src/app/api/patterns/[id]/like/route.ts

POST /api/patterns/[id]/like
  - 认证检查: getUser()，无则 401
  - 检查 hp_user_likes 是否已存在
  - 存在 → 删除（取消赞）+ pattern.like_count -= 1
  - 不存在 → 创建（点赞）+ pattern.like_count += 1
  - 使用 Prisma 事务保证原子性:
    prisma.$transaction([
      prisma.userLike.delete/create(...),
      prisma.pattern.update({ like_count: { increment/decrement: 1 } })
    ])
  - 返回: { data: { liked: true/false, likeCount: N } }

GET /api/patterns/[id]/like
  - 返回当前用户是否已赞: { data: { liked: boolean } }
```

**前端:**
```
新建: src/components/pattern/LikeButton.tsx ('use client')

Props: patternId, initialLiked, initialCount
State: liked, count（本地状态，支持乐观更新）

交互:
  1. 点击 → 立即翻转 liked + count（乐观更新）
  2. 发送 POST /api/patterns/[id]/like
  3. 失败 → 回滚状态 + toast 提示

动画（Motion）:
  liked 变为 true 时:
    - 心形图标 scale: [1, 1.3, 1] + 颜色 cinnabar
    - duration: 300ms
```

→ 验证: 点击心形 → 数字+1 → 动画反馈 → 刷新后状态保持

### 2.4 收藏功能

**API:**
```
新建: src/app/api/collections/route.ts

GET /api/collections
  - 返回当前用户的收藏夹列表
  - Include: 每个收藏夹的条目数 _count

POST /api/collections
  - Body: { name, description?, is_public? }
  - 创建新收藏夹

新建: src/app/api/collections/[id]/items/route.ts

POST /api/collections/[id]/items
  - Body: { patternId, note? }
  - 将纹样添加到收藏夹
  - 复合唯一约束: collection_id + pattern_id

DELETE /api/collections/[id]/items/[patternId]
  - 从收藏夹移除纹样
```

**前端:**
```
新建: src/components/pattern/BookmarkButton.tsx ('use client')

交互流程:
  1. 点击收藏图标 → 弹出收藏夹选择弹窗（Modal）
  2. 显示用户所有收藏夹 + "新建收藏夹"选项
  3. 选择收藏夹 → POST 添加 → 关闭弹窗 → toast "已收藏"
  4. 如果已在某收藏夹中 → 显示勾选状态

新建: src/components/ui/Modal.tsx
  - 通用模态框组件
  - Motion AnimatePresence 进出动画
  - 点击遮罩或 ESC 关闭
  - 无障碍: role="dialog", aria-modal, focus trap
```

→ 验证: 详情页点击收藏 → 选择收藏夹 → 成功提示 → 个人中心可见

### 2.5 评论系统

**API:**
```
新建: src/app/api/patterns/[id]/comments/route.ts

GET /api/patterns/[id]/comments
  - 返回该纹样的所有评论（扁平结构，前端组装树形）
  - Include: user { nickname, avatar_url }
  - Where: status = 'approved'
  - OrderBy: created_at desc

POST /api/patterns/[id]/comments
  - 认证检查
  - Body: { content, parentId? }
  - 新评论默认 status = 'approved'（MVP 暂不审核）
  - 同时 pattern.comment_count += 1
```

**前端:**
```
新建: src/components/pattern/CommentSection.tsx ('use client')

结构:
  ┌──────────────────────────────┐
  │ 💬 讨论区 (N 条评论)           │
  │                              │
  │ [评论输入框]                   │
  │ [发表评论] btn-primary        │
  │                              │
  │ ┌── 用户A  2小时前 ──┐       │
  │ │ 评论内容...          │       │
  │ │ [回复] [点赞]        │       │
  │ │  └── 用户B 回复:     │       │
  │ │     回复内容...      │       │
  │ └─────────────────────┘       │
  └──────────────────────────────┘

嵌套评论实现:
  - API 返回扁平数组（含 parent_id）
  - 前端 buildCommentTree() 组装为树形结构
  - 最多 2 层嵌套（parent → child，不支持更深）
  - 点击"回复" → 展开子评论输入框 + 设置 parentId

未登录态:
  - 评论输入框替换为"登录后参与讨论" → Link to /login

遵循 Miller's Law:
  - 默认显示前 5 条评论
  - "查看更多" 按钮加载剩余
```

→ 验证: 登录后可发表评论 → 嵌套回复 → 刷新后评论保持

### 2.6 纹样上传功能

**Supabase Storage 配置:**
```
在 Supabase Dashboard 中:
  1. 创建 Storage Bucket: "pattern-images"
  2. 设置为 public bucket（或配置 RLS 策略）
  3. 允许上传类型: image/jpeg, image/png, image/webp
  4. 最大文件: 10MB
```

**API:**
```
新建: src/app/api/upload/route.ts

POST /api/upload
  - 认证检查
  - 接收 FormData（文件）
  - 上传到 Supabase Storage:
    supabase.storage.from('pattern-images').upload(path, file)
  - 返回公开 URL:
    supabase.storage.from('pattern-images').getPublicUrl(path)
  - 返回: { data: { url: "https://xxx.supabase.co/storage/..." } }

新建: src/app/api/patterns/route.ts 的 POST 方法

POST /api/patterns
  - 认证检查
  - Body: { name, description, era, regionId, techniqueId, imageUrl, ... }
  - 创建 Pattern (status: 'pending') + PatternMedia
  - 返回创建的 pattern
```

**前端:**
```
新建: src/app/upload/page.tsx ('use client')

布局:
  ┌────────────────────────────────────┐
  │ 上传纹样                            │
  │                                    │
  │ ┌──────────┐  名称: [         ]    │
  │ │          │  年代: [下拉选择  ]    │
  │ │  拖放图片  │  地区: [下拉选择  ]    │
  │ │  或点击上  │  技法: [下拉选择  ]    │
  │ │  传       │  描述: [多行文本  ]    │
  │ └──────────┘  版权: [下拉选择  ]    │
  │                                    │
  │ [预览]                [提交] primary │
  └────────────────────────────────────┘

交互:
  1. 拖放或点击选择图片 → 预览 → 上传到 Storage → 获得 URL
  2. 填写元数据表单
  3. 提交 → POST /api/patterns → 成功提示"已提交，等待审核"
  4. 跳转到个人中心

表单验证:
  - 名称必填，2-50 字
  - 图片必传
  - 年代/地区/技法至少选一
```

→ 验证: 选图 → 填信息 → 提交 → Supabase Storage 有文件 → DB 有记录 → status=pending

### 2.7 个人中心页

```
新建: src/app/profile/page.tsx

结构:
  ┌────────────────────────────────────────┐
  │ 个人中心                                │
  │                                        │
  │ ┌────────┐                             │
  │ │ 头像    │  昵称                       │
  │ │        │  user@email.com             │
  │ └────────┘  等级: 🌱 新手               │
  │                                        │
  │ ┌──────┐ ┌──────┐ ┌──────┐            │
  │ │ 上传 3 │ │ 获赞12│ │ 收藏 5│            │
  │ └──────┘ └──────┘ └──────┘            │
  │                                        │
  │ [我的上传] Tab | [我的收藏] Tab           │
  │                                        │
  │ 我的上传:                               │
  │   纹样卡片网格（含 status badge）        │
  │   pending = 黄色"审核中"                │
  │   approved = 绿色"已通过"               │
  │   rejected = 红色"已拒绝"               │
  │                                        │
  │ 我的收藏:                               │
  │   收藏夹列表 → 点击展开 → 纹样卡片       │
  └────────────────────────────────────────┘

数据查询（Server Component + 认证检查）:
  const user = await getUser()
  if (!user) redirect('/login')

  const [uploads, collections, stats] = await Promise.all([
    prisma.pattern.findMany({ where: { uploader_id: user.id } }),
    prisma.collection.findMany({
      where: { user_id: user.id },
      include: { items: { include: { pattern: true } }, _count: true }
    }),
    prisma.userLike.count({ where: { ... } })
  ])
```

→ 验证: 登录后访问 /profile → 显示我的上传和收藏

### 2.8 管理后台数据化

```
修改: src/app/dashboard/page.tsx

认证 + 权限检查:
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/')

KPI 卡片（真实数据）:
  const [patternCount, userCount, pendingCount] = await Promise.all([
    prisma.pattern.count({ where: { status: { in: ['approved', 'featured'] } } }),
    prisma.user.count(),
    prisma.pattern.count({ where: { status: 'pending' } }),
  ])

待审核列表:
  const pendingPatterns = await prisma.pattern.findMany({
    where: { status: 'pending' },
    include: { uploader: true, media: { take: 1 } },
    orderBy: { created_at: 'desc' },
  })

审核操作:
  新建: src/app/api/patterns/[id]/moderate/route.ts
  PATCH /api/patterns/[id]/moderate
    Body: { action: 'approve' | 'reject', reason? }
    → 更新 status
    → 创建 Notification 通知上传者
```

→ 验证: 管理员登录 → Dashboard 显示真实数据 → 可审核纹样

### 2.9 SiteHeader 添加导航项

```
修改: SiteHeader.tsx 导航:
  - 已登录: 添加 "上传" 链接 → /upload
  - 已登录: 添加 "我的" 链接 → /profile
  - 管理员: 添加 "后台" 链接 → /dashboard
```

### 2.10 middleware 更新

```
修改: src/middleware.ts

保护路由扩展:
  - /upload → 需登录
  - /profile → 需登录
  - /dashboard → 需登录（权限在页面内检查）
```

---

## Done When

- [ ] 登录用户可以点赞/取消赞，计数实时更新
- [ ] 登录用户可以创建收藏夹并添加/移除纹样
- [ ] 登录用户可以发表评论和嵌套回复
- [ ] 登录用户可以上传纹样图片（存入 Supabase Storage）
- [ ] 个人中心显示我的上传 + 我的收藏
- [ ] 管理员后台显示真实统计 + 可审核纹样
- [ ] 未登录用户访问保护路由被重定向到登录页
