'use client'

import { useState } from 'react'

export function PasswordUpdatePanel() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ password }),
      })
      const body = await response.json().catch(() => null) as { error?: unknown } | null
      if (!response.ok) {
        setMessage(typeof body?.error === 'string' && body.error ? body.error : '密码更新失败')
        return
      }
      setMessage('密码已更新')
      setPassword('')
    } catch {
      setMessage('密码更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-10 rounded-xl border border-cinnabar/20 bg-surface-inset p-5 shadow-card">
      <h2 className="text-lg font-bold text-text">更新登录密码</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          value={password}
          minLength={8}
          required
          onChange={event => setPassword(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-cinnabar placeholder:text-text-faint/50"
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
      {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
    </form>
  )
}
