/**
 * Environment variable validation script.
 * Run before dev/build to catch missing configuration early.
 *
 * Usage: npx tsx scripts/check-env.ts
 */

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
] as const

function checkEnv() {
  console.log('🔍 Checking environment variables...\n')

  const missing: string[] = []

  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName]
    if (!value) {
      missing.push(varName)
      console.log(`  ❌ ${varName} — MISSING`)
    } else {
      // Mask sensitive values
      const masked = value.length > 10
        ? value.slice(0, 6) + '...' + value.slice(-4)
        : '***'
      console.log(`  ✅ ${varName} — ${masked}`)
    }
  }

  console.log('')

  if (missing.length > 0) {
    console.error(`❌ Missing ${missing.length} required variable(s). Check .env.local`)
    process.exit(1)
  }

  console.log('✅ All environment variables present.')
}

checkEnv()
