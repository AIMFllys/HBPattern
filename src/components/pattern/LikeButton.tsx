'use client'

import { useState } from 'react'
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
        borderColor: liked ? 'var(--color-cinnabar)' : 'var(--color-rice-deep)',
        backgroundColor: liked ? 'rgba(184,74,57,0.08)' : 'transparent',
      }}
      aria-label={liked ? '取消点赞' : '点赞'}
    >
      <span
        className={`text-xl transition-transform ${animating ? 'scale-130' : 'scale-100'}`}
        style={{ color: liked ? 'var(--color-cinnabar)' : 'var(--color-ink-faint)', display: 'inline-block', transform: animating ? 'scale(1.3)' : 'scale(1)', transition: 'transform 200ms ease-out' }}
      >
        {liked ? '❤️' : '🤍'}
      </span>
      <span className={`text-sm font-bold ${liked ? 'text-cinnabar' : 'text-ink-faint'}`}>
        {count}
      </span>
    </button>
  )
}
