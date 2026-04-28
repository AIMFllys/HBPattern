import React from 'react'

interface ParameterSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
  primaryColor?: 'cinnabar' | 'gold'
  className?: string
}

export default function ParameterSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = '%',
  primaryColor = 'cinnabar',
  className = ''
}: ParameterSliderProps) {
  const colorClass = primaryColor === 'cinnabar' ? 'text-cinnabar' : 'text-gold'
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between">
        <label className="text-xs font-bold text-ink-faint uppercase tracking-tighter">{label}</label>
        <span className={`text-xs font-medium ${colorClass}`}>{value}{unit}</span>
      </div>
      <input 
        className="w-full h-1 bg-rice-deep rounded-lg appearance-none cursor-pointer accent-cinnabar" 
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
