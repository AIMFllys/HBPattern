import { getPatterns } from '@/lib/queries'
import WorkshopClient from '@/components/workshop/WorkshopClient'

export default async function WorkshopPage() {
  const { patterns: initialPatterns, total: initialTotal } = await getPatterns({
    limit: 20,
    sort: 'newest',
  })

  return (
    <WorkshopClient
      initialPatterns={initialPatterns}
      initialTotal={initialTotal}
    />
  )
}
