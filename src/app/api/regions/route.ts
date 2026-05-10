import { createClient } from '@/lib/supabase/server'
import { withApi } from '@/lib/api/withApi'
import { ok } from '@/lib/api/response'
import { AppError } from '@/lib/api/errors'

export const GET = withApi(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hp_regions')
    .select('id, name, province, city, cultural_intro')
    .order('name')

  if (error) throw new AppError('INTERNAL_ERROR', '获取地区列表失败', { details: error })

  return ok(data)
})
