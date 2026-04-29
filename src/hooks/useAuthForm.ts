'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const [isRegister, setIsRegister] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleOAuth() {
    const supabase = createClient()
    const callbackUrl = redirectAfterOAuth
      ? `/auth/callback?next=${encodeURIComponent(redirectAfterOAuth)}`
      : '/auth/callback'

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
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
        // 立即同步 user 到 store（不等 onAuthStateChange）
        const { data: profile } = await supabase
          .from('hp_users')
          .select('id, email, nickname, avatar_url, role')
          .eq('id', data.user.id)
          .single()
        if (profile) useAuthStore.getState().setUser(profile)
        setLoading(false)
        onLoginSuccess?.()
      }
    }
  }

  function resetForm() {
    setEmail('')
    setPassword('')
    setError(null)
    setLoading(false)
    setIsRegister(false)
    setEmailSent(false)
  }

  return {
    email, setEmail,
    password, setPassword,
    error, setError,
    loading,
    isRegister, setIsRegister,
    emailSent, setEmailSent,
    handleOAuth,
    handleSubmit,
    resetForm,
  }
}
