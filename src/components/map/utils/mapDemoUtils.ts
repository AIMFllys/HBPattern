import { findHubeiPlace, findHubeiRegion } from '@/data/map/hubei'
import type { DemoPatternDraft, MapPatternOption } from '@/types'
import { DEFAULT_PALETTE, MAX_ZOOM, MIN_ZOOM } from '../mapDemoTypes'
import type { DraftForm, MapDemoState } from '../mapDemoTypes'

export function clampZoom(value: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2))))
}

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getFirstPlaceId(regionId: string) {
  return findHubeiRegion(regionId)?.keyPlaces[0]?.id ?? ''
}

export function ensurePlaceId(regionId: string, placeId: string) {
  return findHubeiPlace(regionId, placeId)?.id ?? getFirstPlaceId(regionId)
}

export function createEmptyDraft(regionId = 'wuhan', placeId = getFirstPlaceId('wuhan')): DraftForm {
  return {
    name: '',
    description: '',
    era: '',
    technique: '',
    regionId,
    placeId,
    imageDataUrl: null,
    colorPalette: DEFAULT_PALETTE,
  }
}

export function draftToPatternOption(draft: DemoPatternDraft): MapPatternOption {
  const region = findHubeiRegion(draft.regionId)
  return {
    id: draft.id,
    name: draft.name,
    description: draft.description || null,
    era: draft.era || null,
    regionName: region?.name ?? null,
    techniqueName: draft.technique || null,
    imageUrl: draft.imageDataUrl,
    colorPalette: draft.colorPalette.length > 0 ? draft.colorPalette : DEFAULT_PALETTE,
    source: 'demo',
  }
}

export function parseStoredState(value: string | null): MapDemoState {
  if (!value) return { bindings: [], drafts: [] }
  try {
    const parsed = JSON.parse(value) as Partial<MapDemoState>
    return {
      bindings: Array.isArray(parsed.bindings) ? parsed.bindings : [],
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
    }
  } catch {
    return { bindings: [], drafts: [] }
  }
}
