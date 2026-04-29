# 垂直领域 AI 架构演进与后端升级策略

> **文档状态**：Accepted
> **最后审查**：2026-04-29 — 基于 architecture, api-patterns, python-patterns, nodejs-best-practices, database-design, deployment-procedures 六项技能框架审查通过
> **关联文档**：[ADR-001](./adr-001-python-microservice.md) | [通信协议](./api-contract.md) | [数据层设计](./data-layer-design.md) | [部署与运维](./deployment-runbook.md)

---

## 1. 架构演进背景与动机

### 1.1 当前技术栈现状

| 层级 | 技术 | 职责 |
|------|------|------|
| **前端 + SSR** | Next.js 16 (App Router) + React 19 + Tailwind 4 | UI 渲染、路由、SEO |
| **后端逻辑** | Next.js Server Actions / Route Handlers | 鉴权、业务 CRUD、API 调用 |
| **ORM** | Prisma 7.x | 类型安全数据库查询 |
| **数据库** | Supabase (PostgreSQL) | 持久化存储、Auth、RLS |
| **状态管理** | Zustand + TanStack Query | 客户端状态与服务端缓存 |

### 1.2 为什么需要引入 Python 后端

当项目演进到需要支持 **垂直领域 AI 服务**（如基于特定学术论文的知识问答、自定义算法推理）时，现有 Node.js 运行时暴露出三个结构性短板：

| 维度 | Node.js 局限 | Python 优势 |
|------|-------------|-------------|
| **AI 生态** | LangChain.js 功能滞后于 Python 版；无 PyTorch 级别原生支持 | PyTorch, HuggingFace, LlamaIndex, VLLM 等均为 Python 原生 |
| **计算模型** | 单线程事件循环；CPU/GPU 密集任务会阻塞所有 HTTP 请求 | 原生多进程 + asyncio；GPU 调用无事件循环冲突 |
| **论文复现** | 学术开源代码 99% 为 Python；跨语言重写成本高且难以验证正确性 | 直接复用论文源码；NumPy/SciPy/Pandas 等科学计算库成熟 |
| **模型推理** | 无法运行 ONNX/TorchScript 以外的格式；缺乏 GPU 调度能力 | 原生支持 CUDA、TensorRT、vLLM 等推理加速框架 |

### 1.3 核心结论

> **不推翻现有架构，而是采用"BFF + AI 微服务"的双引擎模式。** Next.js 继续扮演业务网关与展示层；Python FastAPI 作为独立的 AI 计算引擎，仅在需要深度计算时被 Next.js 内网调用。

---

## 2. 目标架构设计

### 2.1 系统全景图

