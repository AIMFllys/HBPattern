import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { AppError } from '@/lib/api/errors'
import { parseOrThrow } from '@/lib/validation/parse'
import { UploadFileForm } from '@/lib/validation/schemas'
import { requireAuth } from '@/lib/auth/checks'
import { rateLimit } from '@/lib/rate-limit'
import { validateUpload, extractExt } from '@/lib/upload/config'
import { createClient } from '@/lib/supabase/server'

export const POST = withApi(async (req) => {
  // 步骤 1：Zod 校验（parseOrThrow 是唯一闸门）
  const form = parseOrThrow(UploadFileForm, Object.fromEntries(await req.formData()))

  // 步骤 2：鉴权（未登录在此抛 401，不得进入后续逻辑）
  const user = await requireAuth()

  // 步骤 3：限流
  rateLimit('POST /api/upload', user.id)

  // 步骤 4：上传文件校验（size → mime → ext 短路顺序）
  validateUpload(form.file)

  // 步骤 5：计算存储路径
  const ext = extractExt(form.file.name)
  const path = `${user.id}/${Date.now()}.${ext}`

  // 步骤 6：上传到 Supabase Storage
  const supabase = await createClient()
  const { error } = await supabase.storage
    .from('pattern-images')
    .upload(path, form.file, {
      contentType: form.file.type,
      upsert: false,
    })

  if (error) {
    throw new AppError('INTERNAL_ERROR', '上传失败', { cause: error })
  }

  // 步骤 7：获取公开 URL 并返回
  const { data: { publicUrl } } = supabase.storage
    .from('pattern-images')
    .getPublicUrl(path)

  return ok({ url: publicUrl }, { status: 201 })
})
