# Supabase migrations

The live database was originally provisioned out-of-band (no migration history
existed in the repo). These SQL files make the schema **reproducible and
reviewable**. Apply them, in order, via the Supabase SQL editor, the Supabase
CLI (`supabase db push` against a linked project), or `psql`.

| File | Purpose | Risk |
|------|---------|------|
| `0001_performance_indexes.sql` | Indexes for hot query paths + `pg_trgm` search | Additive, safe |
| `0002_rls_policies.sql` | Row Level Security policies (security gate) | **Test on a branch first** |
| `0003_hp_toggle_like.sql` | Reference definition of the like-toggle RPC | `CREATE OR REPLACE`; diff vs live first |

## Recommended apply order & verification

1. **Branch first.** Create a Supabase preview branch (or a staging project) and
   apply `0001` → `0003` there.
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

> Seeding note: once RLS is enabled, `prisma/seed.ts` and the `scripts/import-*`
> importers must run with `SUPABASE_SERVICE_ROLE_KEY` set (the service role
> bypasses RLS); the anon key will be rejected for authenticated inserts.

## Data-access decision (Prisma vs Supabase)

Resolved: **`prisma/schema.prisma` is the canonical schema-of-record only.**
Runtime data access is 100% Supabase-direct (`@supabase/ssr` PostgREST + the
`hp_toggle_like` RPC + Storage); `src/lib/db.ts` (the Prisma client) is not
imported anywhere and is excluded from typecheck. Keep the Prisma schema as
living documentation that these SQL migrations are kept consistent with; do not
wire Prisma into the request path unless a future migration to it is explicitly
planned.
