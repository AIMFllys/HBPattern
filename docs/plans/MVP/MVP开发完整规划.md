# HBPattern MVP 开发总纲

> **版本**: v2.0
> **日期**: 2026-04-28
> **技术基座**: Next.js 16.2 + Supabase 全家桶（Auth + Postgres + Storage）

---

## 技术基座

| 层 | 方案 | 说明 |
|----|------|------|
| **认证** | Supabase Auth | OAuth (GitHub/Google) + Email/Password |
| **数据库** | Supabase Postgres + Prisma 7 | 云端 PostgreSQL，Prisma ORM 映射 |
| **存储** | Supabase Storage | 纹样图片存储 |
| **前端** | Next.js 16.2 + Tailwind v4 + Motion v12 | App Router, Server Components |
| **状态** | Zustand 5 + TanStack Query 5 | 客户端状态 + 数据缓存 |

---

## 开发阶段

```
Phase 0 → Phase 1 → Phase 2 → Phase 3
 ~1天       ~3天       ~3天       ~2天
```

| 阶段 | 文档 | 目标 |
|------|------|------|
| **Phase 0** | [phase-0-tech-debt.md](phase-0-tech-debt.md) | 修 Bug + 抽组件 + 登录页 + 移动端 + 错误页 |
| **Phase 1** | [phase-1-data-flow.md](phase-1-data-flow.md) | Supabase 连接 + API + 首页/画廊/详情数据化 |
| **Phase 2** | [phase-2-user-interaction.md](phase-2-user-interaction.md) | 点赞 + 收藏 + 评论 + 上传 + 个人中心 + 后台 |
| **Phase 3** | [phase-3-polish.md](phase-3-polish.md) | Motion 动效 + 移动端 + SEO + 性能 + 质量审计 |

---

## Applied Skills

| Skill | 应用阶段 |
|-------|---------|
| `clean-code` | 全程：SRP, DRY, KISS, Guard Clauses |
| `plan-writing` | 全程：任务拆分、验证标准 |
| `frontend-design` | Phase 0 (登录页) + Phase 3 (动效/UX) |
| `api-patterns` | Phase 1-2：REST 规范、Envelope Pattern、状态码 |
| `nextjs-react-expert` | Phase 1-3：Server Components、Promise.all、dynamic import |
| `database-design` | Phase 1：种子数据、索引 |
| `seo-fundamentals` | Phase 3：metadata、JSON-LD |
| `web-design-guidelines` | Phase 3：无障碍审计 |

---

## MVP 完成标志

用户可走通完整流程：

```
浏览首页 → 画廊筛选 → 查看详情 → 登录
→ 点赞 → 收藏 → 评论 → 上传纹样
→ 个人中心查看 → 管理员审核 → 纹样上线
```

所有数据来自 Supabase 云端，零 Mock。
