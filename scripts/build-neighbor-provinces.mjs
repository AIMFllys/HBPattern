import { writeFile } from 'node:fs/promises'

/**
 * 拉取湖北周边 6 省边界 GeoJSON（用于地图上下文灰度渲染）
 * 输出：src/data/map/neighbor-provinces-geo.json
 *
 * 邻省 adcode：
 * - 河南 410000
 * - 安徽 340000
 * - 江西 360000
 * - 湖南 430000
 * - 重庆 500000
 * - 陕西 610000
 */

const NEIGHBORS = [
  { adcode: 410000, name: '河南省' },
  { adcode: 340000, name: '安徽省' },
  { adcode: 360000, name: '江西省' },
  { adcode: 430000, name: '湖南省' },
  { adcode: 500000, name: '重庆市' },
  { adcode: 610000, name: '陕西省' },
]

const OUTPUT = new URL('../src/data/map/neighbor-provinces-geo.json', import.meta.url)

const features = []
for (const { adcode, name } of NEIGHBORS) {
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`
  const res = await fetch(url, { headers: { 'User-Agent': 'HBPatternMapBuilder/1.0' } })
  if (!res.ok) {
    console.warn(`Skip ${name}: HTTP ${res.status}`)
    continue
  }
  const geo = await res.json()
  for (const feature of geo.features) {
    features.push({
      type: 'Feature',
      properties: { name: feature.properties.name, adcode: feature.properties.adcode },
      geometry: feature.geometry,
    })
  }
  console.log(`Fetched ${name}: ${geo.features.length} features`)
}

await writeFile(
  OUTPUT,
  `${JSON.stringify({ type: 'FeatureCollection', features })}\n`,
  'utf8',
)
console.log(`Wrote ${features.length} neighbor features to ${OUTPUT.pathname}`)
