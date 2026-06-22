function LegendItem({ color, label, shape }: { color: string; label: string; shape: 'circle' | 'square' | 'diamond' | 'bar' }) {
  const shapeClass = {
    circle: 'rounded-full',
    square: 'rounded-[2px]',
    diamond: 'rotate-45 rounded-[1px]',
    bar: 'h-1.5 w-3 rounded-full',
  }[shape]

  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 ${shapeClass} ${color}`} />
      <span>{label}</span>
    </div>
  )
}

export function MapLegend() {
  return (
    <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 border border-border bg-surface-overlay px-3 py-2.5 text-[10px] font-bold text-text-secondary shadow-lg backdrop-blur lg:bottom-auto lg:top-36">
      <LegendItem color="bg-cinnabar" shape="circle" label="当前选中区域" />
      <LegendItem color="bg-gold" shape="bar" label="城市中心点" />
      <LegendItem color="bg-ink" shape="square" label="关键地点" />
      <LegendItem color="bg-success" shape="diamond" label="纹样绑定" />
    </div>
  )
}
