import { NextResponse } from 'next/server'
import { getStats } from '@/lib/queries'

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json({ data: stats })
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '获取统计数据失败' } }, { status: 500 })
  }
}
