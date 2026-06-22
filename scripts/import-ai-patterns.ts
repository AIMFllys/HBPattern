/**
 * Script to import 50 AI-generated patterns from local artifacts to Supabase.
 * 
 * Usage: npx tsx scripts/import-ai-patterns.ts
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const BUCKET = 'pattern-images'

// Directory holding the AI-generated source images. Configure via env to avoid
// committing machine-specific paths (see AGENTS.md). Example:
//   AI_IMAGES_DIR=/path/to/ai-images npx tsx scripts/import-ai-patterns.ts
const AI_IMAGES_DIR: string = (() => {
  const dir = process.env.AI_IMAGES_DIR
  if (!dir) {
    console.error('❌ AI_IMAGES_DIR is not set. Point it at the directory of AI-generated images.')
    process.exit(1)
  }
  return dir
})()

async function getAdminUser() {
  return '00000000-0000-0000-0009-000000000001'
}

async function getOrCreateRegion(name: string) {
  const { data } = await supabase.from('hp_regions').select('id').eq('name', name).maybeSingle()
  if (data) return data.id
  const { data: newReg } = await supabase.from('hp_regions').insert({ name, province: '湖北' }).select('id').single()
  return newReg?.id
}

async function getOrCreateTechnique(name: string) {
  const { data } = await supabase.from('hp_techniques').select('id').eq('name', name).maybeSingle()
  if (data) return data.id
  const { data: newTech } = await supabase.from('hp_techniques').insert({ name, category: 'AI 创新' }).select('id').single()
  return newTech?.id
}

const themeMapping: Record<string, { region: string, technique: string, era: string, descPrefix: string }> = {
  'chu_cyberpunk': { region: '荆州', technique: '赛博朋克风', era: '当代创新', descPrefix: '楚风赛博朋克：' },
  'tujia_minimalist': { region: '恩施', technique: '极简主义', era: '当代创新', descPrefix: '极简土家织锦：' },
  'neo_chinese_3d': { region: '黄梅', technique: '3D 渲染', era: '当代创新', descPrefix: '3D新中式挑花：' },
  'han_glassmorphism': { region: '武汉', technique: '毛玻璃 UI', era: '当代创新', descPrefix: '汉绣琉璃质感：' },
  'bronze_light': { region: '随州', technique: '微距光影', era: '当代创新', descPrefix: '青铜光影重构：' },
}

async function main() {
  console.log('🚀 Starting AI patterns import...')
  
  const files = fs.readdirSync(AI_IMAGES_DIR).filter(f => f.endsWith('.png'))
  console.log(`Found ${files.length} AI images to process.`)
  
  const adminId = await getAdminUser()

  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    console.log(`\n⏳ [${i + 1}/${files.length}] Processing: ${filename}`)
    
    // Determine theme from filename
    let themeKey = 'chu_cyberpunk'
    if (filename.includes('tujia')) themeKey = 'tujia_minimalist'
    if (filename.includes('neo_chinese')) themeKey = 'neo_chinese_3d'
    if (filename.includes('han_glassmorphism')) themeKey = 'han_glassmorphism'
    if (filename.includes('bronze_light')) themeKey = 'bronze_light'
    
    const theme = themeMapping[themeKey]
    const patternName = `AI 创新生成 - ${theme.technique} #${Math.floor(Math.random() * 10000)}`
    
    const filePath = path.join(AI_IMAGES_DIR, filename)
    const fileBuffer = fs.readFileSync(filePath)
    
    // 1. Upload to Supabase Storage
    const storagePath = `ai-generated/${filename}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      })
      
    if (uploadError) {
      console.log(`  ❌ Upload failed: ${uploadError.message}`)
      continue
    }
    
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    console.log(`  ✅ Uploaded to Storage: ${publicUrl}`)
    
    // 2. Resolve Relations
    const regionId = await getOrCreateRegion(theme.region)
    const techniqueId = await getOrCreateTechnique(theme.technique)
    
    // 3. Insert into database
    const { data: pattern, error: insertError } = await supabase.from('hp_patterns').insert({
      name: patternName,
      description: `${theme.descPrefix}使用 AI 生图技术生成的创新纹样，探索传统文化与现代审美的结合。文件：${filename}`,
      era: theme.era,
      is_ai_generated: true,
      status: 'approved',
      uploader_id: adminId,
      region_id: regionId,
      technique_id: techniqueId,
      color_palette: ['#0f172a', '#3b82f6', '#10b981'], // Mock palette
      view_count: Math.floor(Math.random() * 1000),
      like_count: Math.floor(Math.random() * 200),
    }).select('id').single()
    
    if (insertError || !pattern) {
      console.log(`  ❌ Database insert failed: ${insertError?.message}`)
      continue
    }
    
    // 4. Insert media
    await supabase.from('hp_pattern_media').insert({
      pattern_id: pattern.id,
      url: publicUrl,
      media_type: 'image',
      sort_order: 0
    })
    
    console.log(`  ✅ Successfully imported AI pattern ID: ${pattern.id}`)
  }
  
  console.log('\n🎉 AI patterns import completed!')
}

main().catch(console.error)
