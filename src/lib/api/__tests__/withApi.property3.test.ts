/**
 * Feature: phase-0-tech-debt-cleanup, Property 3
 *
 * Property 3: ERROR_CODE_TO_STATUS is the single source of truth
 *
 * For any code ∈ ApiErrorCode, when a Route_Handler throws new AppError(code, 'x'),
 * the HTTP status produced by withApi() SHALL equal ERROR_CODE_TO_STATUS[code].
 *
 * Validates: Requirements 2.7, 6.6, 6.7, 6.8
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'
import { withApi } from '../withApi'
import { AppError, ERROR_CODE_TO_STATUS } from '../errors'
import type { ApiErrorCode } from '../errors'

function makeRequest(url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url)
}

describe('Property 3: ERROR_CODE_TO_STATUS 是 HTTP 状态映射的单一真相源', () => {
  it('对每个 ApiErrorCode，withApi 产生的响应 status 严格等于 ERROR_CODE_TO_STATUS[code]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...(Object.keys(ERROR_CODE_TO_STATUS) as ApiErrorCode[])),
        async (code) => {
          const handler = withApi(async () => {
            throw new AppError(code, 'x')
          })

          const response = await handler(makeRequest(), undefined)

          expect(response.status).toBe(ERROR_CODE_TO_STATUS[code])
        },
      ),
      { numRuns: 100 },
    )
  })
})
