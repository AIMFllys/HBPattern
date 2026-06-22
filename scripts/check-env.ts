/**
 * Environment variable validation script.
 * Runs automatically before `npm run build` (prebuild) to catch missing
 * configuration early, and can be run manually: npx tsx scripts/check-env.ts
 */

import { loadEnvConfig } from '@next/env'

// Load .env / .env.local / .env.production exactly like Next.js does, so this
// script sees the same variables the build/runtime will.
loadEnvConfig(process.cwd())

/** Hard requirements — missing any of these aborts the build. */
const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
] as const

/** Recommended for production — warn but do not fail (have safe fallbacks). */
const RECOMMENDED_VARS = [
  'NEXT_PUBLIC_SITE_URL', // metadataBase / canonical & OG URLs; falls back to localhost
] as const

function mask(value: string): string {
  return value.length > 10 ? value.slice(0, 6) + '...' + value.slice(-4) : '***'
}

function checkEnv() {
  console.log('🔍 Checking environment variables...\n')

  const missing: string[] = []

  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName]
    if (!value) {
      missing.push(varName)
      console.log(`  ❌ ${varName} — MISSING`)
    } else {
      console.log(`  ✅ ${varName} — ${mask(value)}`)
    }
  }

  for (const varName of RECOMMENDED_VARS) {
    const value = process.env[varName]
    if (!value) {
      console.log(`  ⚠️  ${varName} — not set (recommended for production)`)
    } else {
      console.log(`  ✅ ${varName} — ${mask(value)}`)
    }
  }

  console.log('')

  if (missing.length > 0) {
    console.error(`❌ Missing ${missing.length} required variable(s). Check .env.local`)
    process.exit(1)
  }

  console.log('✅ All required environment variables present.')
}

checkEnv()
