/**
 * Feature: phase-0-tech-debt-cleanup, Property 9
 *
 * Property 9: Upload validation short-circuit order
 * Validates: Requirements 6.5, 6.6, 6.7, 6.8, 6.10
 *
 * For any file with (size ∈ [0, 2*maxSize], mime ∈ {any}, nameExt ∈ {any})
 * and a zero-filled body (not a real image), validateUpload() SHALL follow:
 *   1. size > maxSize  → throw AppError('FILE_TOO_LARGE')   [no mime/ext check]
 *   2. mime ∉ allowed  → throw AppError('UNSUPPORTED_MEDIA_TYPE') [no ext check]
 *   3. ext ∉ allowed   → throw ValidationError (code VALIDATION_ERROR)
 *   4. size === 0      → throw ValidationError (empty file)
 *   5. header is not JPEG/PNG/WebP → throw AppError('UNSUPPORTED_MEDIA_TYPE')
 * A declared-valid file is not accepted unless the header magic matches.
 * The returned contentType comes from that magic, not from file.type.
 *
 * Extra unit test: when requireAuth() throws AuthError,
 * Supabase storage upload() mock call count SHALL === 0 (Requirement 6.10).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { validateUpload, readBodyUpTo, UPLOAD_CONFIG, maxUploadBodyBytes } from '../config'
import { AppError, ValidationError } from '@/lib/api/errors'

// ─── Top-level mock for Requirement 6.10 ─────────────────────────────────────
// vi.mock is hoisted, so we use vi.hoisted to define the mock function
// that can be referenced both in the factory and in assertions.

const { uploadMock, getUserMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  getUserMock: vi.fn().mockResolvedValue({
    data: { user: null },
    error: null,
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: getUserMock,
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
  | { kind: 'EMPTY' }
  | { kind: 'NOT_IMAGE' }

function expectedOutcome(size: number, mime: string, ext: string): Outcome {
  if (size > MAX_SIZE) return { kind: 'FILE_TOO_LARGE' }
  if (!ALLOWED_MIMES.includes(mime)) return { kind: 'UNSUPPORTED_MEDIA_TYPE' }
  if (!ext || !ALLOWED_EXTS.includes(ext.toLowerCase())) return { kind: 'VALIDATION_ERROR' }
  if (size === 0) return { kind: 'EMPTY' }
  // 零填充正文没有 JPEG/PNG/WebP 魔数，声明再合法也不通过。
  return { kind: 'NOT_IMAGE' }
}

const JPEG_MAGIC = [0xff, 0xd8, 0xff]
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const WEBP_MAGIC = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]

function makeImageFile(size: number, mime: string, filename: string, header: number[]): File {
  const length = Math.max(size, header.length)
  const buf = new Uint8Array(length)
  buf.set(header, 0)
  return new File([buf.subarray(0, length)], filename, { type: mime })
}

async function capture(file: File): Promise<unknown> {
  try {
    await validateUpload(file)
    return undefined
  } catch (e) {
    return e
  }
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
    '对任意 (size ∈ [0, 2*maxSize], mime, ext) 的零填充文件，validateUpload 先短路声明校验，再拒绝空文件和非图片字节',
    async () => {
      await fc.assert(
        fc.asyncProperty(arbSize, arbMime, arbExt, async (size, mime, ext) => {
          // Build filename: use a non-empty base name + the generated ext
          const filename = ext ? `testfile.${ext}` : 'testfile'
          const file = makeFile(size, mime, filename)

          const outcome = expectedOutcome(size, mime, ext)
          const thrown = await capture(file)

          if (outcome.kind === 'FILE_TOO_LARGE') {
            expect(thrown).toBeInstanceOf(AppError)
            expect((thrown as AppError).code).toBe('FILE_TOO_LARGE')
          } else if (outcome.kind === 'UNSUPPORTED_MEDIA_TYPE' || outcome.kind === 'NOT_IMAGE') {
            expect(thrown).toBeInstanceOf(AppError)
            expect((thrown as AppError).code).toBe('UNSUPPORTED_MEDIA_TYPE')
          } else {
            // VALIDATION_ERROR（扩展名）或 EMPTY（空文件）
            expect(thrown).toBeInstanceOf(ValidationError)
            expect((thrown as AppError).code).toBe('VALIDATION_ERROR')
          }
        }),
        { numRuns: 200 },
      )
    },
    30000,
  )

  it('大小超限的文件（即使 mime/ext 均非法）仍以 FILE_TOO_LARGE 短路，不进入后续校验', async () => {
    // A file that is too large AND has bad mime AND bad ext
    // Must throw FILE_TOO_LARGE, not UNSUPPORTED_MEDIA_TYPE or VALIDATION_ERROR
    const oversizedBadFile = makeFile(MAX_SIZE + 1, 'application/octet-stream', 'evil.exe')
    const thrown = await capture(oversizedBadFile)
    expect(thrown).toBeInstanceOf(AppError)
    expect((thrown as AppError).code).toBe('FILE_TOO_LARGE')
  })

  it('大小合法但 mime 非法的文件以 UNSUPPORTED_MEDIA_TYPE 短路，不进入 ext 校验', async () => {
    // A file with valid size, bad mime, bad ext — even if the bytes are a real PNG
    const badMimeBadExt = makeImageFile(1024, 'application/pdf', 'doc.pdf', PNG_MAGIC)
    const thrown = await capture(badMimeBadExt)
    expect(thrown).toBeInstanceOf(AppError)
    expect((thrown as AppError).code).toBe('UNSUPPORTED_MEDIA_TYPE')
  })

  it('大小合法、mime 合法但 ext 非法的文件以 VALIDATION_ERROR 抛出', async () => {
    // Valid size, valid mime, bad ext — magic is not consulted
    const badExtFile = makeImageFile(1024, 'image/jpeg', 'photo.bmp', JPEG_MAGIC)
    const thrown = await capture(badExtFile)
    expect(thrown).toBeInstanceOf(ValidationError)
    expect((thrown as AppError).code).toBe('VALIDATION_ERROR')
  })

  it('空文件即使声明为 JPEG 也被拒绝', async () => {
    const empty = makeFile(0, 'image/jpeg', 'photo.jpg')
    const thrown = await capture(empty)
    expect(thrown).toBeInstanceOf(ValidationError)
    expect((thrown as AppError).code).toBe('VALIDATION_ERROR')
  })

  it('声明为 JPEG 但正文不是图片时拒绝', async () => {
    const fake = makeFile(1024, 'image/jpeg', 'photo.jpg')
    const thrown = await capture(fake)
    expect(thrown).toBeInstanceOf(AppError)
    expect((thrown as AppError).code).toBe('UNSUPPORTED_MEDIA_TYPE')
  })

  it('真实 JPEG / PNG / WebP 通过，且 contentType 与扩展名来自魔数而不是 file.type', async () => {
    await expect(validateUpload(makeImageFile(64, 'image/jpeg', 'photo.jpg', JPEG_MAGIC))).resolves.toEqual({
      contentType: 'image/jpeg',
      ext: 'jpg',
    })
    await expect(validateUpload(makeImageFile(64, 'image/png', 'photo.png', PNG_MAGIC))).resolves.toEqual({
      contentType: 'image/png',
      ext: 'png',
    })
    await expect(validateUpload(makeImageFile(64, 'image/webp', 'photo.webp', WEBP_MAGIC))).resolves.toEqual({
      contentType: 'image/webp',
      ext: 'webp',
    })
    // 客户端声明 image/jpeg + .jpeg，正文却是 PNG：落盘类型以魔数为准。
    await expect(validateUpload(makeImageFile(64, 'image/jpeg', 'photo.jpeg', PNG_MAGIC))).resolves.toEqual({
      contentType: 'image/png',
      ext: 'png',
    })
  })

  it('正好 10MB 且带 JPEG 魔数的文件可以通过，超过 1 字节则 FILE_TOO_LARGE', async () => {
    await expect(validateUpload(makeImageFile(MAX_SIZE, 'image/jpeg', 'photo.jpg', JPEG_MAGIC))).resolves.toEqual({
      contentType: 'image/jpeg',
      ext: 'jpg',
    })
    const thrown = await capture(makeImageFile(MAX_SIZE + 1, 'image/jpeg', 'photo.jpg', JPEG_MAGIC))
    expect(thrown).toBeInstanceOf(AppError)
    expect((thrown as AppError).code).toBe('FILE_TOO_LARGE')
  })
})

// ─── Requirement 6.10: requireAuth 抛 AuthError 时 storage.upload 不被调用 ──

describe('Requirement 6.10: 未登录时 storage.upload 调用次数 === 0', () => {
  beforeEach(() => {
    uploadMock.mockClear()
    uploadMock.mockResolvedValue({ error: null })
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    })
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

  it('已登录时按魔数写入 contentType，忽略客户端声明的 file.type', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'a@b.c' } },
      error: null,
    })

    const file = makeImageFile(64, 'image/jpeg', 'photo.jpg', PNG_MAGIC)
    const formData = new FormData()
    formData.append('file', file)
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const { POST } = await import('@/app/api/upload/route')
    const response = await POST(
      request as unknown as import('next/server').NextRequest,
      undefined as unknown as { params: Promise<Record<string, string>> },
    )

    expect(response.status).toBe(201)
    expect(uploadMock).toHaveBeenCalledTimes(1)
    const [path, body, options] = uploadMock.mock.calls[0]
    expect(path).toMatch(/^user-1\/\d+\.png$/)
    expect(options).toMatchObject({ contentType: 'image/png', upsert: false })
    expect(body).toBeInstanceOf(Blob)
    expect((body as Blob).type).toBe('image/png')
  })

  it('已登录上传空文件时拒绝，且不调用 storage.upload', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'a@b.c' } },
      error: null,
    })

    const file = makeFile(0, 'image/jpeg', 'empty.jpg')
    const formData = new FormData()
    formData.append('file', file)
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const { POST } = await import('@/app/api/upload/route')
    const response = await POST(
      request as unknown as import('next/server').NextRequest,
      undefined as unknown as { params: Promise<Record<string, string>> },
    )

    expect(response.status).toBe(400)
    expect(uploadMock).toHaveBeenCalledTimes(0)
  })
})

describe('UPLOAD-003: 路由读入超过上限即停止', () => {
  it('readBodyUpTo 在超出上限后不再继续拉取', async () => {
    const chunk = new Uint8Array(1024)
    let pulls = 0
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1
        if (pulls > 40) {
          controller.close()
          return
        }
        controller.enqueue(chunk)
      },
    })
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit)

    await expect(readBodyUpTo(req, 2048)).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' })
    expect(pulls).toBeLessThan(40)
  })

  it('maxUploadBodyBytes 仍盖住 10MB 文件加少量 multipart 余量', () => {
    expect(maxUploadBodyBytes()).toBeGreaterThan(UPLOAD_CONFIG.maxSize)
    expect(maxUploadBodyBytes() - UPLOAD_CONFIG.maxSize).toBeLessThanOrEqual(64 * 1024)
  })
})
