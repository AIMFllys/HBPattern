import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import GalleryClient from '@/components/gallery/GalleryClient'
import { getPatterns } from '@/lib/queries'

export default async function GalleryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const era = params.era || undefined
  const sort = params.sort || 'newest'
  const q = params.q || undefined

  const { patterns, total } = await getPatterns({ page, limit: 12, era, sort, q })
  const totalPages = Math.ceil(total / 12)

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <SiteHeader logoIcon="filter_vintage" siteName="湖北传统纹样库" primaryColor="cinnabar" />
      <GalleryClient
        patterns={patterns}
        total={total}
        page={page}
        totalPages={totalPages}
        currentEra={era}
        currentSort={sort}
      />
      <SiteFooter variant="light" />
    </div>
  )
}
