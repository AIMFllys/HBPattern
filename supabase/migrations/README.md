# Supabase migrations

These SQL files are the **canonical schema-of-record** for the database. Apply
them, in order, via the Supabase SQL editor, the Supabase CLI (`supabase db
push` against a linked project), or `psql`.

| File | Purpose | Risk |
|------|---------|------|
| `0000_init.sql` | Full schema DDL: extensions, enums, all `hp_*` tables, FKs, `updated_at` trigger | Fresh install; on existing DB diff first |
| `0001_performance_indexes.sql` | Indexes for hot query paths + `pg_trgm` search | Additive, safe |
| `0002_rls_policies.sql` | Row Level Security policies (security gate) | **Test on a branch first** |
| `0003_hp_toggle_like.sql` | Reference definition of the like-toggle RPC | `CREATE OR REPLACE`; diff vs live first |

## Recommended apply order & verification

1. **Branch first.** Create a Supabase preview branch (or a staging project) and
   apply `0000` → `0003` there.
2. After `0002`, smoke-test every path with a real session: gallery list/detail,
   post a comment, like/unlike, upload (owner), moderate (admin), login/logout.
   Enabling RLS with a wrong policy denies access and will take pages down.
3. Run the security advisors: `get_advisors(type: "security")` (MCP) or the
   Dashboard → Advisors. Expect **no "RLS disabled" findings** on `public.hp_*`.
4. Verify locally any time with: `npx tsx scripts/check-db-security.ts`
   (read-only; prints RLS status, policies, the RPC, and indexes). Requires
   network reachability to the DB (the sandbox CI used for this review could not
   reach it).
5. Promote to production only after the branch passes.

> Seeding note: once RLS is enabled, `scripts/seed.ts` and the `scripts/import-*`
> importers must run with `SUPABASE_SERVICE_ROLE_KEY` set (the service role
> bypasses RLS); the anon key will be rejected for authenticated inserts.

## Data-access note

Runtime data access is 100% Supabase-direct (`@supabase/ssr` PostgREST + the
`hp_toggle_like` RPC + Storage). There is no Prisma client in the runtime path;
`pg` is kept only as a devDependency for the `scripts/check-db-security.ts`
diagnostic. Keep these SQL migrations as the single source of truth for schema.
