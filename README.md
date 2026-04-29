<div align="center">

# 🧵 HBPattern · 湖北纹案文化展示平台

**湖北传统纹饰文化的数字化展示、探索、AI 创作与共享平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_17-3ecf8e?logo=supabase)](https://supabase.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/AIMFllys/HBPattern/issues)

[🌐 在线体验（即将上线）](#) · [📖 网站功能介绍](./docs/湖北纹案文化展示平台%20—%20网站功能介绍.md) · [🏗️ 技术架构文档](./docs/湖北纹案-具体技术架构规划.md) · [💬 提交反馈](https://github.com/AIMFllys/HBPattern/issues)

</div>

---

## 📖 项目简介

**湖北纹案文化展示平台（HBPattern）** 是一个以数字化方式保护和传播湖北传统纹饰文化的开源 Web 项目。

湖北是楚文化的发源地，拥有极为丰富的传统纹饰遗产。这些纹案历经千年沉淀，蕴含着独特的历史故事、工艺技法与文化符号。然而随着现代化进程，许多珍贵的纹绣图案正面临失传的风险。

本平台旨在通过：
- 🖼️ **数字化存档** — 建立高精度的湖北纹案数据库
- 🗺️ **地理溯源** — 以 3D 交互地图追溯每个纹案的历史上源
- 🤖 **AI 赋能** — 利用 AI 技术进行图案创作与文创产品预览
- 🌍 **开放共享** — 对外提供开放 API，供学术研究和开发者调用

...让每一个传统纹饰纹案都能被更多人看见、理解和传承。

---

## ✨ 核心功能

| 功能模块 | 描述 |
|---------|------|
| **纹案画廊** | 瀑布流/网格浏览，支持多维筛选、以图搜图、颜色搜索 |
| **3D 文化地图** | 交互式 3D 地图，点击触发光晕动画，追溯纹案地理渊源 |
| **纹案知识图谱** | 可视化展示纹案间的演化、衍生、同源关系 |
| **AI 图案生成** | 基于豆包 Seedream 模型，文字描述生成纹绣图案 |
| **3D 文创预览器** | 将纹案实时映射到 3D 产品模型上（杯子/T恤/旗袍等） |
| **社区与评论** | 用户上传、评论、收藏，AI 自动安全审核 |
| **个人收藏夹** | 创建自定义画册，管理喜爱的纹案 |
| **非遗关联** | 纹案与国家/省级非遗名录的对应关联 |
| **开放 API** | 面向开发者和研究机构的数据接口服务 |

> 详见 [📖 网站功能介绍文档](./docs/湖北纹案文化展示平台%20—%20网站功能介绍.md)

---

## 🛠️ 技术栈

### 前端

| 技术 | 说明 |
|------|------|
| [Next.js 16.2.1](https://nextjs.org/) (App Router) | 核心框架，SSR + SEO 优先 |
| [TypeScript 5](https://www.typescriptlang.org/) | 全类型安全 |
| [Tailwind CSS v4](https://tailwindcss.com/) | 样式解决方案 |
| [Framer Motion](https://www.framer.com/motion/) | 动效与动画 |
| [Three.js / React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | 3D 渲染（文创预览器）|
| [Deck.gl](https://deck.gl/) + 高德地图 | 3D 交互地图 |
| [D3.js](https://d3js.org/) | 知识图谱力导向图 |
| [Zustand](https://zustand-demo.pmnd.rs/) + TanStack Query | 状态管理 |

### 后端 & 数据库

| 技术 | 说明 |
|------|------|
| [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) | 后端接口层 (BFF) |
| [Supabase PostgreSQL](https://supabase.com/) | 核心数据库，包含 PostGIS 地理空间与 pgvector 向量检索 |
| [阿里云 OSS](https://www.aliyun.com/product/oss) | 对象存储（纹案图片、3D 模型）|
| [NextAuth.js](https://next-auth.js.org/) + [阿里云邮件推送](https://www.aliyun.com/product/directmail) | 用户认证体系（邮件验证码/无密码登录）|
| [阿里云 Redis](https://www.aliyun.com/product/kvstore) | 缓存（热点数据、会话管理）|

### AI 服务

| 功能 | 模型 / 方案 |
|------|------------|
| 纹饰图案生成 | 豆包 Seedream 5.0 (火山引擎) |
| 图片/文本内容审核 | 豆包大模型 2.0 多模态 |
| 以图搜图 | 豆包视觉理解模型 + pgvector |
| 颜色提取 | Canvas k-means（无 API 成本）|
| 模型精调（未来）| 火山方舟 LoRA 云端微调 |

> **0 GPU 方案**：所有 AI 能力均通过火山引擎 API 按量调用，无需自建 GPU 服务器，初期 AI 月成本约 300-400 元。

---

## 📂 项目结构

```
HBPattern/
├── docs/                        # 项目文档
│   ├── 湖北纹案文化展示平台 — 网站功能介绍.md
│   └── 湖北纹案-具体技术架构规划.md
├── src/
│   ├── app/                     # Next.js App Router 路由
│   │   ├── (public)/            # 公开页面
│   │   │   ├── page.tsx         # 首页
│   │   │   ├── gallery/         # 纹案画廊
│   │   │   ├── map/             # 3D 文化地图
│   │   │   ├── timeline/        # 演化时间线
│   │   │   ├── search/          # 高级搜索
│   │   │   ├── create/          # AI 创作中心
│   │   │   ├── community/       # 社区互动
│   │   │   └── profile/         # 个人中心
│   │   ├── (admin)/             # 管理后台
│   │   └── api/                 # API Routes
│   ├── components/              # 可复用组件
│   ├── lib/                     # 工具库（数据库、OSS 客户端等）
│   ├── stores/                  # Zustand 状态管理
│   └── types/                   # TypeScript 类型定义
├── prisma/
│   └── schema.prisma            # 数据库 Schema（18 张表）
└── sql/
    └── migrations/              # PostgreSQL 迁移脚本
```

---

## 🚀 快速开始

### 环境要求

- Node.js 20+
- npm 或 pnpm
- 阿里云账号（RDS PostgreSQL + OSS + Redis）
- 火山引擎账号（用于 AI API）

### 1. 克隆项目

```bash
git clone https://github.com/AIMFllys/HBPattern.git
cd HBPattern
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

新建 `.env.local` 文件：

```env
# 阿里云 RDS PostgreSQL
DATABASE_URL=postgresql://user:password@your-rds-host:5432/hbpattern

# 阿里云 OSS
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=hbpattern-assets
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret

# 阿里云 Redis
REDIS_URL=redis://:password@your-redis-host:6379

# NextAuth.js
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000

# 高德地图
NEXT_PUBLIC_AMAP_KEY=your-amap-key

# 火山引擎 (豆包 AI)
VOLCENGINE_API_KEY=your-volcengine-api-key
```

### 4. 初始化数据库

```bash
# 在 RDS 中启用扩展并执行迁移
npx prisma db push
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

---

## 🗺️ 开发路线图

| 阶段 | 目标 | 状态 |
|:---:|------|:---:|
| **Phase 1** | 基础建设：画廊、地图基础、用户系统、收藏、版权标注 | 📋 规划中 |
| **Phase 2** | 视觉体验：3D 地图特效、3D 文创预览器、演化时间线、通知系统 | ⏳ 待开始 |
| **Phase 3** | AI 深化：AI 图案生成、以图搜图、举报治理、贡献者等级 | ⏳ 待开始 |
| **Phase 4** | 生态扩展：多语言、Deep Zoom、教育模块、开放 API | ⏳ 待开始 |

---

## 🤝 参与贡献

欢迎各种形式的贡献！无论是：

- 🐛 提交 Bug 报告
- 💡 提出新功能想法
- 📖 完善文档
- 🎨 贡献纹案图片（需附版权声明）
- 💻 提交代码

请按照以下流程参与贡献：

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "feat: add your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

---

## 📋 版权说明

- **源代码**：[MIT License](./LICENSE)，© 2026 HBPattern Contributors
- **纹案图片**：已收录的纹案图片各自遵守其标注的版权协议（公有领域 / CC 协议 / 原创声明），请查阅各纹案详情页的版权声明
- **AI 生成内容**：标注"AI 生成"标记，版权归上传用户所有

---

## 📬 联系我们

- 📮 GitHub Issues: [提交问题](https://github.com/AIMFllys/HBPattern/issues)
- 🌐 网站（暂定）: [HBpattern.husteread.com](https://HBpattern.husteread.com)

---

<div align="center">

**让每一幅湖北纹绣，都能跨越时间，被世界看见。**

⭐ 如果这个项目对您有帮助，欢迎 Star 支持！

</div>
