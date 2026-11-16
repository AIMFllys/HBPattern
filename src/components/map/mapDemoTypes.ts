import type { DemoMapBinding, DemoPatternDraft, HubeiKeyPlace, HubeiRegion, MapPatternOption } from '@/types'

export const DEFAULT_PALETTE = ['#b84a39', '#c9a84c', '#f5f0e8']

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

