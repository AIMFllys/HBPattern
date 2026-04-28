import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('hp_regions')
      .select('id, name, province, city, cultural_intro')
      .order('name')

    if (error) throw error
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '获取地区列表失败' } }, { status: 500 })
  }
}
