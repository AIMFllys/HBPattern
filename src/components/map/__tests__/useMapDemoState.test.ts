import { describe, expect, it } from 'vitest'
import type { DemoMapBinding, DemoPatternDraft } from '@/types'
import { createInitialMapDemoState, mapDemoReducer } from '../useMapDemoState'

function createBinding(): DemoMapBinding {
  return {
    id: 'binding-1',
    patternId: 'pattern-1',
    patternSource: 'gallery',
    regionId: 'wuhan',
    placeId: 'wuhan-hubei-museum',
    note: '',
    createdAt: '2026-05-22T00:00:00.000Z',
  }
}

function createDraft(): DemoPatternDraft {
  return {
    id: 'demo-pattern-1',
    name: '测试纹样',
    description: '测试说明',
    era: '现代',
    technique: '测试',
    regionId: 'wuhan',
    placeId: 'wuhan-hubei-museum',
    imageDataUrl: null,
    colorPalette: ['#b84a39'],
    createdAt: '2026-05-22T00:00:00.000Z',
  }
}

describe('map demo reducer', () => {
  it('syncs selected location and dependent form state in one reducer action', () => {
    const state = mapDemoReducer(createInitialMapDemoState('pattern-1'), {
      type: 'syncSelectedLocation',
      regionId: 'wuhan',
      placeId: 'wuhan-hubei-museum',
    })

    expect(state.selectedRegionId).toBe('wuhan')
    expect(state.selectedPlaceId).toBe('wuhan-hubei-museum')
    expect(state.bindingRegionId).toBe('wuhan')
    expect(state.bindingPlaceId).toBe('wuhan-hubei-museum')
    expect(state.draftForm.placeId).toBe('wuhan-hubei-museum')
  })

  it('hydrates validated storage state and marks storage ready', () => {
    const state = mapDemoReducer(createInitialMapDemoState('pattern-1'), {
      type: 'hydrateStorage',
      stored: { bindings: [createBinding()], drafts: [createDraft()] },
    })

    expect(state.storageReady).toBe(true)
    expect(state.bindings).toHaveLength(1)
    expect(state.drafts).toHaveLength(1)
  })

  it('adds a saved draft and binding while resetting the draft form', () => {
    const draft = createDraft()
    const binding = createBinding()
    const state = mapDemoReducer(createInitialMapDemoState('pattern-1'), {
      type: 'addDraftAndBinding',
      draft,
      binding,
      minZoom: 1.45,
    })

    expect(state.selectedPatternId).toBe(draft.id)
    expect(state.mode).toBe('bind')
    expect(state.zoom).toBe(1.45)
    expect(state.draftForm.name).toBe('')
    expect(state.selectedPlaceId).toBe(draft.placeId)
  })
})
