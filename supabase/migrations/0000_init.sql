-- ============================================================================
-- HBPattern 初始化 schema — 完整建表 DDL
--
-- 本文件是数据库结构的唯一真相源（schema-of-record），由 prisma/schema.prisma
-- 转写而来。后续 0001（索引）、0002（RLS）、0003（RPC）依赖本文件。
--
-- 适用环境：Supabase PostgreSQL 17（PostGIS + pgvector + pg_trgm）
-- 应用方式：Supabase SQL Editor 或 `supabase db push` 或 `psql` 执行
-- ============================================================================

-- ─── 扩展 ────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()（PG13+ 内置，保险起见）

-- ─── 枚举类型 ────────────────────────────────────────────────────────────────
CREATE TYPE hp_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE hp_contributor_level AS ENUM ('newcomer', 'contributor', 'expert', 'inheritor');
CREATE TYPE hp_pattern_status AS ENUM ('pending', 'approved', 'rejected', 'featured');
CREATE TYPE hp_license_type AS ENUM ('public_domain', 'cc_by', 'cc_by_nc_sa', 'copyright');
CREATE TYPE hp_media_type AS ENUM ('image', 'video', '3d_model', 'deep_zoom');
CREATE TYPE hp_relation_type AS ENUM ('evolved_from', 'influenced_by', 'variant_of', 'same_origin');
CREATE TYPE hp_technique_category AS ENUM ('embroidery', 'dyeing', 'weaving', 'printing');
CREATE TYPE hp_ich_level AS ENUM ('national', 'provincial', 'municipal');
CREATE TYPE hp_ich_protection_status AS ENUM ('endangered', 'general', 'good');
CREATE TYPE hp_comment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE hp_notification_type AS ENUM ('comment_reply', 'moderation_result', 'system', 'badge_earned');
CREATE TYPE hp_report_target_type AS ENUM ('pattern', 'comment', 'user');
CREATE TYPE hp_report_reason AS ENUM ('misinformation', 'copyright', 'low_quality', 'offensive', 'other');
CREATE TYPE hp_report_status AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE hp_ai_task_type AS ENUM ('generate', 'texture_map', 'moderate', 'embed_image');
CREATE TYPE hp_ai_task_status AS ENUM ('queued', 'processing', 'completed', 'failed');
CREATE TYPE hp_api_key_tier AS ENUM ('free', 'basic', 'premium');
CREATE TYPE hp_api_key_purpose AS ENUM ('academic', 'personal', 'commercial');

-- ─── 表 ──────────────────────────────────────────────────────────────────────

-- hp_users：与 auth.users.id 通过 UUID 关联（不建物理 FK，由 Supabase Auth 管理）
CREATE TABLE hp_users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL UNIQUE,
  nickname              TEXT NOT NULL,
  avatar_url            TEXT,
  role                  hp_role NOT NULL DEFAULT 'user',
  contribution_points   INTEGER NOT NULL DEFAULT 0,
  contributor_level     hp_contributor_level NOT NULL DEFAULT 'newcomer',
  preferences           JSONB,
  agreed_privacy_policy BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login            TIMESTAMPTZ
);

-- hp_regions：地区字典，boundary 为多边形边界
CREATE TABLE hp_regions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  province       TEXT NOT NULL,
  city           TEXT,
  cultural_intro TEXT,
  boundary       geometry(MultiPolygon, 4326)
);

-- hp_ich_records：非遗记录
CREATE TABLE hp_ich_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  official_code     TEXT,
  level             hp_ich_level NOT NULL,
  protection_status hp_ich_protection_status NOT NULL,
  inheritor_info    TEXT,
  description       TEXT
);

-- hp_techniques：技法字典
CREATE TABLE hp_techniques (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  category         hp_technique_category NOT NULL,
  description      TEXT,
  origin_region_id UUID REFERENCES hp_regions(id),
  difficulty_level INTEGER NOT NULL DEFAULT 1
);

-- hp_tags：标签
CREATE TABLE hp_tags (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL UNIQUE,
  category TEXT
);

-- hp_patterns：纹样核心表
CREATE TABLE hp_patterns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  description           TEXT,
  historical_background TEXT,
  era                   TEXT,
  region_id             UUID REFERENCES hp_regions(id),
  uploader_id           UUID NOT NULL REFERENCES hp_users(id),
  technique_id          UUID REFERENCES hp_techniques(id),
  ich_record_id         UUID REFERENCES hp_ich_records(id),
  is_ai_generated       BOOLEAN NOT NULL DEFAULT FALSE,
  ai_model_version      TEXT,
  status                hp_pattern_status NOT NULL DEFAULT 'pending',
  license_type          hp_license_type NOT NULL DEFAULT 'copyright',
  source_declaration    TEXT,
  copyright_holder      TEXT,
  color_palette         JSONB,
  metadata              JSONB,
  view_count            INTEGER NOT NULL DEFAULT 0,
  like_count            INTEGER NOT NULL DEFAULT 0,
  comment_count         INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  location              geometry(Point, 4326),
  embedding             vector(512)
);

