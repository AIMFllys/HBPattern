# 部署与运维手册：双服务宝塔部署

> 基于 deployment-procedures skill 的 5-Phase 部署流程、回滚策略和监控原则设计。

---

## 1. 部署架构概览

```
宝塔面板 VPS
├── Nginx（反向代理）
│   ├── *.domain.com/      → 127.0.0.1:3000 (Next.js)
│   └── *.domain.com/ai-api/ → 127.0.0.1:8000 (FastAPI)
│
├── Node.js 项目（PM2 守护）
│   └── Next.js → Port 3000
│
└── Python 项目（Gunicorn + Uvicorn 守护）
    └── FastAPI → Port 8000
```

---

## 2. 初始环境搭建

### 2.1 宝塔软件安装

| 软件 | 用途 | 安装位置 |
|------|------|---------|
| Nginx | 反向代理 + SSL | 软件商店 |
| Node.js 版本管理器 | 管理 Node.js 运行时 | 软件商店 |
| Python 项目管理器 | 管理 Python 虚拟环境 | 软件商店 |
| PM2 管理器 | Node.js 进程守护 | 软件商店 |

### 2.2 Python 环境配置

```bash
# 在宝塔 Python 项目管理器中
# 1. 安装 Python 3.11+
# 2. 创建虚拟环境

cd /www/wwwroot/hbpattern-ai-service
python3.11 -m venv .venv
source .venv/bin/activate

# 3. 安装依赖
pip install -e ".[dev]"

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际配置
```

### 2.3 环境变量清单

#### Next.js `.env`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Prisma
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# AI 服务通信
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_TOKEN=<生成一个 256-bit 随机十六进制字符串>
```

#### FastAPI `.env`

```env
# 数据库（与 Next.js 共享同一个 Supabase 实例）
DATABASE_URL=postgresql+asyncpg://postgres:xxx@db.xxx.supabase.co:5432/postgres

# 服务鉴权
SERVICE_TOKEN=<与 Next.js 侧相同的 Token>

# LLM API
OPENAI_API_KEY=sk-xxx
DEEPSEEK_API_KEY=sk-xxx

# 向量模型
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# 运行配置
HOST=127.0.0.1
PORT=8000
WORKERS=2
LOG_LEVEL=info
```

---

## 3. 部署流程（遵循 5-Phase 原则）

### Phase 1: PREPARE

```bash
# 拉取最新代码
cd /www/wwwroot/HBPattern
git pull origin main

cd /www/wwwroot/hbpattern-ai-service
git pull origin main

# 检查环境变量
cat .env | grep -v '^#' | grep -v '^$'

# 检查磁盘空间
df -h
```

### Phase 2: BACKUP

```bash
# 宝塔面板 → 数据库 → 备份
# 或手动：
pg_dump $DATABASE_URL > /www/backup/db_$(date +%Y%m%d_%H%M%S).sql
```

### Phase 3: DEPLOY

#### Next.js 部署

```bash
cd /www/wwwroot/HBPattern
npm install
npx prisma generate
npm run build

# 通过宝塔 PM2 管理器重启 Node 项目
# 或命令行：
pm2 restart hbpattern_next
```

#### FastAPI 部署

```bash
cd /www/wwwroot/hbpattern-ai-service
source .venv/bin/activate
pip install -e .

# 运行数据库迁移
alembic upgrade head

# 通过宝塔 Python 项目管理器重启
# 或命令行：
pkill -f "gunicorn app.main:app"
gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 2 \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /www/wwwlogs/ai-service-access.log \
    --error-logfile /www/wwwlogs/ai-service-error.log \
    --daemon
```

### Phase 4: VERIFY

```bash
# 健康检查
curl http://127.0.0.1:3000       # Next.js
curl http://127.0.0.1:8000/api/v1/health   # FastAPI

# 检查错误日志
tail -20 /www/wwwlogs/ai-service-error.log
pm2 logs hbpattern_next --lines 20

