'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

function sessionUserFrom(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.email !== 'string' || typeof record.nickname !== 'string') {
    return null
  }
  if (record.avatar_url !== null && typeof record.avatar_url !== 'string') return null
  if (record.role !== undefined && record.role !== null && typeof record.role !== 'string') return null
  const role = typeof record.role === 'string' ? record.role : undefined
  return {
    id: record.id,
    email: record.email,
    nickname: record.nickname,
    avatar_url: record.avatar_url,
    ...(role ? { role } : {}),
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (response) => {
        if (!response.ok) return null
        const body = await response.json().catch(() => null) as { user?: unknown } | null
        return sessionUserFrom(body?.user)
      })
      .then((user) => {
        if (!cancelled) setUser(user)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })

    return () => {
      cancelled = true
    }
  }, [setUser])

  return <>{children}</>
}
