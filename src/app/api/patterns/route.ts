import { NextRequest, NextResponse } from 'next/server'
import { getPatterns } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page')) || 1
  const limit = Math.min(Number(searchParams.get('limit')) || 12, 50)
  const era = searchParams.get('era') || undefined
  const region = searchParams.get('region') || undefined
  const sort = searchParams.get('sort') || 'newest'
  const q = searchParams.get('q') || undefined

  try {
    const { patterns, total } = await getPatterns({ page, limit, era, region, sort, q })
    return NextResponse.json({
      data: patterns,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '获取纹样列表失败' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, era, regionId, techniqueId, imageUrl } = body

  if (!name || !imageUrl) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '名称和图片必填' } }, { status: 400 })
  }

  const { data: pattern, error } = await supabase
    .from('hp_patterns')
    .insert({
      name,
      description: description || null,
      era: era || null,
      region_id: regionId || null,
      technique_id: techniqueId || null,
      uploader_id: user.id,
      status: 'pending',
      license_type: 'copyright',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '创建失败' } }, { status: 500 })
  }

  // Create media record
  await supabase.from('hp_pattern_media').insert({
    pattern_id: pattern.id,
    media_type: 'image',
    url: imageUrl,
    sort_order: 0,
  })

  return NextResponse.json({ data: pattern }, { status: 201 })
}
