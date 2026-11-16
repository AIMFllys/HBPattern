import { z } from 'zod'
import { findHubeiPlace, findHubeiRegion } from '@/data/map/hubei'
import type { DemoPatternDraft, MapPatternOption } from '@/types'
import { DEFAULT_PALETTE } from '../mapDemoTypes'
import type { DraftForm, MapDemoState } from '../mapDemoTypes'

const mapBindingSchema = z.object({
  id: z.string().min(1),
  patternId: z.string().min(1),
  patternSource: z.enum(['gallery', 'demo']),
  regionId: z.string().min(1),
  placeId: z.string().min(1),
  note: z.string(),
  createdAt: z.string(),
})

const patternDraftSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string(),
  era: z.string(),
  technique: z.string(),
  regionId: z.string().min(1),
  placeId: z.string().min(1),
  imageDataUrl: z.string().nullable(),
  colorPalette: z.array(z.string()),
  createdAt: z.string(),
})

function randomHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Web Crypto random values are unavailable')
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `${prefix}-${randomHex(bytes)}`
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
    const parsed = JSON.parse(value) as Record<string, unknown>
    const bindings = z.array(mapBindingSchema).safeParse(parsed.bindings)
    const drafts = z.array(patternDraftSchema).safeParse(parsed.drafts)
    return {
      bindings: bindings.success ? bindings.data : [],
      drafts: drafts.success ? drafts.data : [],
    }
  } catch {
    return { bindings: [], drafts: [] }
  }
}
