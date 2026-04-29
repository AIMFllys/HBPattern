# Next.js ↔ FastAPI 通信协议与 API 契约

> 基于 api-patterns skill 的 REST 原则、版本策略、鉴权模式和错误格式设计。

---

## 1. API 风格选择

### 决策依据（api-patterns/api-style 决策树）

| 因素 | 本项目情况 | 结论 |
|------|-----------|------|
| **消费者** | 仅 Next.js 后端调用，非公开 API | 内网 REST 即可，无需 GraphQL 复杂度 |
| **类型安全** | 跨语言（TS ↔ Python），tRPC 不适用 | REST + OpenAPI Spec 生成类型 |
| **实时性** | 流式 LLM 输出需要 SSE | REST + SSE（Server-Sent Events） |

**选型：RESTful API + SSE（流式场景）**

---

## 2. 端点设计（遵循 REST NOUNS 原则）

### 基础路径

```
Base URL: http://127.0.0.1:8000/api/v1
```

### 端点清单

| Method | Endpoint | 描述 | 响应类型 |
|--------|----------|------|---------|
| `POST` | `/documents` | 上传并解析文档 | JSON |
| `GET` | `/documents/{id}` | 获取解析后的文档详情 | JSON |
| `DELETE` | `/documents/{id}` | 删除文档及其向量 | 204 |
| `POST` | `/documents/{id}/chunks` | 对指定文档执行分块 + Embedding | JSON |
| `POST` | `/chat/completions` | RAG 增强的对话（流式） | SSE |
| `POST` | `/search` | 语义搜索知识库 | JSON |
| `GET` | `/health` | 健康检查 | JSON |
| `POST` | `/algorithms/{slug}/invoke` | 调用特定论文算法 | JSON |

### 遵循原则
- ✅ 使用名词（`/documents`），不使用动词（~~`/parseDocument`~~）
- ✅ 使用复数形式
- ✅ 嵌套不超过 3 层
- ✅ 使用 kebab-case

---

## 3. 版本策略

采用 **URI 路径版本化**：

```
/api/v1/documents
/api/v2/documents  (未来)
```

**理由**：
- 简单直观，适合内网服务
- 宝塔 Nginx 转发配置清晰
- 未来升级 v2 时 v1 可继续运行一段时间

---

## 4. 认证机制（服务间通信）

### Service Token 方案

由于 FastAPI 仅接受来自 Next.js 的内网请求（不直接暴露给浏览器），采用 **预共享 Service Token** 方案：

```
┌──────────┐     Authorization: Bearer <SERVICE_TOKEN>     ┌──────────┐
│ Next.js  │ ──────────────────────────────────────────────► │ FastAPI  │
│ (BFF)    │           http://127.0.0.1:8000                │ (AI)     │
└──────────┘                                                └──────────┘
```

**环境变量**：
```env
# Next.js .env
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_TOKEN=<random-256-bit-hex>

# FastAPI .env
SERVICE_TOKEN=<same-random-256-bit-hex>
```

**FastAPI 端校验（Dependency Injection）**：
```python
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_service_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> None:
    if credentials.credentials != settings.SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid service token")
```

### 用户身份传递

对于需要用户上下文的请求，Next.js 在 Header 中传递已验证的用户 ID：

```
X-User-ID: <supabase-user-uuid>
```

FastAPI 信任此 Header（因为已通过 Service Token 验证请求来源）。

---

## 5. 统一响应格式（Envelope Pattern）

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "processing_time_ms": 1250
  }
}
```

### 分页响应

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_PARSE_FAILED",
    "message": "无法解析上传的 PDF 文件",
    "details": [
      { "field": "file", "issue": "PDF 格式损坏或加密" }
    ]
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### HTTP 状态码使用

| 状态码 | 场景 |
|--------|------|
| `200` | 查询/操作成功 |
| `201` | 文档/资源创建成功 |
| `204` | 删除成功（无返回体） |
| `400` | 请求参数无效 |
| `401` | Service Token 缺失或无效 |
| `404` | 文档/资源不存在 |
| `413` | 上传文件过大 |
| `422` | 请求格式正确但业务校验失败 |
| `429` | 请求过于频繁（Rate Limiting） |
| `500` | AI 引擎内部错误 |
| `503` | 模型加载中/服务暂不可用 |

---

## 6. 流式响应协议（SSE）

对于 `/chat/completions` 等需要流式输出的端点，采用 Server-Sent Events：

```
Content-Type: text/event-stream

data: {"type": "chunk", "content": "根据"}
data: {"type": "chunk", "content": "论文"}
data: {"type": "chunk", "content": "中的发现..."}
data: {"type": "sources", "content": [{"doc_id": "xxx", "chunk_id": "yyy", "score": 0.92}]}
data: {"type": "done", "usage": {"prompt_tokens": 512, "completion_tokens": 128}}
```

---

## 7. 速率限制（Rate Limiting）

| 端点类别 | 限制 | 算法 |
|---------|------|------|
| 文档上传 `/documents` | 10 次/分钟/用户 | 滑动窗口 |
| 对话 `/chat/completions` | 30 次/分钟/用户 | 令牌桶 |
| 搜索 `/search` | 60 次/分钟/用户 | 滑动窗口 |
| 健康检查 `/health` | 不限制 | — |

由 FastAPI 中间件（如 `slowapi`）实现，基于 `X-User-ID` Header 识别用户。

---

## 8. 超时与重试策略

### Next.js 端（调用方）

| 端点类型 | 超时 | 重试 |
|---------|------|------|
| 文档解析（同步） | 60s | 不重试（幂等性不保证） |
| 对话流式 | 120s | 不重试 |
| 语义搜索 | 10s | 最多 2 次，间隔 500ms |
| 健康检查 | 3s | 最多 3 次，间隔 1s |

### 优雅降级

当 AI 服务不可用时，Next.js 应：
1. 返回友好的错误提示（"AI 服务暂时不可用，请稍后再试"）
2. 记录告警日志
3. 业务功能（浏览、上传、个人中心等）不受影响
