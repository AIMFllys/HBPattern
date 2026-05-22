import { Icon } from '@/components/icons/Icon'
import { hubeiRegions } from '@/data/map/hubei'
import type { HubeiRegion, MapPatternOption } from '@/types'
import { PatternThumb } from './PatternThumb'
import { SelectField } from './MapFormControls'

export function BindingForm({
  patternQuery,
  filteredPatterns,
  selectedPattern,
  bindingRegionId,
  bindingPlaceId,
  bindingRegion,
  bindingNote,
  setPatternQuery,
  setSelectedPatternId,
  createDraftFromQuery,
  updateBindingRegion,
  setBindingPlaceId,
  setBindingNote,
  addBinding,
}: {
  patternQuery: string
  filteredPatterns: MapPatternOption[]
  selectedPattern: MapPatternOption | null
  bindingRegionId: string
  bindingPlaceId: string
  bindingRegion: HubeiRegion
  bindingNote: string
  setPatternQuery: (query: string) => void
  setSelectedPatternId: (patternId: string) => void
  createDraftFromQuery: () => void
  updateBindingRegion: (regionId: string) => void
  setBindingPlaceId: (placeId: string) => void
  setBindingNote: (note: string) => void
  addBinding: () => void
}) {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor="map-pattern-search" className="mb-1 block text-[11px] font-bold text-ink-light">搜索画廊纹样</label>
        <input
          id="map-pattern-search"
          value={patternQuery}
          onChange={(event) => setPatternQuery(event.target.value)}
          className="w-full border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
          placeholder="输入纹样名、地区、工艺..."
        />
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {filteredPatterns.map(pattern => {
          const isSelected = selectedPattern?.id === pattern.id && selectedPattern.source === pattern.source
          return (
            <button
              key={`${pattern.source}-${pattern.id}`}
              type="button"
              onClick={() => setSelectedPatternId(pattern.id)}
              className={`flex w-full items-center gap-3 border p-2 text-left transition ${
                isSelected ? 'border-cinnabar bg-cinnabar/8' : 'border-rice-deep bg-rice-warm hover:border-gold'
              }`}
            >
              <PatternThumb pattern={pattern} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-ink">{pattern.name}</span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-light">
                  {pattern.regionName ?? '未标注地区'} · {pattern.techniqueName ?? '未标注工艺'}
                </span>
              </span>
              <span className="text-[10px] font-bold uppercase text-ink-faint">{pattern.source === 'demo' ? 'Demo' : 'Gallery'}</span>
            </button>
          )
        })}
        {filteredPatterns.length === 0 && (
          <div className="border border-dashed border-rice-deep bg-rice px-3 py-4 text-center">
            <p className="text-sm font-bold text-ink">没有匹配的纹样</p>
            <button
              type="button"
              onClick={createDraftFromQuery}
              className="mt-2 inline-flex items-center gap-1 bg-cinnabar px-3 py-1.5 text-xs font-bold text-white"
            >
              <Icon name="add" size={15} />
              新建“{patternQuery || '未命名纹样'}”
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SelectField label="绑定地区" value={bindingRegionId} onChange={updateBindingRegion}>
          {hubeiRegions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
        </SelectField>
        <SelectField label="关键地点" value={bindingPlaceId} onChange={setBindingPlaceId}>
          {bindingRegion.keyPlaces.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}
        </SelectField>
      </div>

      <div>
        <label htmlFor="map-binding-note" className="mb-1 block text-[11px] font-bold text-ink-light">绑定备注</label>
        <textarea
          id="map-binding-note"
          value={bindingNote}
          onChange={(event) => setBindingNote(event.target.value)}
          rows={2}
          maxLength={160}
          className="w-full resize-none border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
          placeholder="如：来自汉绣传习点的凤鸟纹样线索"
        />
      </div>

      <button
        type="button"
        onClick={addBinding}
        disabled={!selectedPattern}
        className="flex w-full items-center justify-center gap-2 bg-cinnabar px-4 py-2.5 text-sm font-black text-white transition hover:bg-cinnabar-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon name="add_location_alt" size={18} />
        写入 Demo 地图绑定
      </button>
    </div>
  )
}
