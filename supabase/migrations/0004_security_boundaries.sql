-- ============================================================================
-- 收紧 0002/0003 已放开、但列与可见性未分开的边界。
--
-- 本文件只追加对象，不改写 0002、0003。已执行过旧迁移的库按 0000→0004 再跑这一份。
-- 不在这里为 storage.objects 建策略：仓库里没有桶策略，新建一条会让现有公开图片 URL 失效。
--
-- 数据库维护角色（属主 / superuser / BYPASSRLS，含 service_role）的直接写入仍放行，
-- 种子和 SQL 编辑器不走 anon key。anon / authenticated 走下面的触发器与策略。
-- ============================================================================

-- ── hp_users：普通登录用户不能改角色、贡献分、等级 ───────────────────────────
-- 没有资料行时 hp_is_admin() 为 false，插入仍写成 user，不把缺行当成管理员拒绝。
-- 更新只回写这三列的旧值，缺列或只改昵称/头像/邮箱/last_login 都不拒绝整行。

CREATE OR REPLACE FUNCTION public.hp_guard_user_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR EXISTS (
       SELECT 1
       FROM pg_catalog.pg_roles AS r
       WHERE r.rolname = current_user
         AND (r.rolsuper OR r.rolbypassrls)
     )
     OR public.hp_is_admin()
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
    NEW.contribution_points := 0;
    NEW.contributor_level := 'newcomer';
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.contribution_points := OLD.contribution_points;
  NEW.contributor_level := OLD.contributor_level;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hp_users_guard_privileged_columns ON public.hp_users;
CREATE TRIGGER hp_users_guard_privileged_columns
  BEFORE INSERT OR UPDATE ON public.hp_users
  FOR EACH ROW
  EXECUTE FUNCTION public.hp_guard_user_privileged_columns();

REVOKE ALL ON FUNCTION public.hp_guard_user_privileged_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hp_guard_user_privileged_columns() FROM anon;
REVOKE ALL ON FUNCTION public.hp_guard_user_privileged_columns() FROM authenticated;

-- 表 SELECT 只放行本人或管理员。公开昵称/头像走下面的 security barrier 视图，
-- 不用 USING (true) 配合整表列授权。
DROP POLICY IF EXISTS hp_users_select ON public.hp_users;
CREATE POLICY hp_users_select ON public.hp_users
  FOR SELECT
  USING (id = auth.uid() OR public.hp_is_admin());

DROP VIEW IF EXISTS public.hp_user_public;
CREATE VIEW public.hp_user_public
WITH (security_barrier = true, security_invoker = false) AS
SELECT u.id, u.nickname, u.avatar_url
FROM public.hp_users AS u;

COMMENT ON VIEW public.hp_user_public IS
  'Public profile columns only. security_invoker is off so comment lists can read other users'' nickname and avatar while hp_users SELECT stays self-or-admin.';

CREATE OR REPLACE FUNCTION public.hp_user_public_reject_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION 'hp_user_public is read-only' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS hp_user_public_reject_write ON public.hp_user_public;
CREATE TRIGGER hp_user_public_reject_write
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.hp_user_public
  FOR EACH ROW
  EXECUTE FUNCTION public.hp_user_public_reject_write();

REVOKE ALL ON FUNCTION public.hp_user_public_reject_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hp_user_public_reject_write() FROM anon;
REVOKE ALL ON FUNCTION public.hp_user_public_reject_write() FROM authenticated;

REVOKE ALL ON TABLE public.hp_user_public FROM PUBLIC;
REVOKE ALL ON TABLE public.hp_user_public FROM anon;
REVOKE ALL ON TABLE public.hp_user_public FROM authenticated;
GRANT SELECT ON TABLE public.hp_user_public TO anon, authenticated;

