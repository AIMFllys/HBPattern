import React from 'react'

interface IconProps {
  name: string
  size?: number
  className?: string
  color?: string
}

export const Icon = ({ name, size = 24, className = '', color }: IconProps) => {
  return (
    <span 
      className={`material-symbols-outlined ${className}`} 
      style={{ 
        fontSize: size, 
        color,
        fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" 
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

export default Icon