import { z } from 'zod'

/**
 * GET /api/patterns 的 query 参数 schema。
 * _Validates: Requirements 3.1, 3.2, 3.5_
 */
export const ListPatternsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  era: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  sort: z.enum(['newest', 'oldest', 'popular', 'likes']).default('newest'),
  q: z.string().trim().min(1).max(100).optional(),
})

const STORAGE_PUBLIC_PREFIX = '/storage/v1/object/public/'

/**
 * 只接受本项目 Supabase Storage 公开对象的 https 地址。
 * 主机（含端口）必须与 NEXT_PUBLIC_SUPABASE_URL 相同，不写死项目 ref。
 * 环境变量缺失或无法解析时拒绝，不放行任意主机。
 */
export function isProjectStoragePublicUrl(value: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  if (parsed.username !== '' || parsed.password !== '') return false

  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!configured) return false
  let expected: URL
  try {
    expected = new URL(configured)
  } catch {
    return false
  }
  if (parsed.hostname !== expected.hostname || parsed.port !== expected.port) return false
  if (!parsed.pathname.startsWith(STORAGE_PUBLIC_PREFIX)) return false
  const rest = parsed.pathname.slice(STORAGE_PUBLIC_PREFIX.length)
  return rest.split('/').some((segment) => segment.length > 0)
}

/**
 * POST /api/patterns 的请求体 schema。
 * imageUrl 不是任意 URL，见 isProjectStoragePublicUrl。
 * _Validates: Requirements 3.1, 3.2, 3.6_
 */
export const CreatePatternBody = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional(),
  era: z.string().trim().max(50).optional(),
  regionId: z.string().uuid().optional(),
  techniqueId: z.string().uuid().optional(),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine(isProjectStoragePublicUrl, {
      message: 'imageUrl 必须是本项目 Supabase Storage 的 https 公开对象地址',
    }),
})

/**
 * /api/patterns/[id] 的路径参数 schema。
 * _Validates: Requirements 3.1, 3.2_
 */
export const PatternIdParam = z.object({
  id: z.string().uuid(),
})

/**
 * POST /api/upload 的 multipart form schema（校验 file 字段存在）。
 * _Validates: Requirements 3.1, 3.2_
 */
export const UploadFileForm = z.object({
  file: z.instanceof(File, { message: '请选择文件' }),
})

/**
 * POST /api/patterns/:id/comments 的请求体 schema（Phase 0 预置）。
 * _Validates: Requirements 3.1, 3.2, 3.7_
 */
export const CreateCommentBody = z.object({
  content: z.string().trim().min(1).max(500),
  parentId: z.string().uuid().optional(),
})

/**
 * PATCH /api/patterns/:id/moderate 的请求体 schema。
 * design.md 迁移计划 E 要求。
 */
export const ModeratePatternBody = z.object({
  action: z.enum(['approve', 'reject']),
})
