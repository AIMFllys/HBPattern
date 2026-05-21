'use client'

import { memo, useCallback } from 'react'
import ParameterSlider from '@/components/ui/ParameterSlider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Icon } from '@/components/icons/Icon'
import { useCreateStore } from '@/stores/useCreateStore'
import type { CameraPreset, TilingMode } from '@/types/create'
import { OffsetPad } from './OffsetPad'

const TILING_OPTIONS: { value: TilingMode; label: string; icon: string }[] = [
  { value: 'single', label: '单次', icon: 'crop_free' },
  { value: 'repeat', label: '重复', icon: 'grid_on' },
  { value: 'mirror', label: '镜像', icon: 'flip' },
]

const CAMERA_OPTIONS: { value: CameraPreset; label: string; icon: string }[] = [
  { value: 'front', label: '正面', icon: 'crop_portrait' },
  { value: 'side', label: '侧面', icon: 'crop_landscape' },
  { value: 'top', label: '俯视', icon: 'vertical_align_bottom' },
  { value: 'free', label: '自由', icon: '3d_rotation' },
]

export const ParameterPanel = memo(function ParameterPanel() {
  const textureParams = useCreateStore(state => state.textureParams)
  const materialParams = useCreateStore(state => state.materialParams)
  const cameraPreset = useCreateStore(state => state.cameraPreset)
  const setTextureParam = useCreateStore(state => state.setTextureParam)
  const setMaterialParam = useCreateStore(state => state.setMaterialParam)
  const setCameraPreset = useCreateStore(state => state.setCameraPreset)
  const resetTextureParams = useCreateStore(state => state.resetTextureParams)
  const resetMaterialParams = useCreateStore(state => state.resetMaterialParams)

  const handleBaseColorChange = useCallback(
    (color: string) => setMaterialParam('baseColor', color),
    [setMaterialParam]
  )

  const handleReset = useCallback(() => {
    resetTextureParams()
    resetMaterialParams()
  }, [resetTextureParams, resetMaterialParams])

  return (
    <div className="border-t border-rice-deep bg-white">
      <div className="p-4">
        <div className="flex items-start gap-5">
          <div className="grid flex-1 grid-cols-2 gap-4 xl:grid-cols-4">
            <ParameterSlider
              label="缩放 SCALE"
              value={textureParams.scale}
              onChange={value => setTextureParam('scale', value)}
              min={10}
              max={300}
              unit="%"
            />
            <ParameterSlider
              label="旋转 ROTATION"
              value={textureParams.rotation}
              onChange={value => setTextureParam('rotation', value)}
              min={0}
              max={360}
              unit="°"
            />
            <ParameterSlider
              label="透明度 OPACITY"
              value={textureParams.opacity}
              onChange={value => setTextureParam('opacity', value)}
              min={0}
              max={100}
              unit="%"
            />
            <ParameterSlider
              label="粗糙度 ROUGH"
              value={materialParams.roughness}
              onChange={value => setMaterialParam('roughness', value)}
              min={0}
              max={100}
              unit="%"
            />
          </div>

          <div className="h-20 w-px self-center bg-rice-deep" />

          <OffsetPad />

          <div className="h-20 w-px self-center bg-rice-deep" />

          <SegmentedIconGroup
            label="平铺"
            options={TILING_OPTIONS}
            activeValue={textureParams.tiling}
            onChange={value => setTextureParam('tiling', value as TilingMode)}
            activeClassName="bg-cinnabar text-white"
          />

          <div className="h-20 w-px self-center bg-rice-deep" />

          <SegmentedIconGroup
            label="视角"
            options={CAMERA_OPTIONS}
            activeValue={cameraPreset}
            onChange={value => setCameraPreset(value as CameraPreset)}
            activeClassName="bg-ink text-white"
          />

          <div className="h-20 w-px self-center bg-rice-deep" />

          <div className="min-w-[168px]">
            <ColorPicker value={materialParams.baseColor} onChange={handleBaseColorChange} label="底色 BASE" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-rice-deep bg-rice-warm/30 px-4 py-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-ink-light transition-colors hover:text-ink-medium"
        >
          <Icon name="restart_alt" size={16} />
          重置参数
        </button>
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <span>X偏移: {textureParams.offsetX}%</span>
          <span>Y偏移: {textureParams.offsetY}%</span>
        </div>
      </div>
    </div>
  )
})

function SegmentedIconGroup({
  label,
  options,
  activeValue,
  onChange,
  activeClassName,
}: {
  label: string
  options: { value: string; label: string; icon: string }[]
  activeValue: string
  onChange: (value: string) => void
  activeClassName: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-tighter text-ink-faint">
        {label}
      </span>
      <div className="flex gap-1">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
              activeValue === option.value
                ? activeClassName
                : 'bg-rice-warm text-ink-light hover:bg-rice-deep'
            }`}
            title={option.label}
            aria-label={option.label}
          >
            <Icon name={option.icon} size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}
