import { beforeEach, describe, expect, it } from 'vitest'
import { useWorkshopStore } from '../useWorkshopStore'
import type { PatternListItem } from '@/types'

const pattern: PatternListItem = {
  id: 'pattern-no-image',
  name: '无图纹样',
  description: '测试占位图',
  era: '当代',
  is_ai_generated: false,
  status: 'approved',
  color_palette: ['#8c2f22', '#c9a84c'],
  view_count: 0,
  like_count: 0,
  region: { name: '武汉市' },
  technique: { name: '刺绣' },
  media: [],
  tags: [],
}

describe('useWorkshopStore', () => {
  beforeEach(() => {
    useWorkshopStore.getState().resetWorkshop()
  })

  it('无图片纹样也能生成占位图层', () => {
    const id = useWorkshopStore.getState().addPatternLayer(pattern)
    const layer = useWorkshopStore.getState().layers.find(item => item.id === id)

    expect(layer?.sourceImageUrl).toContain('data:image/svg+xml')
    expect(layer?.sourcePatternName).toBe('无图纹样')
  })

  it('可以添加并删除纯色底纹图层', () => {
    const id = useWorkshopStore.getState().addColorLayer('#000000')

    expect(useWorkshopStore.getState().layers.some(layer => layer.id === id)).toBe(true)
    useWorkshopStore.getState().removeLayer(id)
    expect(useWorkshopStore.getState().layers.some(layer => layer.id === id)).toBe(false)
  })
})