-- hp_pattern_media：纹样媒体
CREATE TABLE hp_pattern_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id      UUID NOT NULL REFERENCES hp_patterns(id),
  media_type      hp_media_type NOT NULL DEFAULT 'image',
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  watermarked_url TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  metadata        JSONB
);

-- hp_pattern_relations：纹样间关系
CREATE TABLE hp_pattern_relations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_pattern_id UUID NOT NULL REFERENCES hp_patterns(id),
  target_pattern_id UUID NOT NULL REFERENCES hp_patterns(id),
  relation_type     hp_relation_type NOT NULL,
  description       TEXT,
  confidence        DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  created_by        UUID NOT NULL REFERENCES hp_users(id)
);

-- hp_pattern_tags：纹样-标签关联
CREATE TABLE hp_pattern_tags (
  pattern_id UUID NOT NULL REFERENCES hp_patterns(id),
  tag_id     UUID NOT NULL REFERENCES hp_tags(id),
  PRIMARY KEY (pattern_id, tag_id)
);

-- hp_comments：评论
CREATE TABLE hp_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id        UUID NOT NULL REFERENCES hp_patterns(id),
  user_id           UUID NOT NULL REFERENCES hp_users(id),
  parent_id         UUID REFERENCES hp_comments(id),
  content           TEXT NOT NULL,
  status            hp_comment_status NOT NULL DEFAULT 'pending',
  moderation_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- hp_user_likes：点赞
CREATE TABLE hp_user_likes (
  user_id    UUID NOT NULL REFERENCES hp_users(id),
  pattern_id UUID NOT NULL REFERENCES hp_patterns(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pattern_id)
);

-- hp_collections：收藏夹
CREATE TABLE hp_collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES hp_users(id),
  name        TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- hp_collection_items：收藏项
CREATE TABLE hp_collection_items (
  collection_id UUID NOT NULL REFERENCES hp_collections(id),
  pattern_id    UUID NOT NULL REFERENCES hp_patterns(id),
  note          TEXT,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, pattern_id)
);

-- hp_user_view_history：浏览历史
CREATE TABLE hp_user_view_history (
  user_id               UUID NOT NULL REFERENCES hp_users(id),
  pattern_id            UUID NOT NULL REFERENCES hp_patterns(id),
  viewed_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  view_duration_seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, pattern_id, viewed_at)
);

-- hp_notifications：通知
CREATE TABLE hp_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES hp_users(id),
  type        hp_notification_type NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  related_url TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- hp_reports：举报
CREATE TABLE hp_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES hp_users(id),
  target_type hp_report_target_type NOT NULL,
  target_id   UUID NOT NULL,
  reason      hp_report_reason NOT NULL,
  description TEXT,
  status      hp_report_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES hp_users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- hp_user_badges：用户徽章
CREATE TABLE hp_user_badges (
  user_id   UUID NOT NULL REFERENCES hp_users(id),
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_key)
);

-- hp_ai_tasks：AI 任务队列
CREATE TABLE hp_ai_tasks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES hp_users(id),
  task_type          hp_ai_task_type NOT NULL,
  prompt             TEXT NOT NULL,
  parameters         JSONB,
  status             hp_ai_task_status NOT NULL DEFAULT 'queued',
  result_url         TEXT,
  processing_time_ms INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at       TIMESTAMPTZ
);

-- hp_api_keys：开放 API 密钥
CREATE TABLE hp_api_keys (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES hp_users(id),
  key_hash            TEXT NOT NULL UNIQUE,
  tier                hp_api_key_tier NOT NULL DEFAULT 'free',
  purpose             hp_api_key_purpose NOT NULL DEFAULT 'personal',
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at        TIMESTAMPTZ
);

-- ─── updated_at 触发器 ───────────────────────────────────────────────────────
-- hp_patterns.updated_at 由 Prisma @updatedAt 管理；移除 Prisma 后用触发器自动维护。
CREATE OR REPLACE FUNCTION hp_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hp_patterns_updated_at
  BEFORE UPDATE ON hp_patterns
  FOR EACH ROW
  EXECUTE FUNCTION hp_set_updated_at();
