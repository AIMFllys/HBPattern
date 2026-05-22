import type { DemoMapBinding, DemoPatternDraft, HubeiKeyPlace, HubeiRegion, MapPatternOption } from '@/types'

export const MIN_ZOOM = 0.62
export const MAX_ZOOM = 2.6
export const DEFAULT_VIEW = { zoom: 0.92, pan: { x: 0, y: 0 } }
export const DEFAULT_PALETTE = ['#b84a39', '#c9a84c', '#f5f0e8']

export type DragState = {
  pointerId: number
  x: number
  y: number
}

export type DemoMode = 'bind' | 'create'

export type DraftForm = Omit<DemoPatternDraft, 'id' | 'createdAt'>

export type MapDemoState = {
  bindings: DemoMapBinding[]
  drafts: DemoPatternDraft[]
}

export type DisplayBinding = {
  binding: DemoMapBinding
  pattern: MapPatternOption
  region: HubeiRegion
  place: HubeiKeyPlace
}
