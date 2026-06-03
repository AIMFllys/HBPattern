-- ============================================================================
-- hp_toggle_like(p_pattern_id uuid) — atomic like toggle used by
-- src/app/api/patterns/[id]/like/route.ts (supabase.rpc('hp_toggle_like', ...)).
--
-- This function already exists in the live database but was never committed,
-- so the schema is not reproducible from source. This is the reference
-- definition matching the route's expected return contract
-- ({ liked: boolean, like_count: number }). It runs SECURITY DEFINER so the
-- counter update works under the RLS policies in 0002.
--
-- ⚠️ Before applying to the live DB, diff against the existing definition
--    (\df+ public.hp_toggle_like) — CREATE OR REPLACE with the same signature
--    is safe, but confirm the live behavior matches before overwriting.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.hp_toggle_like(p_pattern_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_liked boolean;
  v_count int;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING errcode = '28000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.hp_user_likes
    WHERE user_id = v_user AND pattern_id = p_pattern_id
  ) THEN
    DELETE FROM public.hp_user_likes
      WHERE user_id = v_user AND pattern_id = p_pattern_id;
    UPDATE public.hp_patterns
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = p_pattern_id
      RETURNING like_count INTO v_count;
    v_liked := false;
  ELSE
    INSERT INTO public.hp_user_likes (user_id, pattern_id)
      VALUES (v_user, p_pattern_id)
      ON CONFLICT (user_id, pattern_id) DO NOTHING;
    UPDATE public.hp_patterns
      SET like_count = like_count + 1
      WHERE id = p_pattern_id
      RETURNING like_count INTO v_count;
    v_liked := true;
  END IF;

  RETURN json_build_object('liked', v_liked, 'like_count', COALESCE(v_count, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.hp_toggle_like(uuid) TO authenticated;
