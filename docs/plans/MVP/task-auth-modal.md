# 任务：实现 AuthModal 全局认证弹窗组件

## 项目背景

HBPattern（湖北纹案文化展示平台）是一个 Next.js 16.2 + Supabase + Tailwind v4 的文化展示项目。MVP 已完成，用户可以浏览纹样、登录、点赞、评论、上传。

## 当前问题

`/create`（AI 创作）和 `/workshop`（跨界工坊）页面在 `src/proxy.ts` 中被列为 protectedPaths，未登录用户访问时直接 302 重定向到 `/login`。这导致：
1. 用户无法预览页面内容（丧失兴趣）
2. 跳转突兀，无上下文
3. 创作页面的表单状态（已选纹样、已调参数）在跳转后全部丢失

## 目标

实现一个 `<AuthModal>` 全局认证弹窗组件，让用户在任何页面触发需要登录的操作时，弹出 Modal 完成认证，不离开当前页面。

## 技术栈

- Next.js 16.2 (App Router, `proxy.ts` 替代 middleware)
- Supabase Auth (`@supabase/ssr`)
- Tailwind CSS v4 (自定义主题色: cinnabar, rice, gold, ink)
- Zustand 5 (`src/stores/useAuthStore.ts`)
- Motion v12 (`motion/react`)
- 项目设计风格：米色书香（beige scholarly）

## 现有认证基础设施

### 文件结构
```
src/stores/useAuthStore.ts          — Zustand: { user, isLoading, setUser }
src/components/providers/AuthProvider.tsx — 全局 auth 状态同步
src/lib/supabase/client.ts          — createClient() 浏览器端
src/app/login/page.tsx              — 完整登录/注册页面（GitHub OAuth + 邮箱密码 + 注册模式）
src/app/auth/callback/route.ts      — OAuth 回调 + hp_users upsert
src/proxy.ts                        — 路由保护（protectedPaths）
```

### useAuthStore 接口
```typescript
interface AuthUser {
  id: string; email: string; nickname: string; avatar_url: string | null; role?: string
}
interface AuthState {
  user: AuthUser | null; isLoading: boolean; setUser: (user: AuthUser | null) => void
}
```

### 已有的登录逻辑（login/page.tsx 中）
```typescript
// GitHub OAuth
const supabase = createClient()
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
})

// 邮箱密码登录
await supabase.auth.signInWithPassword({ email, password })

// 注册
await supabase.auth.signUp({
  email, password,
  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
})
```

### Supabase SMTP 已配置
- Host: smtpdm.aliyun.com:587
- Sender: accounts@email.1037solo.com
- 注册后发送验证邮件

## 实现要求

### 1. AuthModal 组件 (`src/components/auth/AuthModal.tsx`)

- `'use client'` 组件
- Props: `{ open: boolean; onClose: () => void; message?: string }`
- 包含完整的登录/注册功能（复用 login/page.tsx 的逻辑）
- Motion AnimatePresence 进出动画（opacity + scale，300ms ease-out）
- 遮罩点击或 ESC 关闭
- 无障碍：role="dialog", aria-modal, focus trap
- 视觉风格与项目一致（米色书香主题）

### 2. useAuthModal hook (`src/stores/useAuthModal.ts`)

```typescript
// 全局控制 Modal 开关的 Zustand store
interface AuthModalState {
  open: boolean
  message: string
  openModal: (message?: string) => void
  closeModal: () => void
}
```

这样任何组件都可以 `useAuthModal().openModal('登录后即可生成纹样')` 触发。

### 3. 修改 proxy.ts

从 protectedPaths 中移除 `/create` 和 `/workshop`，使其公开可访问。

### 4. 修改 create/page.tsx 和 workshop/page.tsx

在"生成"/"应用"等操作按钮处：
```typescript
const user = useAuthStore(s => s.user)
const { openModal } = useAuthModal()

function handleGenerate() {
  if (!user) { openModal('登录后即可使用 AI 创作功能'); return }
  // 正常逻辑...
}
```

### 5. 在 layout.tsx 中挂载 AuthModal

```tsx
<AuthProvider>
  <AuthModal /> {/* 全局唯一实例 */}
  {children}
</AuthProvider>
```

### 6. OAuth 回调处理

GitHub OAuth 会跳转离开页面，这不可避免。但：
- OAuth redirectTo 应带上当前页面路径：`redirectTo: window.location.origin + '/auth/callback?next=' + window.location.pathname`
- `auth/callback/route.ts` 读取 `next` 参数并跳转回去

### 7. 邮箱密码登录在 Modal 内完成

- 登录成功 → 关闭 Modal → 用户继续操作（状态完全保留）
- 注册成功 → Modal 内显示"验证邮件已发送"

## 设计规范

- Modal 宽度: max-w-md
- 圆角: rounded-xl
- 阴影: shadow-modal (已定义在 globals.css)
- 遮罩: bg-ink/60 backdrop-blur-sm
- 主按钮: btn-primary (朱砂红)
- 动画 duration: 300ms, ease-out 进入, ease-in 退出
- 关闭按钮: 右上角 X

## 验证标准

- [ ] 未登录用户可以访问 /create 和 /workshop 页面
- [ ] 点击"生成"按钮时弹出 AuthModal
- [ ] Modal 内可以 GitHub 登录（跳转后回到原页面）
- [ ] Modal 内可以邮箱密码登录（不离开页面）
- [ ] Modal 内可以注册（显示验证邮件提示）
- [ ] 登录成功后 Modal 自动关闭
- [ ] ESC / 点击遮罩可关闭 Modal
- [ ] `npx tsc --noEmit` 零错误
- [ ] `npx eslint src` 零错误

## 注意事项

- Next.js 16.2 中 Server Component 不能使用 `dynamic({ ssr: false })`，Client Component 直接 import 即可
- 项目使用 `proxy.ts`（非 middleware.ts），export `proxy` 函数
- 不要引入新依赖，使用已有的 motion/react + zustand
- 遵循项目的 clean-code 原则：SRP, DRY, KISS
- AuthModal 的登录逻辑应与 login/page.tsx 保持一致，但不要简单复制粘贴 — 提取共享逻辑到 hook 或工具函数
