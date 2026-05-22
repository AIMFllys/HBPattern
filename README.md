# HBPattern

<div align="center">

**湖北非遗纹样数字展示与互动平台**

[项目地址](https://github.com/AIMFllys/HBPattern) · [在线网站（暂定）](https://HBpattern.husteread.com) · [问题反馈](https://github.com/AIMFllys/HBPattern/issues) · [本地开发](http://localhost:6427) · [开源协议](./LICENSE)

项目地址：<https://github.com/AIMFllys/HBPattern>  
在线网站（暂定）：<https://HBpattern.husteread.com>  
Issues：<https://github.com/AIMFllys/HBPattern/issues>

</div>

---

## 项目简介

HBPattern 是一个面向湖北非遗纹样的数字化展示、检索、互动与创作平台。项目当前采用 Next.js App Router 架构，围绕纹样画廊、详情浏览、3D 地图、用户上传、评论点赞、后台审核和开放 API 建设核心能力。

当前实现以代码仓库为准：

- 前端框架：Next.js `16.2.1`、React `19.2.4`、TypeScript `5`
- 数据与 ORM：PostgreSQL、Prisma
- 认证与存储：Supabase Auth、Supabase Storage
- 接口规范：App Router API Routes、Zod 校验、统一响应封装
- 交互能力：Three.js、React Three Fiber、Drei
- 工程质量：ESLint、Vitest、Prisma Seed、环境变量检查脚本

---

## 项目结构

```text
HBPattern/
├── src/
│   ├── app/                         # Next.js App Router 路由
│   │   ├── (main)/                  # 公共页面
│   │   │   ├── page.tsx             # 首页
│   │   │   ├── gallery/             # 纹样画廊与详情
│   │   │   ├── map/                 # 3D 文化地图
│   │   │   ├── create/              # 3D/AI 创作入口
│   │   │   ├── workshop/            # 创作工作台
│   │   │   └── upload/              # 纹样上传
│   │   ├── (auth)/                  # 登录与个人中心
│   │   ├── auth/callback/route.ts   # Supabase OAuth 回调
│   │   ├── dashboard/               # 管理后台
│   │   └── api/                     # API Routes
│   │       ├── patterns/            # 纹样列表、详情、评论、点赞、审核
│   │       ├── regions/             # 地区字典
│   │       ├── stats/               # 平台统计
│   │       ├── upload/              # 文件上传
│   │       └── v1/                  # 对外公开 API
│   ├── components/                  # 可复用组件
│   ├── hooks/                       # React Hooks
│   └── lib/                         # 工具库、数据库、鉴权、校验、安全、上传
├── prisma/
│   ├── schema.prisma                # 数据库 Schema
│   ├── seed.ts                      # 初始化种子数据
│   └── prisma.config.ts             # Prisma 配置
├── scripts/                         # 环境检查与工程脚本
└── public/                          # 静态资源
```

---

## 快速开始

### 环境要求

- Node.js `20+`
- npm
- PostgreSQL 数据库
- Supabase 项目（Auth + Storage）

### 1. 克隆项目

```bash
git clone https://github.com/AIMFllys/HBPattern.git
cd HBPattern
```

如果是在当前本地工作区：

```bash
cd D:/project/HBPattern/HBPattern
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

新建 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# PostgreSQL / Prisma
DATABASE_URL=postgresql://user:password@host:5432/hbpattern
DIRECT_URL=postgresql://user:password@host:5432/hbpattern

# Optional
CORS_ALLOWED_ORIGINS=http://localhost:6427
RATE_LIMIT_DISABLED=1
```

启动前可检查环境变量：

```bash
npx tsx scripts/check-env.ts
```

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

生产环境建议使用正式迁移流程管理数据库版本，不建议直接依赖 `db push`。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:6427](http://localhost:6427) 查看效果。

---

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（默认端口 `6427`） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | 运行 ESLint |
| `npm run test` | 运行 Vitest |
| `npm run test:watch` | 监听模式运行 Vitest |

---

## 当前功能

| 模块 | 状态 | 说明 |
|------|:---:|------|
| 首页 | ✅ | 平台入口与内容展示 |
| 纹样画廊 | ✅ | 支持列表、筛选、详情 |
| 3D 文化地图 | ✅ | 展示地区与纹样分布，具备异常降级 |
| 创作入口 | ✅ | `/create` 与 `/workshop` 已接入页面 |
| 用户认证 | ✅ | Supabase 登录与 OAuth 回调 |
| 个人中心 | ✅ | `/profile` |
| 纹样上传 | ✅ | 登录用户上传，文件类型与大小校验 |
| 评论与点赞 | ✅ | 评论审核展示、点赞切换 |
| 管理后台 | ✅ | 管理员审核入口 |
| 开放 API | ✅ | `/api/v1/*` 读接口与 CORS 预检 |

---

## API 规范

### 响应格式

```json
{
  "data": {},
  "meta": {
    "requestId": "..."
  }
}
```

列表响应：

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  },
  "meta": {
    "requestId": "..."
  }
}
```

错误响应：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "requestId": "..."
  }
}
```

