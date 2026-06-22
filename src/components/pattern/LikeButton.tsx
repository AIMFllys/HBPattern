'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'

interface LikeButtonProps {
  patternId: string
  initialLiked: boolean
  initialCount: number
}

export default function LikeButton({ patternId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [animating, setAnimating] = useState(false)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  // 服务端渲染无法获知当前用户的点赞状态（页面以 initialLiked=false 占位），
  // 登录用户挂载后向 GET 接口拉取真实状态，避免「已点赞却显示空心」。
  // 未登录时保持占位的 false，不在 effect 中同步 setState。
  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    fetch(`/api/patterns/${patternId}/like`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.data) setLiked(!!res.data.liked)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [patternId, user])

  async function handleClick() {
    if (!user) { router.push('/login'); return }

    // Optimistic update
    const prevLiked = liked
    const prevCount = count
    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 300)

    const res = await fetch(`/api/patterns/${patternId}/like`, { method: 'POST' })
    if (!res.ok) {
      setLiked(prevLiked)
      setCount(prevCount)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all hover:shadow-sm active:scale-95"
      style={{
        borderColor: liked ? 'var(--color-cinnabar)' : 'var(--color-border)',
        backgroundColor: liked ? 'rgba(184,74,57,0.08)' : 'transparent',
      }}
      aria-label={liked ? '取消点赞' : '点赞'}
    >
      <span
        className={`text-xl transition-transform ${animating ? 'scale-130' : 'scale-100'}`}
        style={{ color: liked ? 'var(--color-cinnabar)' : 'var(--color-text-faint)', display: 'inline-block', transform: animating ? 'scale(1.3)' : 'scale(1)', transition: 'transform 200ms ease-out' }}
      >
        {liked ? '❤️' : '🤍'}
      </span>
      <span className={`text-sm font-bold ${liked ? 'text-cinnabar' : 'text-text-faint'}`}>
        {count}
      </span>
    </button>
  )
}
