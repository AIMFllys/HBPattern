'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AUTH_ROUTES } from '@/lib/auth/routes'
import { useAuthStore } from '@/stores/useAuthStore'

interface UseAuthFormOptions {
  redirectAfterOAuth?: string
  onLoginSuccess?: () => void
}

const LOGIN_FAILED = '登录失败，请检查邮箱和密码后重试'
const REGISTER_FAILED = '注册失败，请稍后再试'
const RESET_FAILED = '发送重置邮件失败，请稍后再试'

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

export function useAuthForm({ redirectAfterOAuth, onLoginSuccess }: UseAuthFormOptions = {}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleOAuth() {
    const supabase = createClient()
    const callbackUrl = redirectAfterOAuth
      ? `/auth/callback?next=${encodeURIComponent(redirectAfterOAuth)}`
      : AUTH_ROUTES.callback

    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}${callbackUrl}` },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('请先填写邮箱')
      return
    }
    if (!password) {
      setError('请先填写密码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(isRegister ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        setError(isRegister ? REGISTER_FAILED : LOGIN_FAILED)
        return
      }

      const body = await response.json().catch(() => null) as { user?: unknown } | null
      const user = sessionUserFrom(body?.user)
      if (user) useAuthStore.getState().setUser(user)
      if (isRegister) setEmailSent(true)
      else onLoginSuccess?.()
    } catch {
      setError(isRegister ? REGISTER_FAILED : LOGIN_FAILED)
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setError('请先填写邮箱')
      return
    }
    setError(null)
    setResetLoading(true)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${AUTH_ROUTES.callback}?next=${encodeURIComponent(AUTH_ROUTES.updatePassword)}`,
      })
      if (resetError) setError(RESET_FAILED)
      else setResetSent(true)
    } catch {
      setError(RESET_FAILED)
    } finally {
      setResetLoading(false)
    }
  }

  function resetForm() {
    setEmail('')
    setPassword('')
    setError(null)
    setLoading(false)
    setIsRegister(false)
    setEmailSent(false)
    setResetSent(false)
  }

  return {
    email, setEmail,
    password, setPassword,
    error, setError,
    loading,
    resetLoading,
    isRegister, setIsRegister,
    emailSent, setEmailSent,
    resetSent, setResetSent,
    handleOAuth,
    handleSubmit,
    handlePasswordReset,
    resetForm,
  }
}
