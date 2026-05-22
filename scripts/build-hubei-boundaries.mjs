import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/420000_full.json'
const OUTPUT = new URL('../src/data/map/hubei-boundaries.json', import.meta.url)

const REGION_IDS_BY_NAME = {
  武汉市: 'wuhan',
  黄石市: 'huangshi',
  十堰市: 'shiyan',
  宜昌市: 'yichang',
  襄阳市: 'xiangyang',
  鄂州市: 'ezhou',
  荆门市: 'jingmen',
  孝感市: 'xiaogan',
  荆州市: 'jingzhou',
  黄冈市: 'huanggang',
  咸宁市: 'xianning',
  随州市: 'suizhou',
  恩施土家族苗族自治州: 'enshi',
  仙桃市: 'xiantao',
  潜江市: 'qianjiang',
  天门市: 'tianmen',
  神农架林区: 'shennongjia',
}

function collectPoints(geometry) {
  const points = []
  const walk = value => {
    if (typeof value?.[0] === 'number') points.push(value)
    else if (Array.isArray(value)) value.forEach(walk)
  }
  walk(geometry.coordinates)
  return points
}

function bbox(features) {
  const points = features.flatMap(feature => collectPoints(feature.geometry))
  return points.reduce(
    (box, [lng, lat]) => ({
      minLng: Math.min(box.minLng, lng),
      minLat: Math.min(box.minLat, lat),
      maxLng: Math.max(box.maxLng, lng),
      maxLat: Math.max(box.maxLat, lat),
    }),
    { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity },
  )
}

function project([lng, lat], box) {
  const x = ((lng - box.minLng) / (box.maxLng - box.minLng)) * 100
  const y = ((box.maxLat - lat) / (box.maxLat - box.minLat)) * 100
  return `${Number(x.toFixed(3))} ${Number(y.toFixed(3))}`
}

function rings(geometry) {
  return geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
}

function toPath(geometry, box) {
  return rings(geometry)
    .filter(ring => ring.length > 2)
    .map(ring => `M${ring.map(point => project(point, box)).join(' L')} Z`)
    .join(' ')
}

const response = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'HBPatternMapBuilder/1.0' } })
if (!response.ok) throw new Error(`Failed to fetch Hubei boundaries: ${response.status}`)

const geojson = await response.json()
const box = bbox(geojson.features)
const features = geojson.features.map(feature => {
  const name = feature.properties.name
  return {
    id: REGION_IDS_BY_NAME[name],
    adcode: feature.properties.adcode,
    name,
    center: feature.properties.center,
    centroid: feature.properties.centroid ?? feature.properties.center,
    childNum: feature.properties.childrenNum ?? 0,
    path: toPath(feature.geometry, box),
  }
})

if (features.some(feature => !feature.id)) throw new Error('Unmapped Hubei boundary feature found')

await writeFile(
  OUTPUT,
  `${JSON.stringify({
    source: {
      name: 'DataV.GeoAtlas 湖北省地市全量边界',
      url: SOURCE_URL,
      licenseNote: 'Open web atlas data; verify downstream redistribution requirements before commercial release.',
      generatedAt: '2026-05-23',
    },
    bbox: box,
    features,
  })}\n`,
  'utf8',
)

console.log(`Wrote ${features.length} Hubei boundary features to ${OUTPUT.pathname}`)
