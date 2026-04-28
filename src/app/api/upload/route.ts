import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '请选择文件' } }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('pattern-images').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    return NextResponse.json({ error: { code: 'UPLOAD_FAILED', message: '上传失败' } }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('pattern-images').getPublicUrl(path)
  return NextResponse.json({ data: { url: publicUrl } }, { status: 201 })
}
