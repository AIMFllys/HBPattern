import { redirect } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Icon } from '@/components/icons/Icon'
import { createClient } from '@/lib/supabase/server'
import ModerationList from '@/components/admin/ModerationList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('hp_users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [patternsRes, usersRes, pendingRes, pendingListRes] = await Promise.all([
    supabase.from('hp_patterns').select('*', { count: 'exact', head: true }).in('status', ['approved', 'featured']),
    supabase.from('hp_users').select('*', { count: 'exact', head: true }),
    supabase.from('hp_patterns').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('hp_patterns').select('id, name, era, created_at, uploader:hp_users(nickname), media:hp_pattern_media(url)').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <SiteHeader logoIcon="account_balance" siteName="管理后台" primaryColor="cinnabar" />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-8">数据概览</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-rice-deep">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="landscape" size={24} className="text-cinnabar" />
              <span className="text-sm text-ink-faint">已发布纹样</span>
            </div>
            <p className="text-3xl font-bold text-ink">{patternsRes.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-rice-deep">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="group" size={24} className="text-cinnabar" />
              <span className="text-sm text-ink-faint">注册用户</span>
            </div>
            <p className="text-3xl font-bold text-ink">{usersRes.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-rice-deep">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="pending" size={24} className="text-warning" />
              <span className="text-sm text-ink-faint">待审核</span>
            </div>
            <p className="text-3xl font-bold text-warning">{pendingRes.count ?? 0}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">待审核纹样</h2>
        <ModerationList patterns={pendingListRes.data ?? []} />
      </main>
      <SiteFooter variant="light" />
    </div>
  )
}
