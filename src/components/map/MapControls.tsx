import { Icon } from '@/components/icons/Icon'

export function MapControls({
  zoom,
  updateZoom,
  resetView,
}: {
  zoom: number
  updateZoom: (zoom: number) => void
  resetView: () => void
}) {
  return (
    <div className="absolute right-5 top-5 flex flex-col overflow-hidden border border-rice-deep bg-white shadow-lg">
      <button type="button" onClick={() => updateZoom(zoom + 0.16)} className="p-2 text-ink transition hover:bg-gold/15" aria-label="放大地图">
        <Icon name="add" size={20} />
      </button>
      <div className="h-px bg-rice-deep" />
      <button type="button" onClick={() => updateZoom(zoom - 0.16)} className="p-2 text-ink transition hover:bg-gold/15" aria-label="缩小地图">
        <Icon name="remove" size={20} />
      </button>
      <div className="h-px bg-rice-deep" />
      <button type="button" onClick={resetView} className="p-2 text-ink transition hover:bg-gold/15" aria-label="重置地图视图">
        <Icon name="my_location" size={20} />
      </button>
    </div>
  )
}
