import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import LikeButton from '@/components/pattern/LikeButton'
import CommentSection from '@/components/pattern/CommentSection'
import { getPatternById, getRelatedPatterns } from '@/lib/queries'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const pattern = await getPatternById(id)
  return {
    title: pattern?.name ?? '纹样详情',
    description: pattern?.description?.slice(0, 160) ?? '湖北传统纹样详情',
  }
}

export default async function PatternDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pattern = await getPatternById(id)
  if (!pattern) notFound()

  const related = await getRelatedPatterns(id, pattern.technique_id)
  const palette = (pattern.color_palette as string[] | null) ?? []
  const mainImage = pattern.media?.[0]?.url

  return (
    <div className="layout-container flex h-full grow flex-col bg-[#f8f8f6]">
      <SiteHeader logoIcon="landscape" siteName="纹样大观" primaryColor="gold" />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Image */}
          <div className="relative group">
            <div className="museum-frame bg-white overflow-hidden rounded-lg">
              <div
                className="w-full aspect-[4/5] hover:scale-105 transition-transform duration-700 bg-cover bg-center"
                style={{ backgroundColor: palette[0] ?? '#2a1f0e', backgroundImage: mainImage ? `url("${mainImage}")` : undefined }}
              />
            </div>
            {pattern.is_ai_generated && (
              <div className="absolute top-4 right-4 bg-cinnabar text-white px-3 py-1 rounded text-xs font-bold">
                AI 生成
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-8 py-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <h1 className="text-5xl font-black text-ink leading-tight">{pattern.name}</h1>
                {pattern.era && (
                  <p className="text-gold text-xl italic font-serif">{pattern.era}</p>
                )}
              </div>
              {pattern.status === 'featured' && (
                <div className="seal-tag writing-vertical text-xs font-bold px-1 border-cinnabar-deep/40">珍藏珍品</div>
              )}
            </div>

            <div className="flex gap-4 flex-wrap">
              {pattern.region && (
                <div className="flex items-center gap-2 bg-gold/10 px-4 py-1 rounded-full border border-gold/20">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span className="text-sm font-medium">{pattern.region.name}</span>
                </div>
              )}
              {pattern.technique && (
                <div className="flex items-center gap-2 bg-gold/10 px-4 py-1 rounded-full border border-gold/20">
                  <span className="material-symbols-outlined text-sm">brush</span>
                  <span className="text-sm font-medium">{pattern.technique.name}</span>
                </div>
              )}
              {pattern.ich_record && (
                <div className="flex items-center gap-2 bg-cinnabar/10 px-4 py-1 rounded-full border border-cinnabar/20">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span className="text-sm font-medium">{pattern.ich_record.name}（{pattern.ich_record.level === 'national' ? '国家级' : '省级'}非遗）</span>
                </div>
              )}
            </div>

            {pattern.description && (
              <div className="prose prose-lg max-w-none text-ink/80 leading-relaxed">
                <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-cinnabar-deep first-letter:mr-3 first-letter:float-left">
                  {pattern.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gold/20">
              <div>
                <span className="text-xs text-gold uppercase tracking-widest block mb-1">主色调</span>
                <div className="flex gap-2">
                  {palette.map((color, i) => (
                    <div key={i} className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gold uppercase tracking-widest block mb-1">浏览量</span>
                <span className="font-bold">{pattern.view_count}</span>
              </div>
              <div>
                <span className="text-xs text-gold uppercase tracking-widest block mb-1">获赞</span>
                <LikeButton patternId={pattern.id} initialLiked={false} initialCount={pattern.like_count} />
              </div>
            </div>

            {/* Tags */}
            {pattern.tags && pattern.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {pattern.tags.map((t: { tag: { id: string; name: string } }) => (
                  <span key={t.tag.id} className="px-3 py-1 bg-rice-warm border border-rice-deep rounded-full text-xs text-ink-medium">
                    {t.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <CommentSection patternId={pattern.id} />

        {/* Related Patterns */}
        {related.length > 0 && (
          <section className="mt-24 mb-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold tracking-widest">相关纹样</h3>
              <Link href="/gallery" className="text-sm text-gold font-bold flex items-center gap-1 hover:underline">
                查看更多 <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((p) => (
                <Link key={p.id} href={`/gallery/${p.id}`} className="flex flex-col gap-3 group">
                  <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gold/10">
                    <div
                      className="w-full h-full group-hover:scale-110 transition-transform duration-500 bg-cover bg-center"
                      style={{ backgroundColor: '#3d3d30', backgroundImage: p.media?.[0]?.url ? `url("${p.media[0].url}")` : undefined }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold">{p.name}</h5>
                    <span className="text-xs text-gold">{p.era}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter variant="dark" />
    </div>
  )
}
