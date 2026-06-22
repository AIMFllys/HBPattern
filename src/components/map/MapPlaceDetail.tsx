import { Icon } from '@/components/icons/Icon'
import type { HubeiKeyPlace } from '@/types'

export function MapPlaceDetail({ selectedPlace }: { selectedPlace: HubeiKeyPlace | null }) {
  if (!selectedPlace) return null

  return (
    <div className="absolute bottom-5 right-5 hidden w-72 border border-gold/60 bg-surface-elevated/92 p-4 text-text shadow-2xl backdrop-blur lg:block">
      <div className="mb-2 flex items-center gap-2">
        <Icon name="location_on" size={18} className="text-gold" />
        <h3 className="font-serif text-lg font-black">{selectedPlace.name}</h3>
      </div>
      <p className="text-xs leading-5 text-text-muted">{selectedPlace.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {selectedPlace.patternKeywords.map(keyword => (
          <span key={keyword} className="border border-border-subtle px-2 py-0.5 text-[10px] text-text-muted">
            {keyword}
          </span>
        ))}
      </div>
    </div>
  )
}
