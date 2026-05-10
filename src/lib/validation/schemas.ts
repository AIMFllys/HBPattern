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
export type ListPatternsQueryInput = z.infer<typeof ListPatternsQuery>

/**
 * POST /api/patterns 的请求体 schema。
 * _Validates: Requirements 3.1, 3.2, 3.6_
 */
export const CreatePatternBody = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional(),
  era: z.string().trim().max(50).optional(),
  regionId: z.string().uuid().optional(),
  techniqueId: z.string().uuid().optional(),
  imageUrl: z.string().url(),
})
export type CreatePatternBodyInput = z.infer<typeof CreatePatternBody>

/**
 * /api/patterns/[id] 的路径参数 schema。
 * _Validates: Requirements 3.1, 3.2_
 */
export const PatternIdParam = z.object({
  id: z.string().uuid(),
})
export type PatternIdParamInput = z.infer<typeof PatternIdParam>

/**
 * POST /api/upload 的 multipart form schema（校验 file 字段存在）。
 * _Validates: Requirements 3.1, 3.2_
 */
export const UploadFileForm = z.object({
  file: z.instanceof(File, { message: '请选择文件' }),
})
export type UploadFileFormInput = z.infer<typeof UploadFileForm>

/**
 * POST /api/patterns/:id/comments 的请求体 schema（Phase 0 预置）。
 * _Validates: Requirements 3.1, 3.2, 3.7_
 */
export const CreateCommentBody = z.object({
  content: z.string().trim().min(1).max(500),
  parentId: z.string().uuid().optional(),
})
export type CreateCommentBodyInput = z.infer<typeof CreateCommentBody>

/**
 * PATCH /api/patterns/:id/moderate 的请求体 schema。
 * design.md 迁移计划 E 要求。
 */
export const ModeratePatternBody = z.object({
  action: z.enum(['approve', 'reject']),
})
export type ModeratePatternBodyInput = z.infer<typeof ModeratePatternBody>