-- ── hp_patterns：非管理员不能自批状态，也不能改三项计数 ─────────────────────
-- like_count 只在 hp_toggle_like 体内 set_config(..., true) 且当前用户是该函数属主时放行。
-- 维护角色的直接写入不设置这个 GUC，因此仍走上面的整行放行，种子计数不会被清零。

CREATE OR REPLACE FUNCTION public.hp_guard_pattern_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_allow_like boolean := pg_catalog.current_setting('hp.allow_like_count', true)
    IS NOT DISTINCT FROM 'true';
  v_like_owner name;
  v_privileged boolean;
BEGIN
  SELECT r.rolsuper OR r.rolbypassrls
    INTO v_privileged
  FROM pg_catalog.pg_roles AS r
  WHERE r.rolname = current_user;

  IF (
       current_user IN ('postgres', 'supabase_admin', 'service_role')
       OR COALESCE(v_privileged, false)
     )
     AND NOT v_allow_like
  THEN
    RETURN NEW;
  END IF;

  IF public.hp_is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.like_count := 0;
    NEW.view_count := 0;
    NEW.comment_count := 0;
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.view_count := OLD.view_count;
  NEW.comment_count := OLD.comment_count;

  -- identity 参数不含形参名，用 regprocedure 锁定 (uuid) 这个签名。
  SELECT pg_catalog.pg_get_userbyid(p.proowner)
    INTO v_like_owner
  FROM pg_catalog.pg_proc AS p
  WHERE p.oid = pg_catalog.to_regprocedure('public.hp_toggle_like(uuid)');

  IF NOT (v_allow_like AND current_user IS NOT DISTINCT FROM v_like_owner) THEN
    NEW.like_count := OLD.like_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hp_patterns_guard_sensitive_columns ON public.hp_patterns;
CREATE TRIGGER hp_patterns_guard_sensitive_columns
  BEFORE INSERT OR UPDATE ON public.hp_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.hp_guard_pattern_sensitive_columns();

REVOKE ALL ON FUNCTION public.hp_guard_pattern_sensitive_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hp_guard_pattern_sensitive_columns() FROM anon;
REVOKE ALL ON FUNCTION public.hp_guard_pattern_sensitive_columns() FROM authenticated;

-- ── hp_pattern_media：未公开纹样的媒体只给上传者和管理员 ─────────────────────
DROP POLICY IF EXISTS hp_pattern_media_select ON public.hp_pattern_media;
CREATE POLICY hp_pattern_media_select ON public.hp_pattern_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.hp_patterns AS p
      WHERE p.id = pattern_id
        AND (
          p.status IN ('approved', 'featured')
          OR p.uploader_id = auth.uid()
          OR public.hp_is_admin()
        )
    )
  );

