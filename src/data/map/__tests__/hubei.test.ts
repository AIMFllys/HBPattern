import { describe, expect, it } from 'vitest'
import {
  HUBEI_GEO_SOURCE,
  HUBEI_MAP_LABEL_THRESHOLDS,
  HUBEI_MAP_STORAGE_KEY,
  HUBEI_OUTLINE_PATH,
  hubeiRegions,
  projectHubeiPoint,
} from '../hubei'
import { hubeiBoundaryFeatures } from '../hubeiBoundaries'

describe('hubeiRegions', () => {
  it('覆盖湖北 17 个地级和省直管区域', () => {
    expect(hubeiRegions).toHaveLength(17)
    expect(hubeiRegions.map(region => region.name)).toEqual([
      '武汉市',
      '黄石市',
      '十堰市',
      '宜昌市',
      '襄阳市',
      '鄂州市',
      '荆门市',
      '孝感市',
      '荆州市',
      '黄冈市',
      '咸宁市',
      '随州市',
      '恩施土家族苗族自治州',
      '仙桃市',
      '潜江市',
      '天门市',
      '神农架林区',
    ])
  })

  it('每个区域都有关键地点、关键词和可投影坐标', () => {
    for (const region of hubeiRegions) {
      expect(region.keyPlaces.length).toBeGreaterThanOrEqual(3)
      expect(region.stats.keyPlaceCount).toBe(region.keyPlaces.length)
      expect(region.patternKeywords.length).toBeGreaterThanOrEqual(3)

      const cityPoint = projectHubeiPoint(region.point)
      expect(cityPoint.x).toBeGreaterThanOrEqual(0)
      expect(cityPoint.x).toBeLessThanOrEqual(100)
      expect(cityPoint.y).toBeGreaterThanOrEqual(0)
      expect(cityPoint.y).toBeLessThanOrEqual(100)

      for (const place of region.keyPlaces) {
        expect(place.patternKeywords.length).toBeGreaterThanOrEqual(2)
        const projected = projectHubeiPoint(place.point)
        expect(projected.x).toBeGreaterThanOrEqual(0)
        expect(projected.x).toBeLessThanOrEqual(100)
        expect(projected.y).toBeGreaterThanOrEqual(0)
        expect(projected.y).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('Hubei map constants', () => {
  it('保留 Demo 存储 key、阈值和来源信息', () => {
    expect(HUBEI_MAP_STORAGE_KEY).toBe('hbpattern.mapDemo.v1')
    expect(HUBEI_MAP_LABEL_THRESHOLDS).toEqual({
      province: 0.8,
      city: 0.8,
      binding: 1.1,
      place: 1.45,
      patternThumbnail: 1.8,
    })
    expect(HUBEI_GEO_SOURCE.name).toContain('ADM2')
    expect(HUBEI_GEO_SOURCE.apiUrl).toContain('420000_full.json')
    expect(HUBEI_OUTLINE_PATH.startsWith('M')).toBe(true)
    expect(HUBEI_OUTLINE_PATH.endsWith('Z')).toBe(true)
  })

  it('加载 17 个高细节地市边界 path', () => {
    expect(hubeiBoundaryFeatures).toHaveLength(17)
    for (const feature of hubeiBoundaryFeatures) {
      expect(feature.path.startsWith('M')).toBe(true)
      expect(feature.path.length).toBeGreaterThan(500)
    }
  })
})
