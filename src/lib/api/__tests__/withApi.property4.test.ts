/**
 * Feature: phase-0-tech-debt-cleanup, Property 4
 *
 * Property 4: Production details redaction
 * Validates: Requirements 2.5
 *
 * For any NODE_ENV === 'production' error response produced by withApi(),
 * error.details SHALL be undefined, and the response JSON SHALL NOT contain
 * substrings "stack", "supabase", "relation", or "column".
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'
import { withApi } from '../withApi'
import { AppError } from '../errors'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url)
}

/** Sensitive keywords that must never appear in a production error response body. */
const SENSITIVE_KEYWORDS = ['stack', 'supabase', 'relation', 'column'] as const

// ─── arbitrary generators ────────────────────────────────────────────────────

/**
 * Generates arbitrary `details` values that may contain sensitive keywords
 * as nested strings, object keys, or values.
 */
const arbitraryDetails = fc.oneof(
  // Primitive strings that contain sensitive keywords
  fc.constantFrom(...SENSITIVE_KEYWORDS),
  // Plain string (may or may not contain keywords)
  fc.string(),
  // Object with sensitive keyword keys/values
  fc.record({
    stack: fc.string(),
    supabase: fc.string(),
    relation: fc.string(),
    column: fc.string(),
    message: fc.string(),
  }),
  // Nested object
  fc.record({
    error: fc.record({
      stack: fc.string(),
      supabase: fc.record({
        code: fc.string(),
        relation: fc.string(),
        column: fc.string(),
      }),
    }),
    meta: fc.string(),
  }),
  // Array of objects with sensitive data
  fc.array(
    fc.record({
      stack: fc.string(),
      supabase: fc.string(),
    }),
    { minLength: 1, maxLength: 3 },
  ),
  // null / undefined / number / boolean
  fc.constantFrom(null, undefined, 42, true, false),
)

// ─── tests ───────────────────────────────────────────────────────────────────

describe('Property 4: Production details redaction (Validates: Requirements 2.5)', () => {
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV
    // @ts-expect-error overriding read-only NODE_ENV for test
    process.env.NODE_ENV = 'production'
  })

  afterEach(() => {
    // @ts-expect-error restoring NODE_ENV
    process.env.NODE_ENV = originalNodeEnv
  })

  it('error.details is undefined in production for any arbitrary details value', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryDetails, async (details) => {
        const handler = withApi(async () => {
          throw new AppError('INTERNAL_ERROR', 'm', { details })
        })

        const response = await handler(makeRequest(), undefined)
        const body = await response.json()

        // Core assertion: details must be stripped in production
        expect(body.error.details).toBeUndefined()
      }),
      { numRuns: 100 },
    )
  })

  it('response JSON does not contain sensitive keywords in production', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryDetails, async (details) => {
        const handler = withApi(async () => {
          throw new AppError('INTERNAL_ERROR', 'm', { details })
        })

        const response = await handler(makeRequest(), undefined)
        const body = await response.json()
        const bodyJson = JSON.stringify(body)

        // error.details must be absent
        expect(body.error.details).toBeUndefined()

        // The serialised error object must not contain sensitive keywords
        // that would only appear if details were leaked
        // (We check the full body to be thorough)
        for (const keyword of SENSITIVE_KEYWORDS) {
          // Allow the keyword to appear only in error.code or error.message
          // which are controlled fields — but NOT in details (which is stripped).
          // Since error.code is always 'INTERNAL_ERROR' and error.message is 'm',
          // none of the sensitive keywords should appear in the body at all.
          expect(bodyJson).not.toContain(`"${keyword}"`)
        }
      }),
      { numRuns: 100 },
    )
  })

  it('error.details is undefined even when details contains deeply nested sensitive data', async () => {
    // Targeted test with known sensitive payloads
    const sensitiveCases = [
      { stack: 'Error: something\n    at Object.<anonymous> (/app/src/lib/db.ts:42:5)' },
      { supabase: { code: 'PGRST116', details: 'relation "hp_patterns" does not exist' } },
      { relation: 'hp_users', column: 'email', message: 'null value in column' },
      'stack trace: Error at /app/src/lib/supabase/server.ts:10',
      ['stack', 'supabase', 'relation', 'column'],
    ]

    for (const details of sensitiveCases) {
      const handler = withApi(async () => {
        throw new AppError('INTERNAL_ERROR', 'm', { details })
      })

      const response = await handler(makeRequest(), undefined)
      const body = await response.json()
      const bodyJson = JSON.stringify(body)

      expect(body.error.details).toBeUndefined()

      for (const keyword of SENSITIVE_KEYWORDS) {
        expect(bodyJson).not.toContain(`"${keyword}"`)
      }
    }
  })
})
