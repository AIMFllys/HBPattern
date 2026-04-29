# FastAPI AI 服务项目结构与技术规范

> 基于 python-patterns skill 的框架选型、异步策略、项目结构和测试原则设计。

---

## 1. 框架选型确认

### 决策路径（python-patterns 决策树）

```
What are you building?
├── AI/ML API serving
│   └── FastAPI (Pydantic, async, uvicorn)  ✅ 命中
```

**FastAPI 的关键优势**：
- **Pydantic v2** 原生集成：请求/响应自动校验，自动生成 OpenAPI 文档
- **async def** 原生支持：适配 I/O 密集型的 LLM API 调用和数据库查询
- **依赖注入**：Service Token 鉴权、数据库会话管理等可复用依赖
- **uvicorn + Gunicorn**：生产级 ASGI 部署

---

## 2. 项目结构（按层级组织）

```
ai-service/                          # 独立仓库或 monorepo 子目录
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app 实例、中间件、路由挂载
│   ├── config.py                    # Pydantic Settings（环境变量管理）
│   ├── dependencies.py              # 共享依赖（DB session, auth, etc.）
│   │
│   ├── api/                         # 路由层（Controller）
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py            # v1 总路由
│   │   │   ├── documents.py         # 文档上传/管理端点
│   │   │   ├── chat.py              # RAG 对话端点
│   │   │   ├── search.py            # 语义搜索端点
│   │   │   ├── algorithms.py        # 论文算法调用端点
│   │   │   └── health.py            # 健康检查
│   │   └── deps.py                  # API 层共享依赖
│   │
│   ├── services/                    # 业务逻辑层（Service）
│   │   ├── __init__.py
│   │   ├── document_parser.py       # PDF/Word/LaTeX 解析
│   │   ├── chunker.py               # 文本分块策略
│   │   ├── embedder.py              # Embedding 生成（API 或本地模型）
│   │   ├── retriever.py             # 向量检索 + 混合检索
│   │   ├── rag_chain.py             # RAG 编排（检索 → 增强 → 生成）
│   │   └── algorithm_registry.py    # 论文算法注册表
│   │
│   ├── models/                      # 数据库模型（SQLAlchemy）
│   │   ├── __init__.py
│   │   ├── document.py
│   │   ├── chunk.py
│   │   └── knowledge_base.py
│   │
│   ├── schemas/                     # Pydantic 请求/响应模型
│   │   ├── __init__.py
│   │   ├── document.py
│   │   ├── chat.py
│   │   ├── search.py
│   │   └── common.py                # 通用 Envelope 响应模型
│   │
│   └── core/                        # 核心工具
│       ├── __init__.py
│       ├── exceptions.py            # 自定义异常类
│       ├── error_handlers.py        # 异常处理器
│       ├── middleware.py            # 日志、CORS、请求 ID
│       └── logging.py              # 结构化日志配置
│
├── alembic/                         # 数据库迁移
│   ├── env.py
│   └── versions/
│
├── tests/                           # 测试
│   ├── conftest.py                  # Fixtures（db_session, client, etc.）
│   ├── unit/
│   │   ├── test_chunker.py
│   │   └── test_embedder.py
│   └── integration/
│       ├── test_documents_api.py
│       └── test_chat_api.py
│
├── scripts/                         # 运维脚本
│   ├── seed_test_data.py
│   └── benchmark_search.py
│
├── .env.example                     # 环境变量模板
├── pyproject.toml                   # 项目配置 + 依赖（替代 requirements.txt）
├── Dockerfile                       # 容器化部署（可选）
├── alembic.ini                      # Alembic 配置
└── README.md
```

### 结构设计原则
- **按层级组织**（routes → services → models），而非按功能。原因：项目初期功能模块少，按层级更清晰
- **业务逻辑不放在路由层**：routes 只做参数校验和响应封装，核心逻辑在 services
- **schemas 与 models 分离**：Pydantic schemas 负责 API 边界校验，SQLAlchemy models 负责数据库映射

---

## 3. Async vs Sync 策略

### 决策原则（python-patterns 黄金法则）

```
I/O-bound → async（等待外部资源）
CPU-bound → sync + multiprocessing（计算）
```

### 本项目具体决策

| 操作 | 类型 | 使用 |
|------|------|------|
| 数据库查询 | I/O | `async def` + asyncpg |
| 调用 LLM API | I/O | `async def` + httpx |
| 调用 Embedding API | I/O | `async def` + httpx |
| PDF 文档解析 | CPU | `def`（FastAPI 自动放入线程池） |
| 本地模型推理 | CPU/GPU | `def`（线程池）或 Celery worker |
| 文件上传至 Supabase Storage | I/O | `async def` |

### 异步库选择

