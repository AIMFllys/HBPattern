/**
 * Feature: phase-0-tech-debt-cleanup, Property 8
 *
 * Property 8: Auth layer binary decision
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.9
 *
 * For any call to requireAuth() or requireRole(roles):
 * (a) When Supabase auth.getUser() returns { data: { user: u }, error: null }
 *     with u.id non-null, requireAuth() SHALL return a non-null AuthedUser
 *     without throwing. All other return shapes (error non-null / user null /
 *     user.id null) SHALL throw AuthError('UNAUTHORIZED') (maps to 401).
 * (b) requireRole(roles) first reuses (a), then IFF user.role ∈ roles returns
 *     the user, otherwise throws AuthError('FORBIDDEN') (maps to 403).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { AuthError } from '../AuthError'

// ─── Mock @/lib/supabase/server ───────────────────────────────────────────────

// We need a mutable reference so each test can configure the mock's behaviour.
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

// ─── Import SUT after mock is registered ─────────────────────────────────────

import { requireAuth, requireRole } from '../checks'
import type { Role } from '@/types/user'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_ROLES: Role[] = ['user', 'moderator', 'admin']

/** Configure the Supabase mock to return a successful auth result. */
function setupAuthOk(userId: string, email: string, dbRole: Role) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId, email } },
    error: null,
  })
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: dbRole }, error: null }),
  })
}

/** Configure the Supabase mock to return an error from getUser. */
function setupAuthError() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: new Error('auth error'),
  })
}

/** Configure the Supabase mock to return user=null (no session). */
function setupAuthUserNull() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
}

/** Configure the Supabase mock to return a user with id=null. */
function setupAuthUserIdNull(email: string) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: null, email } },
    error: null,
  })
}

// ─── Property 8 ───────────────────────────────────────────────────────────────

describe('Property 8: Auth 层的二分判定', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── (a) requireAuth 的四种 authResult 分支 ──────────────────────────────────

  describe('(a) requireAuth() 的二分判定', () => {
    it(
      '当 getUser 返回合法 user（id 非空）时，requireAuth() 返回非空 AuthedUser',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),                          // userId
            fc.emailAddress(),                  // email
            fc.constantFrom(...ALL_ROLES),      // dbRole
            async (userId, email, dbRole) => {
              setupAuthOk(userId, email, dbRole)

              const user = await requireAuth()

              expect(user).not.toBeNull()
              expect(user).not.toBeUndefined()
              expect(typeof user.id).toBe('string')
              expect(user.id).toBe(userId)
              expect(user.role).toBe(dbRole)
            },
          ),
          { numRuns: 100 },
        )
      },
    )

    it(
      '当 getUser 返回 error!=null 时，requireAuth() 抛 AuthError(UNAUTHORIZED)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constant(null),
            async () => {
              setupAuthError()

              await expect(requireAuth()).rejects.toSatisfy(
                (err: unknown) =>
                  err instanceof AuthError && err.code === 'UNAUTHORIZED',
              )
            },
          ),
          { numRuns: 100 },
        )
      },
    )

    it(
      '当 getUser 返回 user=null 时，requireAuth() 抛 AuthError(UNAUTHORIZED)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constant(null),
            async () => {
              setupAuthUserNull()

              await expect(requireAuth()).rejects.toSatisfy(
                (err: unknown) =>
                  err instanceof AuthError && err.code === 'UNAUTHORIZED',
              )
            },
          ),
          { numRuns: 100 },
        )
      },
    )

    it(
      '当 getUser 返回 user.id=null 时，requireAuth() 抛 AuthError(UNAUTHORIZED)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            async (email) => {
              setupAuthUserIdNull(email)

              await expect(requireAuth()).rejects.toSatisfy(
                (err: unknown) =>
                  err instanceof AuthError && err.code === 'UNAUTHORIZED',
              )
            },
          ),
          { numRuns: 100 },
        )
      },
    )
  })

  // ── (b) requireRole 的二分判定 ───────────────────────────────────────────────

  describe('(b) requireRole() 的二分判定', () => {
    it(
      '当 user.role ∈ requiredRoles 时，requireRole() 返回用户',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.emailAddress(),
            fc.constantFrom(...ALL_ROLES),
            // requiredRoles: a non-empty subset of ALL_ROLES that includes userRole
            fc.constantFrom(...ALL_ROLES),
            async (userId, email, userRole, extraRole) => {
              setupAuthOk(userId, email, userRole)

              // Build a requiredRoles array that always contains userRole
              const requiredRoles: Role[] = Array.from(
                new Set([userRole, extraRole]),
              )

              const user = await requireRole(requiredRoles)

              expect(user).not.toBeNull()
              expect(user.id).toBe(userId)
              expect(user.role).toBe(userRole)
            },
          ),
          { numRuns: 100 },
        )
      },
    )

    it(
      '当 user.role ∉ requiredRoles 时，requireRole() 抛 AuthError(FORBIDDEN)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.emailAddress(),
            fc.constantFrom(...ALL_ROLES),
            async (userId, email, userRole) => {
              setupAuthOk(userId, email, userRole)

              // Build a requiredRoles array that explicitly excludes userRole
              const requiredRoles = ALL_ROLES.filter((r) => r !== userRole) as Role[]

              // If all roles are excluded (shouldn't happen with 3 roles), skip
              if (requiredRoles.length === 0) return

              await expect(requireRole(requiredRoles)).rejects.toSatisfy(
                (err: unknown) =>
                  err instanceof AuthError && err.code === 'FORBIDDEN',
              )
            },
          ),
          { numRuns: 100 },
        )
      },
    )

    it(
      '当 getUser 返回非 ok 状态时，requireRole() 也抛 AuthError(UNAUTHORIZED)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom(...ALL_ROLES),
            async (requiredRole) => {
              setupAuthUserNull()

              await expect(requireRole([requiredRole])).rejects.toSatisfy(
                (err: unknown) =>
                  err instanceof AuthError && err.code === 'UNAUTHORIZED',
              )
            },
          ),
          { numRuns: 100 },
        )
      },
    )
  })

  // ── AuthError 的 HTTP 状态映射（Requirement 5.6）────────────────────────────

  describe('AuthError 的 HTTP 状态映射', () => {
    it('AuthError(UNAUTHORIZED).status === 401', () => {
      const err = new AuthError('UNAUTHORIZED')
      expect(err.status).toBe(401)
      expect(err.code).toBe('UNAUTHORIZED')
    })

    it('AuthError(FORBIDDEN).status === 403', () => {
      const err = new AuthError('FORBIDDEN')
      expect(err.status).toBe(403)
      expect(err.code).toBe('FORBIDDEN')
    })
  })
})
