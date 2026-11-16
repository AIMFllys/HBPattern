import { ValidationError, AppError } from '@/lib/api/errors'

export const UPLOAD_CONFIG = {
  /** Requirement 6.2：文件大小上限 10 MB */
  maxSize: 10 * 1024 * 1024,
  /** Requirement 6.3：允许的 MIME 类型 */
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  /** Requirement 6.4：允许的文件扩展名（小写） */
  allowedExts: ['jpg', 'jpeg', 'png', 'webp'] as const,
} as const

export type AllowedMime = (typeof UPLOAD_CONFIG.allowedTypes)[number]
export type AllowedExt = (typeof UPLOAD_CONFIG.allowedExts)[number]

/**
 * multipart 帧头余量。文件本身仍不得超过 maxSize。
 * 这是路由读入时的停止点，不是平台解析器的正文上限。
 */
export const UPLOAD_BODY_OVERHEAD = 64 * 1024

export function maxUploadBodyBytes(): number {
  return UPLOAD_CONFIG.maxSize + UPLOAD_BODY_OVERHEAD
}

/** 落盘用的类型与扩展名，只来自文件头魔数。 */
export type StoredImage = {
  contentType: AllowedMime
  ext: 'jpg' | 'png' | 'webp'
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const

/**
 * 取文件名最后一个 `.` 后的小写子串作为扩展名。
 * 无后缀（无 `.` 或 `.` 在末尾）返回空字符串。
 */
export function extractExt(filename: string): string {
  const i = filename.lastIndexOf('.')
  if (i < 0 || i === filename.length - 1) return ''
  return filename.slice(i + 1).toLowerCase()
}

function startsWith(bytes: Uint8Array, magic: readonly number[]): boolean {
  if (bytes.length < magic.length) return false
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false
  }
  return true
}

/** JPEG / PNG / WebP 文件头。不看客户端声明的 MIME。 */
export function detectImageMagic(bytes: Uint8Array): StoredImage | null {
  if (startsWith(bytes, PNG_MAGIC)) {
    return { contentType: 'image/png', ext: 'png' }
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { contentType: 'image/webp', ext: 'webp' }
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: 'image/jpeg', ext: 'jpg' }
  }
  return null
}

/**
 * 按固定顺序短路校验上传文件。
 * 顺序：size → 声明的 mime → 扩展名 → 空文件 → 文件头魔数。
 * 任一步骤失败立即抛错，不进入后续校验、不调用 Supabase Storage。
 * 通过时返回魔数决定的 contentType 与扩展名，不返回 file.type。
 *
 * @throws {AppError} code='FILE_TOO_LARGE'        文件超过 10 MB（映射 413）
 * @throws {AppError} code='UNSUPPORTED_MEDIA_TYPE' 声明类型或魔数不在 JPEG / PNG / WebP（映射 415）
 * @throws {ValidationError}                        扩展名不在允许列表，或文件为空（映射 400）
 */
export async function validateUpload(file: File): Promise<StoredImage> {
  if (file.size > UPLOAD_CONFIG.maxSize) {
    throw new AppError(
      'FILE_TOO_LARGE',
      `文件不得超过 ${UPLOAD_CONFIG.maxSize / 1024 / 1024}MB`,
    )
  }

  if (!(UPLOAD_CONFIG.allowedTypes as readonly string[]).includes(file.type)) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', '仅支持 JPEG / PNG / WebP 图片')
  }

  const ext = extractExt(file.name)
  if (!ext || !(UPLOAD_CONFIG.allowedExts as readonly string[]).includes(ext)) {
    throw new ValidationError('文件扩展名不在允许列表内')
  }

  if (file.size === 0) {
    throw new ValidationError('不能上传空文件')
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const detected = detectImageMagic(header)
  if (!detected) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', '仅支持 JPEG / PNG / WebP 图片')
  }
  return detected
}

/**
 * 读请求正文，超过 maxBytes 即停止并抛 FILE_TOO_LARGE。
 * Content-Length 已声明超限时不再继续读。声明缺失或不可信时仍按实际读入字节计数。
 */
export async function readBodyUpTo(req: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = req.headers.get('content-length')
  if (declared !== null && declared.trim() !== '') {
    const n = Number(declared)
    if (Number.isFinite(n) && n > maxBytes) {
      throw new AppError(
        'FILE_TOO_LARGE',
        `文件不得超过 ${UPLOAD_CONFIG.maxSize / 1024 / 1024}MB`,
      )
    }
  }

  if (!req.body) return new Uint8Array()

  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value || value.byteLength === 0) continue
      received += value.byteLength
      if (received > maxBytes) {
        throw new AppError(
          'FILE_TOO_LARGE',
          `文件不得超过 ${UPLOAD_CONFIG.maxSize / 1024 / 1024}MB`,
        )
      }
      chunks.push(value)
    }
  } catch (err) {
    await reader.cancel().catch(() => undefined)
    throw err
  } finally {
    reader.releaseLock()
  }

  const out = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}
