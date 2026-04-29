# 数据层设计：业务数据 + AI 向量数据统一管理

> 基于 database-design skill 的选型原则、索引策略和迁移安全设计。

---

## 1. 数据库选型验证

### 决策依据（database-design/database-selection 框架）

| 因素 | 分析 | 结论 |
|------|------|------|
| **当前数据库** | Supabase (PostgreSQL) 已稳定运行，19 张业务表已建成 | 不更换数据库 |
| **向量检索需求** | 需要高维向量相似度搜索 | pgvector 扩展完美适配 |
| **是否需要独立向量数据库** | Pinecone/Milvus 等需额外运维和费用 | pgvector 满足初期需求，统一在 PostgreSQL 中 |
| **全文检索需求** | RAG 需要混合检索（向量 + 关键词） | PostgreSQL 内置 `tsvector` 全文检索 |

**结论**：继续使用 Supabase PostgreSQL，通过 `pgvector` 扩展实现向量存储与检索，避免引入额外基础设施。

---

## 2. pgvector 扩展启用

```sql
-- 在 Supabase SQL Editor 中执行
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 3. AI 相关表结构设计

### 3.1 知识库表 `knowledge_bases`

```sql
CREATE TABLE knowledge_bases (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT,
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    chunk_strategy TEXT NOT NULL DEFAULT 'semantic',   -- semantic | fixed | paragraph
    chunk_size    INT NOT NULL DEFAULT 512,
    chunk_overlap INT NOT NULL DEFAULT 50,
    status        TEXT NOT NULL DEFAULT 'active',      -- active | archived
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 策略：用户只能操作自己的知识库
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own knowledge bases"
    ON knowledge_bases FOR ALL
    USING (auth.uid() = user_id);
```

### 3.2 文档表 `documents`

```sql
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    file_path       TEXT,                              -- Supabase Storage 中的路径
    file_type       TEXT NOT NULL,                     -- pdf | docx | md | latex
    file_size_bytes BIGINT,
    page_count      INT,
    parse_status    TEXT NOT NULL DEFAULT 'pending',   -- pending | parsing | completed | failed
    parse_error     TEXT,
    metadata        JSONB DEFAULT '{}',                -- 作者、期刊、年份等元数据
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_documents_knowledge_base ON documents(knowledge_base_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(parse_status);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documents"
    ON documents FOR ALL
    USING (auth.uid() = user_id);
```

### 3.3 文档分块表 `document_chunks`

```sql
CREATE TABLE document_chunks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index   INT NOT NULL,                        -- 在文档中的顺序号
    content       TEXT NOT NULL,                       -- 分块的原始文本
    token_count   INT,                                 -- Token 数量
    page_numbers  INT[],                               -- 来源页码（数组）
    heading       TEXT,                                 -- 所属章节标题
    embedding     vector(1536),                        -- text-embedding-3-small 维度
    metadata      JSONB DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 向量索引（IVFFlat，适合百万级以下数据）
CREATE INDEX idx_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 常规索引
CREATE INDEX idx_chunks_document ON document_chunks(document_id);

-- 全文检索索引（用于 Hybrid Search）
ALTER TABLE document_chunks ADD COLUMN fts tsvector
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX idx_chunks_fts ON document_chunks USING gin(fts);

-- RLS（通过 document -> knowledge_base -> user 级联鉴权）
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own chunks"
    ON document_chunks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_chunks.document_id
            AND d.user_id = auth.uid()
        )
    );
```

### 3.4 对话历史表 `chat_sessions` 和 `chat_messages`

```sql
CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE SET NULL,
    title           TEXT NOT NULL DEFAULT '新对话',
    model           TEXT NOT NULL DEFAULT 'deepseek-chat',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    sources         JSONB DEFAULT '[]',                -- 引用的文档分块 [{chunk_id, score}]
    token_count     INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_session ON chat_messages(session_id, created_at);
```

---

## 4. 向量索引策略

### 索引类型选择

| 索引类型 | 适用数据量 | 构建速度 | 查询精度 | 推荐阶段 |
|---------|-----------|---------|---------|---------|
| **精确搜索**（无索引） | < 1 万条 | 即时 | 100% | Phase 2 初期 |
| **IVFFlat** | 1 万 ~ 100 万 | 快 | 95-99% | Phase 2 中期 |
| **HNSW** | > 100 万 | 慢（构建时） | 99%+ | Phase 3 |

### 距离函数选择

| 函数 | 运算符 | 适用场景 |
|------|--------|---------|
| **余弦相似度** | `<=>` | 文本语义检索（推荐默认） |
| **L2 距离** | `<->` | 图像特征匹配 |
| **内积** | `<#>` | 已归一化的向量 |

### 混合检索示例（Hybrid Search）

```sql
-- 向量检索 + 全文检索加权融合
WITH vector_results AS (
    SELECT id, content, 1 - (embedding <=> $1::vector) AS vector_score
    FROM document_chunks
    WHERE document_id = ANY($2::uuid[])
    ORDER BY embedding <=> $1::vector
    LIMIT 20
),
text_results AS (
    SELECT id, content, ts_rank(fts, websearch_to_tsquery('english', $3)) AS text_score
    FROM document_chunks
    WHERE fts @@ websearch_to_tsquery('english', $3)
    AND document_id = ANY($2::uuid[])
    LIMIT 20
)
SELECT
    COALESCE(v.id, t.id) AS id,
    COALESCE(v.content, t.content) AS content,
    (COALESCE(v.vector_score, 0) * 0.7 + COALESCE(t.text_score, 0) * 0.3) AS combined_score
FROM vector_results v
FULL OUTER JOIN text_results t ON v.id = t.id
ORDER BY combined_score DESC
LIMIT 10;
```

---

## 5. 数据访问模式

### ORM 选择

| 访问方 | ORM | 理由 |
|--------|-----|------|
| **Next.js（业务层）** | Prisma | 已有 19 张表的 Schema 定义；类型安全 |
| **FastAPI（AI 层）** | SQLAlchemy 2.0 async + asyncpg | Python 异步 ORM 标准；原生支持 pgvector |

### 重要原则
- **Prisma 不管理 AI 表**：AI 相关的表（`document_chunks`, `knowledge_bases` 等）由 Python 通过 SQL Migration 管理，不写入 `schema.prisma`，避免两个 ORM 争夺 Schema 所有权。
- **共享表的读取**：如果 Python 需要读取 `users` 表信息，通过 `X-User-ID` Header 从 Next.js 传递，而非直接查询 `auth.users`。

---

## 6. 迁移安全策略

### 迁移管理

| 服务 | 迁移工具 | 迁移目录 |
|------|---------|---------|
| Next.js 业务表 | `prisma migrate deploy` | `prisma/migrations/` |
| AI 相关表 | `alembic upgrade head` | `ai-service/alembic/versions/` |

### 安全原则
1. **永远先在开发分支测试迁移**
2. **AI 表的迁移不得修改或依赖 Prisma 管理的业务表**
3. **每次迁移前备份数据库**（Supabase 自动日备份 + 手动 `pg_dump`）
4. **使用非破坏性迁移**：新增列给默认值，不直接 DROP COLUMN
