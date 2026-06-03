/**
 * Database production-readiness diagnostic (READ-ONLY).
 *
 * Verifies the security posture that the app layer assumes:
 *  - Row Level Security (RLS) enabled on every hp_* table (the anon key is
 *    public, so without RLS the app-layer auth checks can be bypassed via
 *    direct PostgREST access).
 *  - Existing RLS policies per table.
 *  - Presence of the hp_toggle_like RPC the like route depends on.
 *  - Whether the performance indexes from supabase/migrations exist.
 *
 * Prints no secrets. Usage: npx tsx scripts/check-db-security.ts
 */
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { Client } from 'pg'

// Prefer the pooler (DATABASE_URL, IPv4) — direct host is often IPv6-only.
const conn = process.env.DATABASE_URL || process.env.DIRECT_URL
if (!conn) {
  console.error('❌ DIRECT_URL / DATABASE_URL not set')
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  await client.connect()

  // 1. RLS status for all public hp_* tables
  const rls = await client.query<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>(`
    SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'hp\\_%'
    ORDER BY c.relname
  `)

  // 2. Policies per table
  const policies = await client.query<{ tablename: string; policyname: string; cmd: string; roles: string[] }>(`
    SELECT tablename, policyname, cmd, roles::text[] AS roles
    FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname
  `)

  // 3. hp_toggle_like RPC
  const rpc = await client.query<{ proname: string }>(`
    SELECT p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'hp_toggle_like'
  `)

  // 4. Indexes on hp_patterns
  const idx = await client.query<{ tablename: string; indexname: string }>(`
    SELECT tablename, indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename IN ('hp_patterns','hp_pattern_media','hp_comments')
    ORDER BY tablename, indexname
  `)

  await client.end()

  const policyCount = new Map<string, number>()
  for (const p of policies.rows) policyCount.set(p.tablename, (policyCount.get(p.tablename) ?? 0) + 1)

  console.log('\n=== RLS status (public.hp_*) ===')
  let rlsGaps = 0
  for (const t of rls.rows) {
    const n = policyCount.get(t.relname) ?? 0
    const flag = t.relrowsecurity ? '🔒 RLS ON' : '🔓 RLS OFF'
    if (!t.relrowsecurity) rlsGaps++
    const warn = t.relrowsecurity && n === 0 ? '  ⚠️ enabled but NO policies (denies all)' : ''
    console.log(`  ${flag}  ${t.relname}  — policies: ${n}${warn}`)
  }

  console.log('\n=== Policies ===')
  if (policies.rows.length === 0) console.log('  (none)')
  for (const p of policies.rows) console.log(`  ${p.tablename}: ${p.policyname} [${p.cmd}] roles=${p.roles.join(',')}`)

  console.log('\n=== RPC hp_toggle_like ===')
  console.log(rpc.rows.length ? '  ✅ present' : '  ❌ MISSING (like route will 500)')

  console.log('\n=== Indexes (hp_patterns/media/comments) ===')
  for (const r of idx.rows) console.log(`  ${r.tablename}.${r.indexname}`)

  console.log('\n=== Summary ===')
  console.log(`  Tables: ${rls.rows.length}, RLS OFF on ${rlsGaps}`)
  if (rlsGaps > 0) {
    console.log('  🔴 RLS is OFF on some tables — public anon key can access them directly. BLOCKER.')
  } else {
    console.log('  ✅ RLS enabled on all hp_* tables.')
  }
}

main().catch((e) => { console.error('DB check failed:', e.message); process.exit(2) })