| 需求 | 库 |
|------|---|
| HTTP 客户端 | `httpx`（AsyncClient） |
| PostgreSQL | `asyncpg` |
| Redis | `redis[hiredis]` async |
| 文件 I/O | `aiofiles` |
| ORM | SQLAlchemy 2.0 async |

---

## 4. 错误处理策略

### 自定义异常体系

```python
# app/core/exceptions.py

class AIServiceError(Exception):
    """AI 服务基础异常"""
    def __init__(self, code: str, message: str, status_code: int = 500):
        self.code = code
        self.message = message
        self.status_code = status_code

class DocumentParseError(AIServiceError):
    def __init__(self, message: str = "文档解析失败"):
        super().__init__("DOCUMENT_PARSE_FAILED", message, 422)

class EmbeddingError(AIServiceError):
    def __init__(self, message: str = "向量生成失败"):
        super().__init__("EMBEDDING_FAILED", message, 502)

class ModelNotAvailableError(AIServiceError):
    def __init__(self, message: str = "模型暂不可用"):
        super().__init__("MODEL_UNAVAILABLE", message, 503)

class RateLimitExceededError(AIServiceError):
    def __init__(self):
        super().__init__("RATE_LIMIT_EXCEEDED", "请求过于频繁", 429)
```

### 全局异常处理器

```python
# app/core/error_handlers.py

from fastapi import Request
from fastapi.responses import JSONResponse

async def ai_service_error_handler(request: Request, exc: AIServiceError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
            },
            "meta": {
                "request_id": request.state.request_id,
            }
        }
    )
```

### 原则
- ✅ 在 services 层抛出领域异常
- ✅ 在 error_handlers 统一捕获和格式化
- ✅ 客户端（Next.js）收到干净的错误 JSON
- ❌ 永不暴露堆栈跟踪（安全）

---

## 5. 后台任务策略

### 选择指南（python-patterns 背景任务决策树）

| 任务 | 耗时 | 方案 |
|------|------|------|
| 文档解析 + Embedding（单文档） | 10-60s | FastAPI `BackgroundTasks` |
| 批量知识库导入（多文档） | 5-30min | Celery + Redis（Phase 3） |
| 模型微调训练 | 数小时 | Celery + GPU Worker（Phase 3） |
| 定时清理过期数据 | 秒级 | APScheduler 或 cron |

### Phase 2 初期方案（无 Celery）

```python
from fastapi import BackgroundTasks

@router.post("/documents")
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_user_id),
):
    # 1. 立即创建文档记录（status=pending）
    doc = await document_service.create(file, user_id)

    # 2. 后台异步处理解析和 Embedding
    background_tasks.add_task(
        document_service.parse_and_embed, doc.id
    )

    # 3. 立即返回文档 ID，前端轮询状态
    return {"success": True, "data": {"id": doc.id, "status": "pending"}}
```

---

## 6. 核心依赖清单

```toml
# pyproject.toml [project.dependencies]

[project]
name = "hbpattern-ai-service"
version = "0.1.0"
requires-python = ">=3.11"

dependencies = [
    # Web 框架
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "gunicorn>=22.0.0",

    # 数据库
    "sqlalchemy[asyncio]>=2.0.0",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    "pgvector>=0.3.0",           # pgvector Python 支持

    # AI/ML
    "langchain>=0.3.0",
    "langchain-community>=0.3.0",
    "openai>=1.40.0",            # Embedding + Chat API
    "httpx>=0.27.0",             # 异步 HTTP 客户端

    # 文档解析
    "pymupdf>=1.24.0",           # PDF 解析
    "python-docx>=1.1.0",        # Word 文档解析
    "unstructured>=0.15.0",      # 通用文档解析（可选）

    # 工具
    "pydantic-settings>=2.4.0",  # 环境变量管理
    "python-multipart>=0.0.9",   # 文件上传支持
    "slowapi>=0.1.9",            # 速率限制

    # 可观测性
    "structlog>=24.0.0",         # 结构化日志
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",             # TestClient
    "ruff>=0.5.0",               # Linter + Formatter
]
```

---

## 7. 测试策略

### 测试金字塔

| 层级 | 覆盖重点 | 工具 |
|------|---------|------|
| **Unit** | chunker 分块算法、embedder 向量化逻辑 | pytest |
| **Integration** | API 端点完整请求/响应、数据库读写 | pytest + httpx TestClient |
| **E2E** | 完整 RAG 流程（上传 → 解析 → 对话） | pytest + 测试数据库 |

### 关键 Fixtures

```python
# tests/conftest.py

@pytest.fixture
async def db_session():
    """异步数据库会话"""
    ...

@pytest.fixture
def client(db_session):
    """带鉴权的测试客户端"""
    ...

@pytest.fixture
def sample_pdf():
    """测试用 PDF 文件"""
    ...
```
