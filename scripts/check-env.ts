/**
 * Environment variable validation script.
 * Runs automatically before `npm run build` (prebuild) to catch missing
 * configuration early, and can be run manually: npx tsx scripts/check-env.ts
 *
 * 部署平台（EdgeOne / Vercel）的「构建环境变量」会注入到 process.env，
 * 本脚本通过 @next/env 的 loadEnvConfig 合并本地 .env 文件后，
 * 再额外兜底直接读 process.env，避免平台注入但 .env 文件不存在的场景漏检。
 */

import { loadEnvConfig } from '@next/env'

// Load .env / .env.local / .env.production exactly like Next.js does, so this
// script sees the same variables the build/runtime will.
loadEnvConfig(process.cwd())

/**
 * 从 process.env 读取（loadEnvConfig 会把 .env 文件的值合并到 process.env，
 * 但平台 CI 注入的变量已经在 process.env 里了，统一从这里读即可）。
 */
function getEnv(name: string): string | undefined {
  return process.env[name]
}

/** Hard requirements — missing any of these aborts the build.
 * NEXT_PUBLIC_* 在构建时打入前端代码，运行时必需。
 * DATABASE_URL / DIRECT_URL 仅运维脚本（scripts/check-db-security.ts、
 * scripts/seed.ts）使用，应用运行时不读取，但 prebuild 阶段校验可提前发现配置缺失。
 *
 * EdgeOne 部署场景：如果控制台未配置真实 DB 连接串，可填占位符
 * （如 postgresql://placeholder）使构建通过 —— 应用运行时实际不读取这俩。
 */
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
    const value = getEnv(varName)
    if (!value) {
      missing.push(varName)
      console.log(`  ❌ ${varName} — MISSING`)
    } else {
      console.log(`  ✅ ${varName} — ${mask(value)}`)
    }
  }

  for (const varName of RECOMMENDED_VARS) {
    const value = getEnv(varName)
    if (!value) {
      console.log(`  ⚠️  ${varName} — not set (recommended for production)`)
    } else {
      console.log(`  ✅ ${varName} — ${mask(value)}`)
    }
  }

  console.log('')

  if (missing.length > 0) {
    console.error(`❌ Missing ${missing.length} required variable(s).`)
    console.error('   Local dev: create .env.local with the missing values.')
    console.error('   EdgeOne/Vercel: add them in the project "Build Environment Variables".')
    console.error('   Note: NEXT_PUBLIC_* MUST be available at build time (inlined into bundle).')
    process.exit(1)
  }

  console.log('✅ All required environment variables present.')
}

checkEnv()
