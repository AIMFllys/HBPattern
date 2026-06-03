import type { HubeiKeyPlace, HubeiRegion } from '@/types'
import type { DisplayBinding } from './mapDemoTypes'

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] text-ink-faint">{label}</p>
      <p className="text-lg font-black text-ink">{value}</p>
    </div>
  )
}

function getRegionTypeLabel(region: HubeiRegion) {
  if (region.type === 'autonomous_prefecture') return '自治州'
  if (region.type === 'forest_district') return '林区'
  if (region.type === 'sub_prefecture') return '省直管'
  return '地级市'
}

export function MapInfoPanel({
  selectedRegion,
  selectedPlace,
  displayBindings,
  selectPlace,
}: {
  selectedRegion: HubeiRegion
  selectedPlace: HubeiKeyPlace | null
  displayBindings: DisplayBinding[]
  selectPlace: (regionId: string, placeId: string) => void
}) {
  return (
    <div className="absolute bottom-5 left-3 w-[min(22rem,calc(100%-4rem))] border border-rice-deep bg-white/92 p-3 shadow-2xl backdrop-blur sm:left-5 sm:w-[min(26rem,calc(100%-2.5rem))] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cinnabar">地区洞察</p>
          <h2 className="mt-1 font-serif text-2xl font-black leading-tight text-ink">
            {selectedRegion.name}
            <span className="ml-2 text-sm font-semibold text-ink-light">{selectedRegion.namePinyin}</span>
          </h2>
        </div>
        <span className="border border-rice-deep px-2 py-1 text-[10px] font-bold text-ink-light">
          {getRegionTypeLabel(selectedRegion)}
        </span>
      </div>

      <p className="mt-3 hidden text-sm leading-6 text-ink-medium sm:block">{selectedRegion.culturalIntro}</p>
      <p className="mt-2 text-xs leading-5 text-ink-medium sm:hidden">{selectedRegion.culturalIntro.slice(0, 60)}…</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {selectedRegion.patternKeywords.map(keyword => (
          <span key={keyword} className="bg-rice-warm px-2.5 py-1 text-[11px] font-bold text-ink-medium">
            {keyword}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 border-y border-rice-deep py-3">
        <MiniStat label="Demo 纹样" value={selectedRegion.stats.demoPatternCount} />
        <MiniStat label="非遗线索" value={selectedRegion.stats.ichProjects} />
        <MiniStat label="关键地点" value={selectedRegion.keyPlaces.length} />
        <MiniStat label="已绑定" value={displayBindings.filter(item => item.region.id === selectedRegion.id).length} />
      </div>

      <div className="mt-4 hidden space-y-2 sm:block">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-ink-faint">关键地点</h3>
          <span className="text-[11px] text-ink-faint">放大至 145% 可见地图标签</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {selectedRegion.keyPlaces.map(place => {
            const isSelected = selectedPlace?.id === place.id
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => selectPlace(selectedRegion.id, place.id)}
                className={`min-h-20 border p-2 text-left transition ${
                  isSelected
                    ? 'border-cinnabar bg-cinnabar text-white'
                    : 'border-rice-deep bg-rice-warm text-ink-medium hover:border-gold hover:bg-gold/10'
                }`}
              >
                <span className="block text-xs font-black">{place.name}</span>
                <span className={`mt-1 block text-[10px] leading-4 ${isSelected ? 'text-white/80' : 'text-ink-faint'}`}>
                  {place.summary}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
