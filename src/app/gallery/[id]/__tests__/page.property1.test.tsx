/**
 * Feature: phase-0-tech-debt-cleanup, Property 1
 *
 * Property 1: Gallery detail page renders from DB
 * Validates: Requirements 1.1
 *
 * For any valid patternId (UUID v4) with a corresponding record
 * { id, name, status ∈ {'approved','featured'} }, the page's <h1>
 * accessible name SHALL strictly equal record.name.
 * The page source SHALL NOT contain the string 'mockPatterns'.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import fs from 'node:fs'

// ─── Mock heavy dependencies before importing the page ───────────────────────

// Mock next/navigation — notFound throws a special error, unstable_rethrow re-throws it
vi.mock('next/navigation', () => ({
  notFound: () => { throw Object.assign(new Error('NEXT_NOT_FOUND'), { digest: 'NEXT_NOT_FOUND' }) },
  unstable_rethrow: (err: unknown) => {
    if (err instanceof Error && (err as Error & { digest?: string }).digest === 'NEXT_NOT_FOUND') {
      throw err
    }
  },
}))

// Mock next/link as a simple anchor
vi.mock('next/link', () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) =>
    React.createElement('a', { href, className }, children),
}))

// Mock SiteHeader — renders a simple placeholder
vi.mock('@/components/layout/SiteHeader', () => ({
  default: () => React.createElement('header', { 'data-testid': 'site-header' }),
}))

// Mock SiteFooter — renders a simple placeholder
vi.mock('@/components/layout/SiteFooter', () => ({
  default: () => React.createElement('footer', { role: 'contentinfo', 'data-testid': 'site-footer' }),
}))

// Mock LikeButton — client component, not needed for this property
vi.mock('@/components/pattern/LikeButton', () => ({
  default: () => React.createElement('span', { 'data-testid': 'like-button' }),
}))

// Mock CommentSection — client component, not needed for this property
vi.mock('@/components/pattern/CommentSection', () => ({
  default: () => React.createElement('section', { 'data-testid': 'comment-section' }),
}))

// Mock getRelatedPatterns — returns empty array (not under test here)
vi.mock('@/lib/queries', () => ({
  getPatternById: vi.fn(),
  getRelatedPatterns: vi.fn().mockResolvedValue([]),
}))

// ─── Import after mocks are set up ───────────────────────────────────────────

import { getPatternById, getRelatedPatterns } from '@/lib/queries'
import PatternDetailPage from '../page'

// ─── UUID v4 generator ───────────────────────────────────────────────────────

const uuidV4Arb = fc.uuid().filter((u) => u[14] === '4')

// ─── Minimal pattern record factory ──────────────────────────────────────────

function makePatternRecord(id: string, name: string, status: 'approved' | 'featured') {
  return {
    id,
    name,
    status,
    description: null,
    era: null,
    is_ai_generated: false,
    color_palette: [],
    view_count: 0,
    like_count: 0,
    technique_id: null,
    region: null,
    technique: null,
    ich_record: null,
    media: [],
    tags: [],
  }
}

// ─── Property 1 ──────────────────────────────────────────────────────────────

describe('Property 1: Gallery 详情页数据来自数据库', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelatedPatterns).mockResolvedValue([])
  })

  it(
    '对任意合法 patternId 与 { id, name, status ∈ approved|featured } 记录，<h1> 的文本严格等于 record.name',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidV4Arb,
          // name: non-empty string up to 100 chars (matching DB constraint)
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          fc.constantFrom('approved' as const, 'featured' as const),
          async (id, name, status) => {
            const record = makePatternRecord(id, name.trim(), status)
            vi.mocked(getPatternById).mockResolvedValue(record as ReturnType<typeof makePatternRecord> as never)

            // Render the async server component
            const element = await PatternDetailPage({ params: Promise.resolve({ id }) })
            const html = renderToStaticMarkup(element as React.ReactElement)

            // Parse the rendered HTML to find the <h1> element
            // We look for the h1 content in the static markup
            const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
            expect(h1Match, `<h1> が見つかりません (id=${id}, name="${name}")`).not.toBeNull()

            const h1Text = h1Match![1]
              // Strip any nested HTML tags
              .replace(/<[^>]+>/g, '')
              // Decode HTML entities (both named and numeric/hex)
              .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
              .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .trim()

            expect(h1Text).toBe(record.name)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─── Static source guard: no mockPatterns reference ──────────────────────

  it('page.tsx 源文件中不出现 mockPatterns 字符串', () => {
    const source = fs.readFileSync('src/app/gallery/[id]/page.tsx', 'utf8')
    expect(source).not.toContain('mockPatterns')
  })
})
