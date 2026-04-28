/**
 * Database seed script.
 * Inserts initial pattern data from mock fixtures into Supabase/Prisma.
 *
 * Usage: npx tsx scripts/seed.ts
 */

// TODO: Phase 1 — implement with Prisma client
// import { PrismaClient } from '@prisma/client'
// import { mockPatterns } from '../src/app/_mock/patterns'

async function main() {
  console.log('🌱 Seeding database...')

  // const prisma = new PrismaClient()
  // for (const p of mockPatterns) {
  //   await prisma.pattern.upsert({
  //     where: { id: p.id },
  //     update: {},
  //     create: { ... },
  //   })
  // }

  console.log('✅ Seed complete.')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
