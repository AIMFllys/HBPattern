import React from 'react'

interface LogoProps {
  size?: number
  className?: string
}

export const Logo = ({ size = 24, className = '' }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="湖北传统纹样库"
      className={className}
    >
      <rect width="48" height="48" rx="12" fill="#b84a39" />
      <g stroke="#f5f0e8" strokeWidth="3" strokeLinecap="round" fill="none">
        <circle cx="24" cy="24" r="13" />
        <circle cx="24" cy="24" r="8" />
        <path d="M24 11 L24 37" strokeWidth="2.5" />
        <path d="M11 24 L37 24" strokeWidth="2.5" />
        <path d="M14.8 14.8 L33.2 33.2" strokeWidth="2.5" />
        <path d="M33.2 14.8 L14.8 33.2" strokeWidth="2.5" />
      </g>
      <circle cx="24" cy="24" r="4" fill="#f5f0e8" />
    </svg>
  )
}

export default Logo
