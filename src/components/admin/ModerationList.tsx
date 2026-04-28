'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PendingPattern {
  id: string
  name: string
  era: string | null
  created_at: string
  uploader: { nickname: string }[] | null
  media: { url: string }[]
}

export default function ModerationList({ patterns }: { patterns: PendingPattern[] }) {
  const [items, setItems] = useState(patterns)
  const router = useRouter()

  async function handleModerate(id: string, action: 'approve' | 'reject') {
    const res = await fetch(`/api/patterns/${id}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      setItems(items.filter((p) => p.id !== id))
      router.refresh()
    }
  }

  if (items.length === 0) {
    return <p className="text-ink-faint text-sm py-8 text-center">暂无待审核纹样 🎉</p>
  }

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <div key={p.id} className="flex items-center gap-4 bg-white rounded-lg border border-rice-deep p-4">
          <div
            className="w-16 h-16 rounded-lg bg-rice-warm bg-cover bg-center shrink-0"
            style={{ backgroundImage: p.media?.[0]?.url ? `url("${p.media[0].url}")` : undefined }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink truncate">{p.name}</p>
            <p className="text-xs text-ink-faint">
              {p.uploader?.[0]?.nickname ?? '未知'} · {p.era ?? '未标注'} · {new Date(p.created_at).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => handleModerate(p.id, 'approve')} className="px-3 py-1.5 bg-success/10 text-success text-xs font-bold rounded-lg hover:bg-success/20">
              通过
            </button>
            <button onClick={() => handleModerate(p.id, 'reject')} className="px-3 py-1.5 bg-error/10 text-error text-xs font-bold rounded-lg hover:bg-error/20">
              拒绝
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
