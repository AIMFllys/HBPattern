import { redirect } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Icon } from '@/components/icons/Icon'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, uploadsRes, collectionsRes] = await Promise.all([
    supabase.from('hp_users').select('*').eq('id', user.id).single(),
    supabase.from('hp_patterns').select('id, name, status, created_at, media:hp_pattern_media(url)').eq('uploader_id', user.id).order('created_at', { ascending: false }),
    supabase.from('hp_collections').select('id, name, is_public, items:hp_collection_items(count)').eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const uploads = uploadsRes.data ?? []
  const collections = collectionsRes.data ?? []

  const statusBadge = (status: string) => {
    if (status === 'approved' || status === 'featured') return 'bg-success/10 text-success'
    if (status === 'pending') return 'bg-warning/10 text-warning'
    return 'bg-error/10 text-error'
  }

  const statusLabel = (status: string) => {
    if (status === 'featured') return '精选'
    if (status === 'approved') return '已通过'
    if (status === 'pending') return '审核中'
    return '已拒绝'
  }

  return (
    <div className="min-h-screen bg-rice">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-12">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-cinnabar/10 flex items-center justify-center text-cinnabar text-2xl font-bold">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.nickname?.[0] ?? '?'
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">{profile?.nickname}</h1>
            <p className="text-sm text-ink-faint">{profile?.email}</p>
            <p className="text-xs text-ink-faint mt-1">等级: {profile?.contributor_level === 'newcomer' ? '🌱 新手' : profile?.contributor_level}</p>
          </div>
          <Link href="/upload" className="ml-auto btn-primary">
            <Icon name="add" size={16} /> 上传纹样
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-xl p-6 border border-rice-deep text-center">
            <p className="text-3xl font-bold text-ink">{uploads.length}</p>
            <p className="text-xs text-ink-faint uppercase tracking-wider mt-1">上传</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-rice-deep text-center">
            <p className="text-3xl font-bold text-ink">{collections.length}</p>
            <p className="text-xs text-ink-faint uppercase tracking-wider mt-1">收藏夹</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-rice-deep text-center">
            <p className="text-3xl font-bold text-ink">{profile?.contribution_points ?? 0}</p>
            <p className="text-xs text-ink-faint uppercase tracking-wider mt-1">贡献分</p>
          </div>
        </div>

        {/* Uploads */}
        <section>
          <h2 className="text-xl font-bold mb-6">我的上传</h2>
          {uploads.length === 0 ? (
            <p className="text-ink-faint text-sm py-8 text-center">还没有上传纹样</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploads.map((p) => (
                <Link key={p.id} href={`/gallery/${p.id}`} className="group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-rice-warm relative">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: '#3d3d30', backgroundImage: p.media?.[0]?.url ? `url("${p.media[0].url}")` : undefined }}
                    />
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </div>
                  <p className="text-sm font-bold mt-2 truncate">{p.name}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter variant="light" />
    </div>
  )
}
