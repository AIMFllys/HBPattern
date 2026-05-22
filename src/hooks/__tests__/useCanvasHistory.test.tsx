/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCanvasHistory } from '../useCanvasHistory'
import { useWorkshopStore } from '@/stores/useWorkshopStore'

describe('useCanvasHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
    useWorkshopStore.getState().resetWorkshop()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('debounces localStorage draft persistence', () => {
    renderHook(() => useCanvasHistory())

    expect(window.localStorage.getItem('hbpattern-workshop-draft')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(window.localStorage.getItem('hbpattern-workshop-draft')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(window.localStorage.getItem('hbpattern-workshop-draft')).toContain('layers')
  })
})
