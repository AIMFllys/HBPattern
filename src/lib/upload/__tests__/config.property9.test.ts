/**
 * Feature: phase-0-tech-debt-cleanup, Property 9
 *
 * Property 9: Upload validation short-circuit order
 * Validates: Requirements 6.5, 6.6, 6.7, 6.8, 6.10
 *
 * For any file with (size ∈ [0, 2*maxSize], mime ∈ {any}, nameExt ∈ {any}),
 * validateUpload() SHALL strictly follow the 4-level decision tree:
 *   1. size > maxSize  → throw AppError('FILE_TOO_LARGE')   [no mime/ext check]
 *   2. mime ∉ allowed  → throw AppError('UNSUPPORTED_MEDIA_TYPE') [no ext check]
 *   3. ext ∉ allowed   → throw ValidationError (code VALIDATION_ERROR)
 *   4. all pass        → no throw
 *
 * Extra unit test: when requireAuth() throws AuthError,
 * Supabase storage upload() mock call count SHALL === 0 (Requirement 6.10).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { validateUpload, UPLOAD_CONFIG } from '../config'
import { AppError, ValidationError } from '@/lib/api/errors'

// ─── Top-level mock for Requirement 6.10 ─────────────────────────────────────
// vi.mock is hoisted, so we use vi.hoisted to define the mock function
// that can be referenced both in the factory and in assertions.

const { uploadMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: uploadMock,
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}))

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SIZE = UPLOAD_CONFIG.maxSize
const ALLOWED_MIMES = UPLOAD_CONFIG.allowedTypes as readonly string[]
const ALLOWED_EXTS = UPLOAD_CONFIG.allowedExts as readonly string[]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a File with the given size, MIME type, and filename.
 */
function makeFile(size: number, mime: string, filename: string): File {
  const buf = new Uint8Array(size)
  return new File([buf], filename, { type: mime })
}

/**
 * Derive the expected outcome for a given (size, mime, ext) triple
 * according to the 4-level decision tree.
 */
type Outcome =
  | { kind: 'FILE_TOO_LARGE' }
  | { kind: 'UNSUPPORTED_MEDIA_TYPE' }
  | { kind: 'VALIDATION_ERROR' }
  | { kind: 'pass' }

function expectedOutcome(size: number, mime: string, ext: string): Outcome {
  if (size > MAX_SIZE) return { kind: 'FILE_TOO_LARGE' }
  if (!ALLOWED_MIMES.includes(mime)) return { kind: 'UNSUPPORTED_MEDIA_TYPE' }
  if (!ext || !ALLOWED_EXTS.includes(ext.toLowerCase())) return { kind: 'VALIDATION_ERROR' }
  return { kind: 'pass' }
}

// ─── Arbitrary generators ─────────────────────────────────────────────────────

/** size ∈ [0, 2 * maxSize] */
const arbSize = fc.integer({ min: 0, max: 2 * MAX_SIZE })

/**
 * mime: mix of allowed and arbitrary strings to exercise both branches.
 */
const arbMime = fc.oneof(
  { weight: 1, arbitrary: fc.constantFrom(...ALLOWED_MIMES) },
  { weight: 1, arbitrary: fc.string({ minLength: 0, maxLength: 50 }) },
)

/**
 * nameExt: the extension part of the filename (without leading dot).
 * Mix of allowed extensions and arbitrary strings.
 */
const arbExt = fc.oneof(
  { weight: 1, arbitrary: fc.constantFrom(...ALLOWED_EXTS) },
  { weight: 1, arbitrary: fc.string({ minLength: 0, maxLength: 10 }) },
)

// ─── Property 9: validateUpload short-circuit order ──────────────────────────

