'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PasswordUpdatePanel() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    setMessage(error ? error.message : '密码已更新')
    if (!error) setPassword('')
  }

  return (
    <form onSubmit={handleSubmit} className="mb-10 rounded-xl border border-cinnabar/20 bg-white p-5 shadow-card">
      <h2 className="text-lg font-bold text-ink">更新登录密码</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          value={password}
          minLength={8}
          required
          onChange={event => setPassword(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-rice-deep bg-rice px-4 py-2 text-sm outline-none focus:border-cinnabar"
          placeholder="输入新密码"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-cinnabar px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? '更新中...' : '保存密码'}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-ink-light">{message}</p>}
    </form>
  )
}