```
┌─────────────────────────────────────────────────────┐
│                     用户浏览器                        │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────┐
│              Nginx 反向代理 (宝塔)                    │
│  ┌──────────────┐          ┌──────────────────┐     │
│  │  *.domain/   │          │ *.domain/ai-api/ │     │
│  │  → :3000     │          │ → :8000          │     │
│  └──────┬───────┘          └────────┬─────────┘     │
└─────────┼───────────────────────────┼───────────────┘
          │                           │
          ▼                           ▼
┌─────────────────┐        ┌──────────────────────┐
│  Next.js (BFF)  │ ◄─────►│  FastAPI (AI Engine) │
│  Port: 3000     │ 内网HTTP│  Port: 8000          │
│  PM2 守护       │        │  Gunicorn+Uvicorn    │
│                 │        │                      │
│  职责:          │        │  职责:                │
│  • UI 渲染      │        │  • 文档解析           │
│  • 鉴权/计费    │        │  • Embedding 生成     │
│  • 业务 CRUD    │        │  • RAG 检索编排       │
│  • 简单 LLM 调用│        │  • 模型推理           │
│  • 调度 AI 服务 │        │  • 论文算法服务化     │
└────────┬────────┘        └──────────┬───────────┘
         │                            │
         ▼                            ▼
┌─────────────────────────────────────────────────────┐
│            Supabase (PostgreSQL + pgvector)          │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐     │
│  │  业务表 (Prisma)  │  │  向量表 (pgvector)   │     │
│  │  users, patterns, │  │  document_chunks,    │     │
│  │  workshops...     │  │  embeddings...       │     │
│  └──────────────────┘  └──────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### 2.2 层级职责矩阵

| 层级 | 技术栈 | 核心职责 | 不应做的事 |
|------|--------|---------|-----------|
| **展示与业务层** (BFF) | Next.js + Prisma + Supabase Auth | UI SSR/ISR、用户鉴权、常规业务 CRUD、计费、简单 LLM API 调用 | 文档解析、Embedding 生成、模型推理 |
| **AI 计算引擎** | FastAPI + LangChain/LlamaIndex + PyTorch | 文档结构化解析、向量化、RAG 编排、模型推理、论文算法服务化 | 用户鉴权、页面渲染、业务数据 CRUD |
| **统一数据层** | Supabase PostgreSQL + pgvector | 业务数据持久化、向量存储与检索、文件对象存储 (Storage) | 计算逻辑 |

### 2.3 架构决策验证（基于 Architecture Skill Checklist）

- [x] **需求清晰理解**：垂直领域 AI = 论文解析 + 知识库 RAG + 自研算法推理
- [x] **约束已识别**：个人开发者、宝塔 VPS 部署、预算有限、渐进式演进
- [x] **每个决策都有权衡分析**：见 [ADR-001](./adr-001-python-microservice.md)
- [x] **更简单的替代方案已考虑**：Phase 1 完全不引入 Python，验证需求后再引入
- [x] **团队专业知识匹配**：个人开发者同时具备 JS 和 Python 能力

---

## 3. 演进实施路径 (Roadmap)

### Phase 1：MVP 验证期（当前 → AI 需求确认前）

**目标**：以最低成本验证用户对 AI 功能的需求痛点。

| 维度 | 决策 |
|------|------|
| **AI 能力** | 仅通过 Next.js Route Handlers 调用第三方 LLM API（DeepSeek / OpenAI） |
| **技术新增** | 引入 Vercel AI SDK 或直接 fetch 流式接口 |
| **不做** | 不建 Python 服务、不做本地推理、不做知识库 |
| **验证指标** | 用户是否高频使用 AI 对话？是否有"基于特定文档问答"的需求？ |

**触发进入 Phase 2 的信号**：
- 用户反馈"AI 回答不够准确，需要基于我上传的特定资料"
- 需要处理 PDF/Word/LaTeX 等复杂文档格式
- 通用 LLM 无法满足垂直领域精度要求

### Phase 2：知识库与 RAG 引擎（引入 Python FastAPI）

**目标**：让 AI 精准基于用户上传的学术论文/专业文档进行问答。

| 维度 | 决策 |
|------|------|
| **新增服务** | 独立 FastAPI 项目，暴露 RESTful 内网 API |
| **核心功能** | 文档解析 → 语义分块 → Embedding → pgvector 入库 → 混合检索 → LLM 生成 |
| **Embedding 模型** | 初期使用 API（如 text-embedding-3-small）；后期可切换本地模型 |
| **通信方式** | Next.js → HTTP(S) → FastAPI（内网，携带 Service Token） |
| **部署** | 同一台宝塔服务器，Gunicorn + Uvicorn workers，独立端口 |

**关键技术决策**：
- **Chunking 策略**：语义分块（Semantic Chunking）优于固定长度切割
- **检索策略**：Hybrid Search（pgvector 向量检索 + PostgreSQL 全文检索加权融合）
- **Rerank**：初期可用 Cohere Rerank API；后期自训练 Cross-Encoder

### Phase 3：垂直模型私有化与算法自研

**目标**：基于学术论文设计独特算法，构建竞争壁垒。

| 维度 | 决策 |
|------|------|
| **算力升级** | 将 Python 服务迁移至带 GPU 的云服务器（如 AutoDL、云端 vGPU） |
| **推理框架** | vLLM / TGI 部署微调后的开源模型 |
| **异步任务** | 引入 Celery + Redis 处理长时间训练/批量推理任务 |
| **模型管理** | MLflow 追踪实验、版本化模型产物 |

---

## 4. 后续落地待办项 (Action Items)

### 即刻可做（Phase 1 准备）

- [ ] 在 Next.js 中创建 `src/app/api/ai/chat/route.ts`，实现简单的 LLM 流式调用
- [ ] 调研并选定前端 AI 对话 UI 组件方案

### Phase 2 启动前

- [ ] 在本地搭建 FastAPI 骨架项目，跑通 Hello World 接口
- [ ] 在 Supabase 开启 `pgvector` 扩展（`CREATE EXTENSION IF NOT EXISTS vector;`）
- [ ] 设计 `document_chunks` 和 `embeddings` 表结构
- [ ] 实现 Next.js → FastAPI 的内网通信 + Service Token 鉴权原型
- [ ] 在宝塔安装 Python 项目管理器及虚拟环境

### Phase 3 启动前

- [ ] 评估 GPU 云服务器方案（AutoDL / 恒源云 / AWS GPU 实例）
- [ ] 搭建 Celery + Redis 异步任务基础设施
- [ ] 建立模型版本管理与 A/B 测试流程
