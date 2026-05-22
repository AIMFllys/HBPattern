import { beforeEach, describe, expect, it } from 'vitest'
import { useCreateStore } from '../useCreateStore'

describe('useCreateStore', () => {
  beforeEach(() => {
    useCreateStore.getState().resetMaterialParams()
    useCreateStore.getState().resetTextureParams()
  })

  it('默认显示文创纯色轮廓，并允许关闭', () => {
    expect(useCreateStore.getState().materialParams.showBaseSurface).toBe(true)

    useCreateStore.getState().setMaterialParam('showBaseSurface', false)

    expect(useCreateStore.getState().materialParams.showBaseSurface).toBe(false)
  })
})
