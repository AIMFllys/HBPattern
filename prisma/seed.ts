import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  // --- Regions ---
  const wuhan = await prisma.region.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000001', name: '武汉市', province: '湖北省', city: '武汉', cultural_intro: '楚文化核心区域，汉绣发源地' },
  })
  const enshi = await prisma.region.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000002', name: '恩施州', province: '湖北省', city: '恩施', cultural_intro: '土家族苗族聚居区，西兰卡普织锦之乡' },
  })
  const jingzhou = await prisma.region.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000003', name: '荆州市', province: '湖北省', city: '荆州', cultural_intro: '楚国故都，漆器纹饰出土重地' },
  })
  const suizhou = await prisma.region.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000004', name: '随州市', province: '湖北省', city: '随州', cultural_intro: '曾侯乙墓所在地，青铜纹饰宝库' },
  })

  // --- Techniques ---
  const embroidery = await prisma.technique.upsert({
    where: { id: '00000000-0000-0000-0001-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0001-000000000001', name: '刺绣', category: 'embroidery', description: '以针引线在织物上绣制图案的传统工艺' },
  })
  const weaving = await prisma.technique.upsert({
    where: { id: '00000000-0000-0000-0001-000000000002' },
    update: {},
    create: { id: '00000000-0000-0000-0001-000000000002', name: '织锦', category: 'weaving', description: '以经纬线交织形成图案的纺织工艺' },
  })
  const dyeing = await prisma.technique.upsert({
    where: { id: '00000000-0000-0000-0001-000000000003' },
    update: {},
    create: { id: '00000000-0000-0000-0001-000000000003', name: '蜡染', category: 'dyeing', description: '以蜡防染的传统印染工艺' },
  })
  const printing = await prisma.technique.upsert({
    where: { id: '00000000-0000-0000-0001-000000000004' },
    update: {},
    create: { id: '00000000-0000-0000-0001-000000000004', name: '漆器', category: 'printing', description: '以天然漆涂饰器物并绘制纹饰的工艺' },
  })

  // --- ICH Records ---
  const hanxiu = await prisma.ichRecord.upsert({
    where: { id: '00000000-0000-0000-0002-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0002-000000000001', name: '汉绣', level: 'national', protection_status: 'good', description: '国家级非物质文化遗产，以武汉为中心的传统刺绣技艺' },
  })
  const xilankapu = await prisma.ichRecord.upsert({
    where: { id: '00000000-0000-0000-0002-000000000002' },
    update: {},
    create: { id: '00000000-0000-0000-0002-000000000002', name: '西兰卡普', level: 'national', protection_status: 'good', description: '土家族传统织锦工艺，国家级非物质文化遗产' },
  })

  // --- Tags ---
  const tagNames = ['凤鸟纹', '云纹', '几何纹', '花卉纹', '龙纹', '莲花纹', '回纹', '饕餮纹', '水波纹', '如意纹']
  const tags = await Promise.all(
    tagNames.map((name, i) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { id: `00000000-0000-0000-0003-00000000000${i + 1}`.slice(0, 36), name, category: '纹饰类型' },
      })
    )
  )

  // --- Seed User (system uploader) ---
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@hbpattern.com' },
    update: {},
    create: { id: '00000000-0000-0000-0009-000000000001', email: 'system@hbpattern.com', nickname: '系统管理员', role: 'admin' },
  })

  // --- Patterns ---
  const patterns = [
    { id: '00000000-0000-0000-0010-000000000001', name: '战国凤鸟纹', description: '以凤凰翱翔于盛开的牡丹花丛为主题，象征着权力的尊贵与生命的繁荣。凤凰的线条流转如云，展现了楚文化的浪漫诡谲。', era: '战国', region_id: wuhan.id, technique_id: embroidery.id, status: 'featured' as const, color_palette: ['#c9a84c', '#a63d33', '#e8e4d9'], is_ai_generated: false },
    { id: '00000000-0000-0000-0010-000000000002', name: '楚式云雷纹', description: '流云纹是汉代常见的装饰纹样，象征着天上的云彩和神仙的意象。线条流畅，气韵生动。', era: '战国', region_id: jingzhou.id, technique_id: printing.id, status: 'approved' as const, color_palette: ['#1a1a14', '#c9a84c', '#f5f0e8'], is_ai_generated: false },
    { id: '00000000-0000-0000-0010-000000000003', name: '土家织锦·西兰卡普', description: '西兰卡普是土家族传统织锦工艺，以其独特的几何图案闻名。色彩对比强烈，构图严谨。', era: '明清', region_id: enshi.id, technique_id: weaving.id, ich_record_id: xilankapu.id, status: 'featured' as const, color_palette: ['#1e3a8a', '#ffffff', '#c9a84c'], is_ai_generated: false },
    { id: '00000000-0000-0000-0010-000000000004', name: '汉绣凤穿牡丹', description: '牡丹花开富贵的传统寓意，在荆楚地区有着悠久的历史。汉绣技法精湛，色彩浓烈。', era: '清代', region_id: wuhan.id, technique_id: embroidery.id, ich_record_id: hanxiu.id, status: 'approved' as const, color_palette: ['#b84a39', '#c9a84c', '#f5f0e8'], is_ai_generated: false },
    { id: '00000000-0000-0000-0010-000000000005', name: '黄梅挑花', description: '传统蓝印花布技术，历史悠久，具有浓郁的乡土气息。针法独特，图案质朴。', era: '近现代', region_id: wuhan.id, technique_id: embroidery.id, status: 'approved' as const, color_palette: ['#1e3a8a', '#ffffff', '#1a1a14'], is_ai_generated: false },
    { id: '00000000-0000-0000-0010-000000000006', name: 'AI·新楚风凤鸟', description: '基于楚文化凤鸟纹元素，由 AI 重新演绎的现代纹样设计。保留传统神韵，融入当代审美。', era: '当代', region_id: suizhou.id, technique_id: printing.id, status: 'approved' as const, color_palette: ['#c9a84c', '#1a1a14', '#b84a39'], is_ai_generated: true, ai_model_version: 'Seedream 5.0' },
  ]

  for (const p of patterns) {
    await prisma.pattern.upsert({
      where: { id: p.id },
      update: {},
      create: {
        ...p,
        uploader_id: systemUser.id,
        license_type: 'public_domain',
        view_count: Math.floor(Math.random() * 500) + 100,
        like_count: Math.floor(Math.random() * 50) + 5,
      },
    })

    // Add a placeholder media entry
    await prisma.patternMedia.upsert({
      where: { id: p.id.replace('0010', '0011') },
      update: {},
      create: {
        id: p.id.replace('0010', '0011'),
        pattern_id: p.id,
        media_type: 'image',
        url: `https://rithloxzperfgiqyquch.supabase.co/storage/v1/object/public/pattern-images/seed/${p.id}.webp`,
        sort_order: 0,
      },
    })
  }

  // --- Pattern Tags ---
  await prisma.patternTag.upsert({ where: { pattern_id_tag_id: { pattern_id: patterns[0].id, tag_id: tags[0].id } }, update: {}, create: { pattern_id: patterns[0].id, tag_id: tags[0].id } })
  await prisma.patternTag.upsert({ where: { pattern_id_tag_id: { pattern_id: patterns[1].id, tag_id: tags[1].id } }, update: {}, create: { pattern_id: patterns[1].id, tag_id: tags[1].id } })
  await prisma.patternTag.upsert({ where: { pattern_id_tag_id: { pattern_id: patterns[2].id, tag_id: tags[2].id } }, update: {}, create: { pattern_id: patterns[2].id, tag_id: tags[2].id } })
  await prisma.patternTag.upsert({ where: { pattern_id_tag_id: { pattern_id: patterns[3].id, tag_id: tags[3].id } }, update: {}, create: { pattern_id: patterns[3].id, tag_id: tags[3].id } })

  console.log('✅ Seed completed: 4 regions, 4 techniques, 2 ICH records, 10 tags, 6 patterns')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