-- ── hp_toggle_like：非公开纹样不改计数；执行权只留给 authenticated ───────────
CREATE OR REPLACE FUNCTION public.hp_toggle_like(p_pattern_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user   uuid := auth.uid();
  v_status public.hp_pattern_status;
  v_delta  integer;
  v_liked  boolean;
  v_count  integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  SELECT status
    INTO v_status
  FROM public.hp_patterns
  WHERE id = p_pattern_id
  FOR UPDATE;

  IF NOT FOUND OR v_status NOT IN ('approved', 'featured') THEN
    RAISE EXCEPTION 'PATTERN_NOT_PUBLIC' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.hp_user_likes
    WHERE user_id = v_user
      AND pattern_id = p_pattern_id
  ) THEN
    DELETE FROM public.hp_user_likes
      WHERE user_id = v_user
        AND pattern_id = p_pattern_id;
    v_delta := -1;
    v_liked := false;
  ELSE
    INSERT INTO public.hp_user_likes (user_id, pattern_id)
      VALUES (v_user, p_pattern_id)
      ON CONFLICT (user_id, pattern_id) DO NOTHING;
    v_delta := 1;
    v_liked := true;
  END IF;

  -- is_local = true：只在本事务内有效，并在更新结束后清掉。
  PERFORM pg_catalog.set_config('hp.allow_like_count', 'true', true);
  BEGIN
    UPDATE public.hp_patterns
      SET like_count = GREATEST(0, like_count + v_delta)
      WHERE id = p_pattern_id
        AND status IN ('approved', 'featured')
      RETURNING like_count INTO v_count;
    PERFORM pg_catalog.set_config('hp.allow_like_count', 'false', true);
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM pg_catalog.set_config('hp.allow_like_count', 'false', true);
      RAISE;
  END;

  IF v_count IS NULL THEN
    RAISE EXCEPTION 'PATTERN_NOT_PUBLIC' USING ERRCODE = '42501';
  END IF;

  RETURN pg_catalog.json_build_object('liked', v_liked, 'like_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.hp_toggle_like(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hp_toggle_like(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.hp_toggle_like(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.hp_toggle_like(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.hp_toggle_like(uuid) TO authenticated;

-- ── hp_comments：读写与纹样是否对外可见绑定 ───────────────────────────────────
-- 插入不改 status。应用 POST 仍写入 approved，本触发器只在 UPDATE 时钉住 pattern_id/status/user_id。

CREATE OR REPLACE FUNCTION public.hp_guard_comment_author_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_privileged boolean;
BEGIN
  -- 父评论约束不能写进策略：策略里再查 hp_comments 会递归。
  -- 先钉住作者不能改的列，再按最终 pattern_id 核对父评论。
  SELECT r.rolsuper OR r.rolbypassrls
    INTO v_privileged
  FROM pg_catalog.pg_roles AS r
  WHERE r.rolname = current_user;

  IF TG_OP = 'UPDATE'
     AND NOT (
       current_user IN ('postgres', 'supabase_admin', 'service_role')
       OR COALESCE(v_privileged, false)
       OR public.hp_is_admin()
     )
  THEN
    NEW.pattern_id := OLD.pattern_id;
    NEW.status := OLD.status;
    NEW.user_id := OLD.user_id;
  END IF;

  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.hp_comments AS parent
    WHERE parent.id = NEW.parent_id
      AND parent.pattern_id = NEW.pattern_id
  ) THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'comment parent must belong to the same pattern'
        USING ERRCODE = '23514';
    END IF;
    NEW.parent_id := OLD.parent_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hp_comments_guard_author_columns ON public.hp_comments;
CREATE TRIGGER hp_comments_guard_author_columns
  BEFORE INSERT OR UPDATE ON public.hp_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.hp_guard_comment_author_columns();

REVOKE ALL ON FUNCTION public.hp_guard_comment_author_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hp_guard_comment_author_columns() FROM anon;
REVOKE ALL ON FUNCTION public.hp_guard_comment_author_columns() FROM authenticated;

DROP POLICY IF EXISTS hp_comments_select ON public.hp_comments;
CREATE POLICY hp_comments_select ON public.hp_comments
  FOR SELECT
  USING (
    public.hp_is_admin()
    OR user_id = auth.uid()
    OR (
      status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM public.hp_patterns AS p
        WHERE p.id = pattern_id
          AND p.status IN ('approved', 'featured')
      )
    )
  );

DROP POLICY IF EXISTS hp_comments_insert_self ON public.hp_comments;
CREATE POLICY hp_comments_insert_self ON public.hp_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.hp_patterns AS p
      WHERE p.id = hp_comments.pattern_id
        AND p.status IN ('approved', 'featured')
    )
  );

DROP POLICY IF EXISTS hp_comments_modify_owner_admin ON public.hp_comments;
CREATE POLICY hp_comments_modify_owner_admin ON public.hp_comments
  FOR UPDATE
  USING (user_id = auth.uid() OR public.hp_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.hp_is_admin());

-- ── hp_user_badges：启用 RLS，不建策略（默认拒绝，不对匿名开放）──────────────
ALTER TABLE public.hp_user_badges ENABLE ROW LEVEL SECURITY;
