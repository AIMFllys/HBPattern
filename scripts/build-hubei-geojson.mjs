import { writeFile } from 'node:fs/promises'

/**
 * 重新拉取湖北省地市原始 GeoJSON（保留 lng/lat 坐标，不做投影）
 * 输出：src/data/map/hubei-regions-geo.json
 *
 * 同时拉取县级边界（420000_full_v2 不存在，用 420000_full 已是地市级；
 * 县级需逐地市拉 420100_full 等，这里先只做地市级，县级交给 OpenMapTiles admin_level=6）
 */

const PROVINCE_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/420000_full.json'
const OUTPUT = new URL('../src/data/map/hubei-regions-geo.json', import.meta.url)

const response = await fetch(PROVINCE_URL, { headers: { 'User-Agent': 'HBPatternMapBuilder/1.0' } })
if (!response.ok) throw new Error(`Failed to fetch Hubei GeoJSON: ${response.status}`)

const geojson = await response.json()

await writeFile(OUTPUT, `${JSON.stringify(geojson)}\n`, 'utf8')
console.log(`Wrote Hubei GeoJSON (${geojson.features.length} features) to ${OUTPUT.pathname}`)
