export function MapText({
  x,
  y,
  size,
  weight,
  className,
  children,
}: {
  x: number
  y: number
  size: number
  weight: number
  className: string
  children: string
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      paintOrder="stroke"
      stroke="#fffaf0"
      strokeWidth={size * 0.2}
      className={`select-none font-serif ${className}`}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </text>
  )
}