# 关键用户流程测试
# - 打开首页，确认渲染正常
# - 登录，确认鉴权正常
# - 测试 AI 对话（如果已启用）
```

### Phase 5: CONFIRM or ROLLBACK

```
✅ 全部正常 → 部署完成，继续监控 1 小时
❌ 发现问题 → 立即回滚（见下方回滚流程）
```

---

## 4. Nginx 反向代理配置

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL（由宝塔自动管理）
    ssl_certificate    /www/server/panel/vhost/cert/your-domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your-domain.com/privkey.pem;

    # AI 服务代理（优先匹配）
    location /ai-api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 流式响应支持
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;

        # 文件上传大小限制
        client_max_body_size 50M;
    }

    # Next.js 代理（默认路由）
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**关键配置说明**：
- `proxy_buffering off`：对 `/ai-api/` 关闭缓冲，确保 SSE 流式响应实时推送
- `client_max_body_size 50M`：允许上传最大 50MB 的论文 PDF
- `proxy_read_timeout 300s`：AI 处理可能耗时较长，延长超时时间

---

## 5. 回滚策略

### 回滚决策矩阵

| 症状 | 行动 |
|------|------|
| 网站完全无法访问 | **立即回滚**：Next.js 恢复上一版本 |
| AI 功能报错但网站正常 | **降级运行**：停止 FastAPI 服务，Next.js 返回"AI 暂不可用" |
| 性能下降 > 50% | **评估回滚**：先检查日志，5 分钟内无法定位则回滚 |
| 非关键小问题 | **前滚修复**：提交修复代码，重新部署 |

### 回滚操作

```bash
# Next.js 回滚
cd /www/wwwroot/HBPattern
git log --oneline -5          # 找到上一个稳定 commit
git checkout <stable-commit>
npm run build
pm2 restart hbpattern_next

# FastAPI 回滚
cd /www/wwwroot/hbpattern-ai-service
git checkout <stable-commit>
source .venv/bin/activate
pip install -e .
alembic downgrade -1          # 回滚最近一次迁移（如需要）
# 重启 gunicorn
```

---

## 6. 监控与日志

### 日志文件位置

| 服务 | 日志路径 |
|------|---------|
| Next.js | `pm2 logs hbpattern_next` 或 `/root/.pm2/logs/` |
| FastAPI access | `/www/wwwlogs/ai-service-access.log` |
| FastAPI error | `/www/wwwlogs/ai-service-error.log` |
| Nginx access | `/www/wwwlogs/your-domain.com.log` |
| Nginx error | `/www/wwwlogs/your-domain.com.error.log` |

### 监控检查清单

| 检查项 | 频率 | 方法 |
|--------|------|------|
| 健康检查端点 | 每 5 分钟 | 宝塔监控 / UptimeRobot |
| 磁盘使用率 | 每日 | 宝塔面板 |
| 内存使用率 | 每日 | 宝塔面板 |
| 错误日志 | 部署后 + 每日 | `tail -f` |
| 响应时间 | 持续 | Nginx access log 分析 |

### 告警设置（宝塔面板）

- 磁盘使用率 > 85% → 告警
- 内存使用率 > 90% → 告警
- CPU 持续 > 80% 超过 5 分钟 → 告警

---

## 7. 服务器资源建议

### 最低配置（Phase 2）

| 资源 | 推荐值 | 理由 |
|------|--------|------|
| CPU | 2 核 | Next.js 构建 + FastAPI worker |
| 内存 | 4GB | Next.js 构建需 2GB+；FastAPI + 模型加载需 1GB+ |
| Swap | 4GB | 防止构建时 OOM |
| 磁盘 | 40GB SSD | 代码 + 依赖 + 日志 + 上传文件 |
| 带宽 | 5Mbps | 常规 Web 访问 |

### Phase 3 升级建议

| 资源 | 推荐值 | 理由 |
|------|--------|------|
| GPU 服务器 | 单独购置 | 本地模型推理（如 Llama-3-8B 需 16GB+ VRAM） |
| Redis | 同一服务器或托管服务 | Celery 任务队列 |
