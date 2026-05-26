-- ============================================================================
-- Performance indexes for HBPattern hot query paths.
--
-- Status: NOT YET APPLIED to the live database. The live schema was created
-- out-of-band (there is no Prisma migration history in this repo). Apply this
-- file via the Supabase SQL editor or `supabase db push` before production
-- launch, and keep future DDL changes in this directory so the schema is
-- reproducible from source control.
--
-- All statements are additive and idempotent (IF NOT EXISTS). On large tables,
-- prefer running each CREATE INDEX with CONCURRENTLY outside a transaction to
-- avoid write locks.
-- ============================================================================

-- hp_patterns: the gallery/home/map/workshop list query filters on status and
-- sorts on created_at / view_count / like_count; detail/related filter on
-- technique_id; uploads filter on era and region_id.
CREATE INDEX IF NOT EXISTS idx_hp_patterns_status_created_at
  ON hp_patterns (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hp_patterns_status_view_count
  ON hp_patterns (status, view_count DESC);
CREATE INDEX IF NOT EXISTS idx_hp_patterns_status_like_count
  ON hp_patterns (status, like_count DESC);
CREATE INDEX IF NOT EXISTS idx_hp_patterns_region_id
  ON hp_patterns (region_id);
CREATE INDEX IF NOT EXISTS idx_hp_patterns_technique_id
  ON hp_patterns (technique_id);
CREATE INDEX IF NOT EXISTS idx_hp_patterns_era
  ON hp_patterns (era);

-- Foreign-key columns Postgres does not auto-index, used by nested embeds/joins.
CREATE INDEX IF NOT EXISTS idx_hp_pattern_media_pattern_id
  ON hp_pattern_media (pattern_id);
CREATE INDEX IF NOT EXISTS idx_hp_comments_pattern_id_status
  ON hp_comments (pattern_id, status);

-- Trigram indexes to support the public search (ILIKE '%term%' on name/description),
-- which is otherwise unindexable due to the leading wildcard.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_hp_patterns_name_trgm
  ON hp_patterns USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hp_patterns_description_trgm
  ON hp_patterns USING gin (description gin_trgm_ops);
