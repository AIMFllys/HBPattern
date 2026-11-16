import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { AppError, ValidationError } from '@/lib/api/errors'
import { parseOrThrow } from '@/lib/validation/parse'
import { UploadFileForm } from '@/lib/validation/schemas'
import { requireAuth } from '@/lib/auth/checks'
import { rateLimit } from '@/lib/rate-limit'
import { validateUpload, readBodyUpTo, maxUploadBodyBytes } from '@/lib/upload/config'
import { createClient } from '@/lib/supabase/server'

export const POST = withApi(async (req) => {
  // 步骤 1：限制读入字节后再解析 multipart。
  // App Router 路由段没有正文上限配置；平台 / next.config 的解析上限不在此处。
  const bytes = await readBodyUpTo(req, maxUploadBodyBytes())
  const contentTypeHeader = req.headers.get('content-type')
  if (!contentTypeHeader) {
    throw new ValidationError('无法解析上传内容')
  }
  let formData: FormData
  try {
    formData = await new Request(req.url, {
      method: 'POST',
      headers: { 'content-type': contentTypeHeader },
      body: new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer]),
    }).formData()
  } catch {
    throw new ValidationError('无法解析上传内容')
  }
  const form = parseOrThrow(UploadFileForm, Object.fromEntries(formData))

  // 步骤 2：鉴权（未登录在此抛 401，不得进入后续逻辑）
  const user = await requireAuth()

  // 步骤 3：限流
  rateLimit('POST /api/upload', user.id)

  // 步骤 4：声明的 MIME、扩展名、空文件、文件头魔数
  const detected = await validateUpload(form.file)

  // 步骤 5：存储路径的扩展名由魔数决定，不用客户端文件名里的后缀
  const path = `${user.id}/${Date.now()}.${detected.ext}`

  // 步骤 6：上传到 Supabase Storage。
  // Blob 的 type 用魔数结果。storage-js 对 Blob 走 multipart，会带上这个 type，
  // 而不是 File 上客户端声明的 file.type。
  const supabase = await createClient()
  const body = new Blob([await form.file.arrayBuffer()], { type: detected.contentType })
  const { error } = await supabase.storage.from('pattern-images').upload(path, body, {
    contentType: detected.contentType,
    upsert: false,
  })

  if (error) {
    throw new AppError('INTERNAL_ERROR', '上传失败', { cause: error })
  }

  // 步骤 7：获取公开 URL 并返回
  const {
    data: { publicUrl },
  } = supabase.storage.from('pattern-images').getPublicUrl(path)

  return ok({ url: publicUrl }, { status: 201 })
})
