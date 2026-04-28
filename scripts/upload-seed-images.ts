/**
 * Upload seed pattern images to Supabase Storage.
 * Usage: npx tsx scripts/upload-seed-images.ts
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BUCKET = 'pattern-images'

const imageMap: Record<string, string> = {
  'seed/fengniaowen.webp': 'fengniaowen',
  'seed/yunleiwen.webp': 'yunleiwen',
  'seed/xilankapu.webp': 'xilankapu',
  'seed/fengchuanmudan.webp': 'fengchuanmudan',
  'seed/huangmeitiaohua.webp': 'huangmeitiaohua',
  'seed/ai-fengniao.webp': 'ai_fengniao',
}

// Directory where generated images are stored
const IMAGES_DIR = String.raw`C:\Users\Lenovo\.gemini\antigravity\brain\92d124e6-0069-4a6b-965c-b531cd383849`

async function findImage(baseName: string): Promise<string | null> {
  const files = fs.readdirSync(IMAGES_DIR)
  const match = files.find(f => f.startsWith(baseName + '_') && f.endsWith('.png'))
  return match ? path.join(IMAGES_DIR, match) : null
}

async function main() {
  console.log('🚀 Uploading seed images to Supabase Storage...\n')
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log(`Bucket: ${BUCKET}\n`)

  let uploaded = 0
  let failed = 0

  for (const [storagePath, localName] of Object.entries(imageMap)) {
    const localFile = await findImage(localName)
    if (!localFile) {
      console.log(`❌ ${localName} — local file not found`)
      failed++
      continue
    }

    const fileBuffer = fs.readFileSync(localFile)
    
    // Upload as PNG (Supabase will serve it regardless of extension)
    // The bucket allows image/webp and image/png
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) {
      console.log(`❌ ${storagePath} — ${error.message}`)
      failed++
    } else {
      console.log(`✅ ${storagePath} — uploaded (${(fileBuffer.length / 1024).toFixed(1)} KB)`)
      uploaded++
    }
  }

  console.log(`\n📊 Results: ${uploaded} uploaded, ${failed} failed`)
}

main().catch(console.error)
