import neighborData from '@/data/map/neighbor-provinces-geo.json'
import type { FeatureCollection, Geometry } from 'geojson'

export const neighborProvincesGeoJSON = neighborData as unknown as FeatureCollection<Geometry, { name: string; adcode: number }>
