'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Icon } from '@/components/icons/Icon'

export default function UserMenu() {
  const { user, isLoading } = useAuthStore()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  if (isLoading) {
    return <div className="w-10 h-10 rounded-full bg-rice-warm animate-pulse" />
  }

  if (!user) {
    return (
      <Link href="/login" className="flex items-center justify-center w-10 h-10 rounded-full bg-rice-warm text-ink-medium hover:text-cinnabar hover:bg-cinnabar/10 transition-colors">
        <Icon name="person" />
      </Link>
    )
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-rice-deep hover:border-cinnabar transition-colors"
        aria-label="用户菜单"
      >
        {user.avatar_url ? (
          <Image src={user.avatar_url} alt={user.nickname} width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-cinnabar/10 flex items-center justify-center text-cinnabar font-bold text-sm">
            {user.nickname[0]}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-xl shadow-xl border border-rice-deep py-2">
            <div className="px-4 py-2 border-b border-rice-deep">
              <p className="text-sm font-bold text-ink truncate">{user.nickname}</p>
              <p className="text-xs text-ink-faint truncate">{user.email}</p>
            </div>
            <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-ink-medium hover:bg-rice-warm hover:text-cinnabar">
              <Icon name="person" size={16} /> 个人中心
            </Link>
            {user.role === 'admin' && (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-ink-medium hover:bg-rice-warm hover:text-cinnabar">
                <Icon name="dashboard" size={16} /> 管理后台
              </Link>
            )}
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-medium hover:bg-rice-warm hover:text-error">
              <Icon name="logout" size={16} /> 退出登录
            </button>
          </div>
        </>
      )}
    </div>
  )
}
