/**
 * Feature: phase-0-tech-debt-cleanup, Property 6
 *
 * Property 6: Pagination metadata correctness
 * Validates: Requirements 2.8
 *
 * For any (page, limit, total) triple satisfying page ≥ 1 ∧ limit ∈ [1, 50] ∧ total ≥ 0,
 * okList(items, { page, limit, total }).pagination SHALL satisfy:
 *   - totalPages = max(1, ceil(total / limit))
 *   - hasNext    = page < totalPages
 *   - hasPrev    = page > 1
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { okList } from '../response'

describe('Property 6: Pagination metadata correctness', () => {
  it('totalPages, hasNext, hasPrev are computed correctly for all valid (page, limit, total) triples', () => {
    fc.assert(
      fc.property(
        fc.record({
          page: fc.integer({ min: 1, max: 1000 }),
          limit: fc.integer({ min: 1, max: 50 }),
          total: fc.integer({ min: 0, max: 10_000 }),
        }),
        (p) => {
          const result = okList([], p)
          const { pagination } = result

          const expectedTotalPages = Math.max(1, Math.ceil(p.total / p.limit))
          const expectedHasNext = p.page < expectedTotalPages
          const expectedHasPrev = p.page > 1

          // totalPages = max(1, ceil(total / limit))
          if (pagination.totalPages !== expectedTotalPages) return false

          // hasNext = page < totalPages
          if (pagination.hasNext !== expectedHasNext) return false

          // hasPrev = page > 1
          if (pagination.hasPrev !== expectedHasPrev) return false

          // Input fields are passed through unchanged
          if (pagination.page !== p.page) return false
          if (pagination.limit !== p.limit) return false
          if (pagination.total !== p.total) return false

          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})
