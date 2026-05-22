function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 ${color}`} />
      <span>{label}</span>
    </div>
  )
}

export function MapLegend() {
  return (
    <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 border border-rice-deep bg-white/92 px-3 py-2.5 text-[10px] font-bold text-ink-medium shadow-lg backdrop-blur lg:bottom-auto lg:top-36">
      <LegendItem color="bg-cinnabar" label="当前选中区域" />
      <LegendItem color="bg-gold" label="城市中心点" />
      <LegendItem color="bg-ink" label="关键地点" />
      <LegendItem color="bg-success" label="纹样绑定" />
    </div>
  )
}
