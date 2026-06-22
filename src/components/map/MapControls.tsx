import { Icon } from '@/components/icons/Icon'

export function MapControls({
  zoomIn,
  zoomOut,
  resetView,
}: {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}) {
  return (
    <div className="absolute right-5 top-5 z-10 flex flex-col overflow-hidden border border-border bg-surface-inset shadow-lg">
      <button type="button" onClick={zoomIn} className="p-2 text-text transition hover:bg-gold/15" aria-label="放大地图">
        <Icon name="add" size={20} />
      </button>
      <div className="h-px bg-border" />
      <button type="button" onClick={zoomOut} className="p-2 text-text transition hover:bg-gold/15" aria-label="缩小地图">
        <Icon name="remove" size={20} />
      </button>
      <div className="h-px bg-border" />
      <button type="button" onClick={resetView} className="p-2 text-text transition hover:bg-gold/15" aria-label="重置地图视图">
        <Icon name="my_location" size={20} />
      </button>
    </div>
  )
}
