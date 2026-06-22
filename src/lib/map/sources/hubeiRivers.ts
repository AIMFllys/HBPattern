import riversData from '@/data/map/hubei-rivers.json'
import type { FeatureCollection, LineString } from 'geojson'

export const hubeiRiversGeoJSON = riversData as unknown as FeatureCollection<LineString, { name: string; class: string }>
