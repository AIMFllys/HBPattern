import { MetadataRoute } from 'next'
import { getPatterns } from '@/lib/queries'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hbpattern.husteread.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { patterns } = await getPatterns({ page: 1, limit: 1000 })

  const patternUrls = patterns.map((p) => ({
    url: `${BASE_URL}/gallery/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...patternUrls,
  ]
}
