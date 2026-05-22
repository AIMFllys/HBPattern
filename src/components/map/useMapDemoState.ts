import type { DemoMapBinding, DemoPatternDraft } from '@/types'
import { DEFAULT_VIEW } from './mapDemoTypes'
import type { DemoMode, DraftForm, MapDemoState } from './mapDemoTypes'
import { createEmptyDraft, getFirstPlaceId } from './utils/mapDemoUtils'

export interface MapDemoUiState {
  zoom: number
  pan: { x: number; y: number }
  selectedRegionId: string
  selectedPlaceId: string | null
  mode: DemoMode
  patternQuery: string
  selectedPatternId: string
  bindingRegionId: string
  bindingPlaceId: string
  bindingNote: string
  bindings: DemoMapBinding[]
  drafts: DemoPatternDraft[]
  draftForm: DraftForm
  imageError: string
  storageReady: boolean
}

type MapDemoAction =
  | { type: 'hydrateStorage'; stored: MapDemoState }
  | { type: 'setZoom'; zoom: number }
  | { type: 'setPan'; pan: { x: number; y: number } }
  | { type: 'setMode'; mode: DemoMode }
  | { type: 'setPatternQuery'; query: string }
  | { type: 'setSelectedPatternId'; patternId: string }
  | { type: 'setBindingPlaceId'; placeId: string }
  | { type: 'setBindingNote'; note: string }
  | { type: 'setImageError'; message: string }
  | { type: 'setDraftForm'; draftForm: DraftForm }
  | { type: 'patchDraftForm'; patch: Partial<DraftForm> }
  | { type: 'updateBindingRegion'; regionId: string }
  | { type: 'updateDraftRegion'; regionId: string }
  | { type: 'syncSelectedLocation'; regionId: string; placeId: string | null }
  | { type: 'addBinding'; binding: DemoMapBinding; minZoom: number }
  | { type: 'addDraftAndBinding'; draft: DemoPatternDraft; binding: DemoMapBinding; minZoom: number }
  | { type: 'removeBinding'; bindingId: string }
  | { type: 'resetView' }

export function createInitialMapDemoState(selectedPatternId: string): MapDemoUiState {
  return {
    zoom: DEFAULT_VIEW.zoom,
    pan: DEFAULT_VIEW.pan,
    selectedRegionId: 'wuhan',
    selectedPlaceId: null,
    mode: 'bind',
    patternQuery: '',
    selectedPatternId,
    bindingRegionId: 'wuhan',
    bindingPlaceId: getFirstPlaceId('wuhan'),
    bindingNote: '',
    bindings: [],
    drafts: [],
    draftForm: createEmptyDraft(),
    imageError: '',
    storageReady: false,
  }
}

export function mapDemoReducer(state: MapDemoUiState, action: MapDemoAction): MapDemoUiState {
  switch (action.type) {
    case 'hydrateStorage':
      return {
        ...state,
        bindings: action.stored.bindings,
        drafts: action.stored.drafts,
        storageReady: true,
      }
    case 'setZoom':
      return { ...state, zoom: action.zoom }
    case 'setPan':
      return { ...state, pan: action.pan }
    case 'setMode':
      return { ...state, mode: action.mode }
    case 'setPatternQuery':
      return { ...state, patternQuery: action.query }
    case 'setSelectedPatternId':
      return { ...state, selectedPatternId: action.patternId }
    case 'setBindingPlaceId':
      return { ...state, bindingPlaceId: action.placeId }
    case 'setBindingNote':
      return { ...state, bindingNote: action.note }
    case 'setImageError':
      return { ...state, imageError: action.message }
    case 'setDraftForm':
      return { ...state, draftForm: action.draftForm }
    case 'patchDraftForm':
      return { ...state, draftForm: { ...state.draftForm, ...action.patch } }
    case 'updateBindingRegion': {
      const placeId = getFirstPlaceId(action.regionId)
      return { ...state, bindingRegionId: action.regionId, bindingPlaceId: placeId }
    }
    case 'updateDraftRegion':
      return {
        ...state,
        draftForm: {
          ...state.draftForm,
          regionId: action.regionId,
          placeId: getFirstPlaceId(action.regionId),
        },
      }
    case 'syncSelectedLocation': {
      const placeId = action.placeId ?? getFirstPlaceId(action.regionId)
      return {
        ...state,
        selectedRegionId: action.regionId,
        selectedPlaceId: action.placeId,
        bindingRegionId: action.regionId,
        bindingPlaceId: placeId,
        draftForm: {
          ...state.draftForm,
          regionId: action.regionId,
          placeId,
        },
      }
    }
    case 'addBinding':
      return {
        ...state,
        bindings: [action.binding, ...state.bindings],
        bindingNote: '',
        zoom: Math.max(state.zoom, action.minZoom),
        ...selectionPatch(action.binding.regionId, action.binding.placeId, state.draftForm),
      }
    case 'addDraftAndBinding':
      return {
        ...state,
        drafts: [action.draft, ...state.drafts],
        bindings: [action.binding, ...state.bindings],
        selectedPatternId: action.draft.id,
        patternQuery: '',
        draftForm: createEmptyDraft(action.draft.regionId, action.draft.placeId),
        mode: 'bind',
        zoom: Math.max(state.zoom, action.minZoom),
        selectedRegionId: action.draft.regionId,
        selectedPlaceId: action.draft.placeId,
        bindingRegionId: action.draft.regionId,
        bindingPlaceId: action.draft.placeId,
      }
    case 'removeBinding':
      return { ...state, bindings: state.bindings.filter(binding => binding.id !== action.bindingId) }
    case 'resetView':
      return {
        ...state,
        zoom: DEFAULT_VIEW.zoom,
        pan: DEFAULT_VIEW.pan,
        ...selectionPatch('wuhan', null, state.draftForm),
      }
    default:
      return state
  }
}

function selectionPatch(regionId: string, selectedPlaceId: string | null, currentDraftForm: DraftForm) {
  const formPlaceId = selectedPlaceId ?? getFirstPlaceId(regionId)
  return {
    selectedRegionId: regionId,
    selectedPlaceId,
    bindingRegionId: regionId,
    bindingPlaceId: formPlaceId,
    draftForm: {
      ...currentDraftForm,
      regionId,
      placeId: formPlaceId,
    },
  }
}
