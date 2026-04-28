'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import { Icon } from '@/components/icons/Icon'
import { createClient } from '@/lib/supabase/client'

export default function UploadPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [era, setEra] = useState('')
  const [regionId, setRegionId] = useState('')
  const [techniqueId, setTechniqueId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [techniques, setTechniques] = useState<{ id: string; name: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('hp_regions').select('id, name').then(({ data }) => setRegions(data ?? []))
    supabase.from('hp_techniques').select('id, name').then(({ data }) => setTechniques(data ?? []))
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !file) return
    setUploading(true)

    // 1. Upload image
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!uploadRes.ok) { setUploading(false); return }
    const { data: { url } } = await uploadRes.json()

    // 2. Create pattern
    const res = await fetch('/api/patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, era, regionId: regionId || undefined, techniqueId: techniqueId || undefined, imageUrl: url }),
    })

    if (res.ok) {
      router.push('/profile')
    }
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-rice">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold font-serif text-ink mb-2">上传纹样</h1>
        <p className="text-ink-light text-sm mb-10">上传后将进入审核流程，通过后即可在画廊展示。</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image Upload */}
          <label className="aspect-[4/5] border-2 border-dashed border-rice-deep rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-cinnabar transition-colors overflow-hidden bg-white">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="预览" className="w-full h-full object-cover" />
            ) : (
              <>
                <Icon name="cloud_upload" size={48} className="text-ink-faint mb-3" />
                <p className="text-sm text-ink-faint">点击或拖放图片</p>
                <p className="text-xs text-ink-faint mt-1">JPG / PNG / WebP, 最大 10MB</p>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          </label>

          {/* Form Fields */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-bold text-ink-medium uppercase tracking-wider block mb-1">名称 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} className="w-full px-4 py-2.5 border border-rice-deep rounded-lg text-sm focus:border-cinnabar focus:ring-1 focus:ring-cinnabar outline-none bg-white" placeholder="如：战国凤鸟纹" />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-medium uppercase tracking-wider block mb-1">年代</label>
              <input value={era} onChange={(e) => setEra(e.target.value)} className="w-full px-4 py-2.5 border border-rice-deep rounded-lg text-sm focus:border-cinnabar focus:ring-1 focus:ring-cinnabar outline-none bg-white" placeholder="如：战国、清代" />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-medium uppercase tracking-wider block mb-1">地区</label>
              <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="w-full px-4 py-2.5 border border-rice-deep rounded-lg text-sm focus:border-cinnabar outline-none bg-white">
                <option value="">选择地区</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-ink-medium uppercase tracking-wider block mb-1">工艺</label>
              <select value={techniqueId} onChange={(e) => setTechniqueId(e.target.value)} className="w-full px-4 py-2.5 border border-rice-deep rounded-lg text-sm focus:border-cinnabar outline-none bg-white">
                <option value="">选择工艺</option>
                {techniques.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-ink-medium uppercase tracking-wider block mb-1">描述</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={500} className="w-full px-4 py-2.5 border border-rice-deep rounded-lg text-sm focus:border-cinnabar focus:ring-1 focus:ring-cinnabar outline-none bg-white resize-none" placeholder="纹样的历史背景、文化含义..." />
            </div>
            <button type="submit" disabled={!name.trim() || !file || uploading} className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? '上传中...' : '提交审核'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
