import { NextResponse } from 'next/server'
import { getPatternById, getRelatedPatterns } from '@/lib/queries'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const pattern = await getPatternById(id)
    if (!pattern) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: '纹样不存在' } }, { status: 404 })
    }

    const related = await getRelatedPatterns(id, pattern.technique_id)
    return NextResponse.json({ data: { ...pattern, related } })
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '获取纹样详情失败' } }, { status: 500 })
  }
}
