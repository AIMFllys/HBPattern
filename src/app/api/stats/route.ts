import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { getStats } from '@/lib/queries'

export const GET = withApi(async () => {
  const stats = await getStats()
  return ok(stats)
})
