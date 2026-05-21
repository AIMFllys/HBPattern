'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/icons/Icon'

const PRESET_COLORS = [
  { color: '#f5f0e8', name: '宣纸白' },
  { color: '#2a1f0e', name: '漆器黑' },
  { color: '#1a1a14', name: '浓墨' },
  { color: '#1e3a8a', name: '靛蓝' },
  { color: '#5a2a0e', name: '紫檀木' },
  { color: '#8B4513', name: '胡桃木' },
  { color: '#c9a84c', name: '烫金' },
  { color: '#b84a39', name: '朱砂红' },
  { color: '#3a6a4a', name: '翠玉绿' },
  { color: '#4a6b8a', name: '青花蓝' },
]

interface Props {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label = '底色' }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handlePresetClick = useCallback(
    (color: string) => {
      onChange(color)
      setShowCustom(false)
    },
    [onChange]
  )

  const handleCustomClick = useCallback(() => {
    setShowCustom(true)
    window.setTimeout(() => inputRef.current?.click(), 50)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-tighter text-ink-faint">
          {label}
        </label>
        <CurrentColorPreview color={value} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map(({ color, name }) => (
          <PresetColorButton
            key={color}
            color={color}
            name={name}
            isActive={value === color}
            onClick={handlePresetClick}
          />
        ))}

        <button
          type="button"
          onClick={handleCustomClick}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-rice-deep transition-colors hover:border-cinnabar"
          title="自定义颜色"
          aria-label="自定义颜色"
        >
          <Icon name="add" size={14} className="text-ink-faint" />
        </button>
      </div>

      {showCustom && (
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={event => onChange(event.target.value)}
          className="h-8 w-full cursor-pointer rounded"
          aria-label="自定义底色"
        />
      )}
    </div>
  )
}

function PresetColorButton({
  color,
  name,
  isActive,
  onClick,
}: {
  color: string
  name: string
  isActive: boolean
  onClick: (color: string) => void
}) {
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.backgroundColor = color
    }
  }, [color])

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onClick(color)}
      className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 ${
        isActive
          ? 'scale-110 border-cinnabar ring-2 ring-cinnabar/30'
          : 'border-white shadow-sm'
      }`}
      title={name}
      aria-label={`选择${name}`}
    />
  )
}

function CurrentColorPreview({ color }: { color: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.backgroundColor = color
    }
  }, [color])

  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-light">
      <span ref={ref} className="h-3.5 w-3.5 rounded-full border border-rice-deep" />
      {color}
    </span>
  )
}
