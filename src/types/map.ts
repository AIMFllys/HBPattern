export interface GeoPoint {
  lng: number
  lat: number
}

export interface HubeiKeyPlace {
  id: string
  name: string
  category: 'museum' | 'heritage' | 'site' | 'workshop' | 'landmark'
  point: GeoPoint
  summary: string
  patternKeywords: string[]
}

export interface HubeiRegion {
  id: string
  name: string
  shortName: string
  namePinyin: string
  type: 'prefecture' | 'autonomous_prefecture' | 'sub_prefecture' | 'forest_district'
  point: GeoPoint
  culturalIntro: string
  patternKeywords: string[]
  stats: {
    demoPatternCount: number
    ichProjects: number
    keyPlaceCount: number
  }
  keyPlaces: HubeiKeyPlace[]
}

export interface MapPatternOption {
  id: string
  name: string
  description: string | null
  era: string | null
  regionName: string | null
  techniqueName: string | null
  imageUrl: string | null
  colorPalette: string[]
  source: 'gallery' | 'demo'
}

export interface DemoMapBinding {
  id: string
  patternId: string
  patternSource: 'gallery' | 'demo'
  regionId: string
  placeId: string
  note: string
  createdAt: string
}

export interface DemoPatternDraft {
  id: string
  name: string
  description: string
  era: string
  technique: string
  regionId: string
  placeId: string
  imageDataUrl: string | null
  colorPalette: string[]
  createdAt: string
}

export interface PatternAnalysisResult {
  completenessScore: number
  matchedRegionName: string
  matchedPlaceName: string
  dominantColors: string[]
  recommendedTags: string[]
  bindingCountInRegion: number
  summary: string
}