### BFF API

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|:---:|------|
| `GET` | `/api/patterns` | 否 | 纹样列表 |
| `POST` | `/api/patterns` | 是 | 新增纹样 |
| `GET` | `/api/patterns/:id` | 否 | 纹样详情 |
| `GET` | `/api/patterns/:id/comments` | 否 | 评论列表 |
| `POST` | `/api/patterns/:id/comments` | 是 | 发表评论 |
| `GET` | `/api/patterns/:id/like` | 否 | 查询点赞状态 |
| `POST` | `/api/patterns/:id/like` | 是 | 切换点赞 |
| `PATCH` | `/api/patterns/:id/moderate` | admin | 审核纹样 |
| `GET` | `/api/regions` | 否 | 地区字典 |
| `GET` | `/api/stats` | 否 | 平台统计 |
| `POST` | `/api/upload` | 是 | 上传文件 |

### Open API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/patterns` | 纹样列表 |
| `GET` | `/api/v1/patterns/:id` | 纹样详情 |
| `GET` | `/api/v1/regions` | 地区字典 |
| `GET` | `/api/v1/stats` | 平台统计 |
| `OPTIONS` | `/api/v1/*` | CORS 预检 |

### 限流规则

| 接口 | 规则 |
|------|------|
| `POST /api/patterns` | 60 秒 10 次 |
| `POST /api/upload` | 60 秒 20 次 |
| `POST /api/patterns/:id/comments` | 60 秒 30 次 |

开发环境可通过 `RATE_LIMIT_DISABLED=1` 关闭限流。

### 上传限制

- 最大体积：`10MB`
- MIME 类型：`image/jpeg`、`image/png`、`image/webp`
- 扩展名：`.jpg`、`.jpeg`、`.png`、`.webp`

---

## 数据模型

核心模型位于 `prisma/schema.prisma`，当前包括：

- `hp_users`
- `hp_patterns`
- `hp_pattern_media`
- `hp_regions`
- `hp_techniques`
- `hp_comments`
- `hp_user_likes`
- `hp_collections`
- `hp_collection_items`
- `hp_view_history`
- `hp_api_keys`

---

## 开发路线图

| 阶段 | 目标 | 状态 |
|:---:|------|:---:|
| Phase 1 | 基础能力：画廊、详情、上传、用户系统、评论点赞、审核接口 | ✅ 进行中 |
| Phase 2 | 视觉体验：3D 地图增强、创作工作台完善、时间线、搜索体验 | ⏳ 待推进 |
| Phase 3 | AI 深化：AI 图案生成、以图搜图、举报治理、贡献者等级 | ⏳ 待推进 |
| Phase 4 | 生态扩展：多语言、Deep Zoom、教育模块、开放 API 完善 | ⏳ 待推进 |

---

## 参与贡献

欢迎各种形式的贡献，包括：

- 提交 Bug 报告
- 提出新功能想法
- 完善文档
- 贡献纹样图片（需附版权声明）
- 提交代码

贡献流程：

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "feat: add your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

---

## 版权说明

- 源代码：[MIT License](./LICENSE)，© 2026 HBPattern Contributors
- 纹样图片：已收录的纹样图片各自遵守其标注的版权协议（公有领域 / CC 协议 / 原创声明），请查阅各纹样详情页的版权声明
- AI 生成内容：应标注“AI 生成”标记，版权归上传用户或生成发起者所有，具体以平台规则为准

---

## 联系我们

- GitHub Issues：[提交问题](https://github.com/AIMFllys/HBPattern/issues)
- 网站（暂定）：[HBpattern.husteread.com](https://HBpattern.husteread.com)

---

<div align="center">

**让每一幅湖北纹绣，都能跨越时间，被世界看见。**

如果这个项目对您有帮助，欢迎 Star 支持！

</div>
