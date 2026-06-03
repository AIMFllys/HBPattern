-- ============================================================================
-- Row Level Security (RLS) policies for HBPattern.
--
-- WHY THIS IS CRITICAL: the app authenticates with the PUBLIC anon key
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY) for ALL requests, relying on the user's
-- forwarded session cookie for auth.uid(). With RLS OFF, anyone holding the
-- anon key (it ships to the browser) can read/write every table directly via
-- PostgREST, bypassing the app-layer requireAuth()/requireRole() checks.
-- These policies move enforcement into the database where it belongs.
--
-- ⚠️ APPLY WITH CARE — TEST FIRST ON A SUPABASE BRANCH / STAGING DB.
--   Enabling RLS without correct policies DENIES ALL access and will take the
--   live site down. The policies below mirror the current app behavior, but you
--   MUST smoke-test every page (gallery list/detail, comments, likes, upload,
--   moderate, login) on a branch before promoting to production.
--
-- NOTE ON SEEDING: once RLS is on, the seed/import scripts must use the
--   SUPABASE_SERVICE_ROLE_KEY (service role bypasses RLS); the anon key will be
--   rejected for inserts that require auth.uid().
-- ============================================================================

-- Admin check as SECURITY DEFINER to avoid recursive RLS evaluation on hp_users.
CREATE OR REPLACE FUNCTION public.hp_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hp_users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
$$;

-- ── hp_users ────────────────────────────────────────────────────────────────
ALTER TABLE public.hp_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hp_users_select ON public.hp_users;
CREATE POLICY hp_users_select ON public.hp_users
  FOR SELECT USING (true); -- public profile fields (nickname/avatar shown on comments)
DROP POLICY IF EXISTS hp_users_insert_self ON public.hp_users;
CREATE POLICY hp_users_insert_self ON public.hp_users
  FOR INSERT WITH CHECK (id = auth.uid()); -- profile bootstrap in auth/callback
DROP POLICY IF EXISTS hp_users_update_self ON public.hp_users;
CREATE POLICY hp_users_update_self ON public.hp_users
  FOR UPDATE USING (id = auth.uid() OR hp_is_admin()) WITH CHECK (id = auth.uid() OR hp_is_admin());

-- ── hp_patterns ───────────────────────────────────────────────────────────────
ALTER TABLE public.hp_patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hp_patterns_select ON public.hp_patterns;
CREATE POLICY hp_patterns_select ON public.hp_patterns
  FOR SELECT USING (
    status IN ('approved','featured') OR uploader_id = auth.uid() OR hp_is_admin()
  );
DROP POLICY IF EXISTS hp_patterns_insert_owner ON public.hp_patterns;
CREATE POLICY hp_patterns_insert_owner ON public.hp_patterns
  FOR INSERT WITH CHECK (uploader_id = auth.uid());
DROP POLICY IF EXISTS hp_patterns_update_owner_admin ON public.hp_patterns;
CREATE POLICY hp_patterns_update_owner_admin ON public.hp_patterns
  FOR UPDATE USING (uploader_id = auth.uid() OR hp_is_admin())
  WITH CHECK (uploader_id = auth.uid() OR hp_is_admin());
DROP POLICY IF EXISTS hp_patterns_delete_owner_admin ON public.hp_patterns;
CREATE POLICY hp_patterns_delete_owner_admin ON public.hp_patterns
  FOR DELETE USING (uploader_id = auth.uid() OR hp_is_admin());

-- ── hp_pattern_media ──────────────────────────────────────────────────────────
ALTER TABLE public.hp_pattern_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hp_pattern_media_select ON public.hp_pattern_media;
CREATE POLICY hp_pattern_media_select ON public.hp_pattern_media
  FOR SELECT USING (true); -- URLs point at public storage objects anyway
DROP POLICY IF EXISTS hp_pattern_media_write_owner ON public.hp_pattern_media;
CREATE POLICY hp_pattern_media_write_owner ON public.hp_pattern_media
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hp_patterns p
            WHERE p.id = pattern_id AND (p.uploader_id = auth.uid() OR hp_is_admin()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.hp_patterns p
            WHERE p.id = pattern_id AND (p.uploader_id = auth.uid() OR hp_is_admin()))
  );

-- ── hp_comments ───────────────────────────────────────────────────────────────
ALTER TABLE public.hp_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hp_comments_select ON public.hp_comments;
CREATE POLICY hp_comments_select ON public.hp_comments
  FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR hp_is_admin());
DROP POLICY IF EXISTS hp_comments_insert_self ON public.hp_comments;
CREATE POLICY hp_comments_insert_self ON public.hp_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS hp_comments_modify_owner_admin ON public.hp_comments;
CREATE POLICY hp_comments_modify_owner_admin ON public.hp_comments
  FOR UPDATE USING (user_id = auth.uid() OR hp_is_admin())
  WITH CHECK (user_id = auth.uid() OR hp_is_admin());
DROP POLICY IF EXISTS hp_comments_delete_owner_admin ON public.hp_comments;
CREATE POLICY hp_comments_delete_owner_admin ON public.hp_comments
  FOR DELETE USING (user_id = auth.uid() OR hp_is_admin());

-- ── hp_user_likes (also written via the hp_toggle_like SECURITY DEFINER RPC) ───
ALTER TABLE public.hp_user_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hp_user_likes_select_self ON public.hp_user_likes;
CREATE POLICY hp_user_likes_select_self ON public.hp_user_likes
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS hp_user_likes_insert_self ON public.hp_user_likes;
CREATE POLICY hp_user_likes_insert_self ON public.hp_user_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS hp_user_likes_delete_self ON public.hp_user_likes;
CREATE POLICY hp_user_likes_delete_self ON public.hp_user_likes
  FOR DELETE USING (user_id = auth.uid());

-- ── Public read-only reference tables ─────────────────────────────────────────
-- Writes happen only via seeds/imports using the service role (bypasses RLS).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'hp_regions','hp_techniques','hp_ich_records','hp_tags',
    'hp_pattern_tags','hp_pattern_relations'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_public_read ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY %I_public_read ON public.%I FOR SELECT USING (true);', t, t);
  END LOOP;
END $$;

-- ── Not-yet-used feature tables: enable RLS (deny-by-default is the secure
--    posture; service role still works for admin/seed). Add per-feature policies
--    when these features ship. ────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'hp_collections','hp_collection_items','hp_user_view_history',
    'hp_notifications','hp_reports','hp_ai_tasks','hp_api_keys'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END $$;
