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
 * 取文件名最后一个 `.` 后的小写子串作为扩展名。
 * 无后缀（无 `.` 或 `.` 在末尾）返回空字符串。
 */
export function extractExt(filename: string): string {
  const i = filename.lastIndexOf('.')
  if (i < 0 || i === filename.length - 1) return ''
  return filename.slice(i + 1).toLowerCase()
}

/**
 * Requirement 6.5：按固定顺序短路校验上传文件。
 * 顺序：size → mime → ext。
 * 任一步骤失败立即抛错，不进入后续校验、不调用 Supabase Storage。
 *
 * @throws {AppError} code='FILE_TOO_LARGE'        文件超过 10 MB（映射 413）
 * @throws {AppError} code='UNSUPPORTED_MEDIA_TYPE' MIME 类型不在允许列表（映射 415）
 * @throws {ValidationError}                        扩展名不在允许列表（映射 400）
 */
export function validateUpload(file: File): void {
  // Step 1: 大小校验（Requirement 6.2 / 6.6）
  if (file.size > UPLOAD_CONFIG.maxSize) {
    throw new AppError(
      'FILE_TOO_LARGE',
      `文件不得超过 ${UPLOAD_CONFIG.maxSize / 1024 / 1024}MB`,
    )
  }

  // Step 2: MIME 类型校验（Requirement 6.3 / 6.7）
  if (!(UPLOAD_CONFIG.allowedTypes as readonly string[]).includes(file.type)) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', '仅支持 JPEG / PNG / WebP 图片')
  }

  // Step 3: 扩展名校验（Requirement 6.4 / 6.8）
  const ext = extractExt(file.name)
  if (!ext || !(UPLOAD_CONFIG.allowedExts as readonly string[]).includes(ext)) {
    throw new ValidationError('文件扩展名不在允许列表内')
  }
}