describe('Property 9: 上传校验短路顺序 (Validates: Requirements 6.5, 6.6, 6.7, 6.8)', () => {
  it(
    '对任意 (size ∈ [0, 2*maxSize], mime, ext) 三元组，validateUpload 严格遵循四级判定树',
    () => {
      fc.assert(
        fc.property(arbSize, arbMime, arbExt, (size, mime, ext) => {
          // Build filename: use a non-empty base name + the generated ext
          const filename = ext ? `testfile.${ext}` : 'testfile'
          const file = makeFile(size, mime, filename)

          const outcome = expectedOutcome(size, mime, ext)

          if (outcome.kind === 'pass') {
            // Should not throw
            expect(() => validateUpload(file)).not.toThrow()
          } else if (outcome.kind === 'FILE_TOO_LARGE') {
            // Must throw AppError with code FILE_TOO_LARGE
            // Must NOT throw UNSUPPORTED_MEDIA_TYPE or VALIDATION_ERROR
            let thrown: unknown
            try {
              validateUpload(file)
            } catch (e) {
              thrown = e
            }
            expect(thrown).toBeInstanceOf(AppError)
            expect((thrown as AppError).code).toBe('FILE_TOO_LARGE')
          } else if (outcome.kind === 'UNSUPPORTED_MEDIA_TYPE') {
            // size is within limit; mime is not allowed
            // Must throw AppError with code UNSUPPORTED_MEDIA_TYPE
            let thrown: unknown
            try {
              validateUpload(file)
            } catch (e) {
              thrown = e
            }
            expect(thrown).toBeInstanceOf(AppError)
            expect((thrown as AppError).code).toBe('UNSUPPORTED_MEDIA_TYPE')
          } else {
            // outcome.kind === 'VALIDATION_ERROR'
            // size is within limit; mime is allowed; ext is not allowed
            // Must throw ValidationError (which is AppError with code VALIDATION_ERROR)
            let thrown: unknown
            try {
              validateUpload(file)
            } catch (e) {
              thrown = e
            }
            expect(thrown).toBeInstanceOf(ValidationError)
            expect((thrown as AppError).code).toBe('VALIDATION_ERROR')
          }
        }),
        { numRuns: 200 },
      )
    },
    20000,
  )

  it('大小超限的文件（即使 mime/ext 均非法）仍以 FILE_TOO_LARGE 短路，不进入后续校验', () => {
    // A file that is too large AND has bad mime AND bad ext
    // Must throw FILE_TOO_LARGE, not UNSUPPORTED_MEDIA_TYPE or VALIDATION_ERROR
    const oversizedBadFile = makeFile(MAX_SIZE + 1, 'application/octet-stream', 'evil.exe')
    let thrown: unknown
    try {
      validateUpload(oversizedBadFile)
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(AppError)
    expect((thrown as AppError).code).toBe('FILE_TOO_LARGE')
  })

  it('大小合法但 mime 非法的文件以 UNSUPPORTED_MEDIA_TYPE 短路，不进入 ext 校验', () => {
    // A file with valid size, bad mime, bad ext
    // Must throw UNSUPPORTED_MEDIA_TYPE, not VALIDATION_ERROR
    const badMimeBadExt = makeFile(1024, 'application/pdf', 'doc.pdf')
    let thrown: unknown
    try {
      validateUpload(badMimeBadExt)
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(AppError)
    expect((thrown as AppError).code).toBe('UNSUPPORTED_MEDIA_TYPE')
  })

  it('大小合法、mime 合法但 ext 非法的文件以 VALIDATION_ERROR 抛出', () => {
    // Valid size, valid mime, bad ext
    const badExtFile = makeFile(1024, 'image/jpeg', 'photo.bmp')
    let thrown: unknown
    try {
      validateUpload(badExtFile)
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(ValidationError)
    expect((thrown as AppError).code).toBe('VALIDATION_ERROR')
  })

  it('全部合法的文件不抛错', () => {
    const validFile = makeFile(1024, 'image/jpeg', 'photo.jpg')
    expect(() => validateUpload(validFile)).not.toThrow()
  })
})

// ─── Requirement 6.10: requireAuth 抛 AuthError 时 storage.upload 不被调用 ──

describe('Requirement 6.10: 未登录时 storage.upload 调用次数 === 0', () => {
  beforeEach(() => {
    uploadMock.mockClear()
  })

  it('当用户未登录（auth.getUser 返回 null user）时，Supabase storage upload 不被调用', async () => {
    // Import the upload route handler (uses the mocked @/lib/supabase/server)
    const { POST } = await import('@/app/api/upload/route')

    // Build a minimal FormData request with a valid file
    const file = makeFile(1024, 'image/jpeg', 'photo.jpg')
    const formData = new FormData()
    formData.append('file', file)

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request as unknown as import('next/server').NextRequest, undefined as unknown as { params: Promise<Record<string, string>> })

    // The response should be 401 (unauthorized)
    expect(response.status).toBe(401)

    // The storage upload mock must NOT have been called
    expect(uploadMock).toHaveBeenCalledTimes(0)
  })
})
