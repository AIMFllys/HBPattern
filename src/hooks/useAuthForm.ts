'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ensureUserProfile } from '@/lib/auth/profile'
import { AUTH_ROUTES } from '@/lib/auth/routes'
import { useAuthStore } from '@/stores/useAuthStore'

interface UseAuthFormOptions {
  redirectAfterOAuth?: string
  onLoginSuccess?: () => void
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
    setLoading(true)

    const supabase = createClient()

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${AUTH_ROUTES.callback}`,
          data: { full_name: email.split('@')[0] },
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setEmailSent(true)
      }
      setLoading(false)
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data.user) {
        const profile = await ensureUserProfile(supabase, data.user)
        if (profile) useAuthStore.getState().setUser(profile)
        setLoading(false)
        onLoginSuccess?.()
      }
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setError('请先填写邮箱')
      return
    }
    setError(null)
    setResetLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${AUTH_ROUTES.callback}?next=${encodeURIComponent(AUTH_ROUTES.updatePassword)}`,
    })
    setResetLoading(false)
    if (error) setError(error.message)
    else setResetSent(true)
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
