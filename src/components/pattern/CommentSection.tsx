'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Icon } from '@/components/icons/Icon'

interface Comment {
  id: string
  content: string
  parent_id: string | null
  created_at: string
  user: { id: string; nickname: string; avatar_url: string | null }
}

export default function CommentSection({ patternId }: { patternId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    fetch(`/api/patterns/${patternId}/comments`)
      .then((r) => r.json())
      .then((res) => setComments(res.data ?? []))
  }, [patternId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading) return
    setLoading(true)

    const res = await fetch(`/api/patterns/${patternId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setComments([data, ...comments])
      setContent('')
    }
    setLoading(false)
  }

  const topLevel = comments.filter((c) => !c.parent_id)

  return (
    <section className="mt-16 pt-8 border-t border-gold/20">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Icon name="chat" size={20} /> 讨论区
        <span className="text-sm text-ink-faint font-normal">({comments.length})</span>
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
          <div className="w-9 h-9 rounded-full bg-cinnabar/10 flex items-center justify-center text-cinnabar text-sm font-bold shrink-0">
            {user.nickname[0]}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的看法..."
              maxLength={500}
              className="w-full p-3 border border-rice-deep rounded-lg text-sm resize-none focus:border-cinnabar focus:ring-1 focus:ring-cinnabar outline-none bg-white"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-ink-faint">{content.length}/500</span>
              <button
                type="submit"
                disabled={!content.trim() || loading}
                className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
              >
                {loading ? '发送中...' : '发表评论'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-rice-warm rounded-lg text-center text-sm text-ink-light">
          <a href="/login" className="text-cinnabar font-bold hover:underline">登录</a> 后参与讨论
        </div>
      )}

      {topLevel.length === 0 ? (
        <p className="text-center text-ink-faint text-sm py-8">暂无评论，来发表第一条吧</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-rice-warm flex items-center justify-center text-xs font-bold text-ink-medium shrink-0">
                {comment.user.nickname[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">{comment.user.nickname}</span>
                  <span className="text-xs text-ink-faint">{new Date(comment.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <p className="text-sm text-ink-medium mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
