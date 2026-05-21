'use client'

import { Icon } from '@/components/icons/Icon'
import { useCreateStore } from '@/stores/useCreateStore'

export function ViewportToolbar() {
  const setCameraPreset = useCreateStore(state => state.setCameraPreset)

  return (
    <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setCameraPreset('front')}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-light shadow-card transition-all hover:text-cinnabar hover:shadow-hover"
        title="重置视角"
        aria-label="重置视角"
      >
        <Icon name="center_focus_strong" size={20} />
      </button>
      <button
        type="button"
        onClick={() => setCameraPreset('free')}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-light shadow-card transition-all hover:text-cinnabar hover:shadow-hover"
        title="自由视角"
        aria-label="自由视角"
      >
        <Icon name="3d_rotation" size={20} />
      </button>
    </div>
  )
}
