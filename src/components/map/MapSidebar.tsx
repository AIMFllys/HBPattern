import { Icon } from '@/components/icons/Icon'
import { hubeiRegions } from '@/data/map/hubei'
import type { HubeiRegion, MapPatternOption, PatternAnalysisResult } from '@/types'
import { BindingForm } from './BindingForm'
import { DraftForm } from './DraftForm'
import { PatternThumb } from './PatternThumb'
import type { DemoMode, DisplayBinding, DraftForm as DraftFormState } from './mapDemoTypes'

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-rice-deep bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  )
}

export function MapSidebar({
  selectedRegion,
  totalPlaces,
  bindingCount,
  mode,
  patternQuery,
  filteredPatterns,
  selectedPattern,
  bindingRegionId,
  bindingPlaceId,
  bindingRegion,
  bindingNote,
  draftForm,
  draftRegion,
  imageError,
  storageReady,
  displayBindings,
  draftAnalysis,
  resetView,
  focusRegion,
  setMode,
  setPatternQuery,
  setSelectedPatternId,
  createDraftFromQuery,
  updateBindingRegion,
  setBindingPlaceId,
  setBindingNote,
  addBinding,
  updateDraftRegion,
  updateDraftForm,
  handleDraftImage,
  saveDraftAndBind,
  removeBinding,
}: {
  selectedRegion: HubeiRegion
  totalPlaces: number
  bindingCount: number
  mode: DemoMode
  patternQuery: string
  filteredPatterns: MapPatternOption[]
  selectedPattern: MapPatternOption | null
  bindingRegionId: string
  bindingPlaceId: string
  bindingRegion: HubeiRegion
  bindingNote: string
  draftForm: DraftFormState
  draftRegion: HubeiRegion
  imageError: string
  storageReady: boolean
  displayBindings: DisplayBinding[]
  draftAnalysis: PatternAnalysisResult
  resetView: () => void
  focusRegion: (regionId: string) => void
  setMode: (mode: DemoMode) => void
  setPatternQuery: (query: string) => void
  setSelectedPatternId: (patternId: string) => void
  createDraftFromQuery: () => void
  updateBindingRegion: (regionId: string) => void
  setBindingPlaceId: (placeId: string) => void
  setBindingNote: (note: string) => void
  addBinding: () => void
  updateDraftRegion: (regionId: string) => void
  updateDraftForm: (patch: Partial<DraftFormState>) => void
  handleDraftImage: (file: File | undefined) => void
  saveDraftAndBind: () => void
  removeBinding: (bindingId: string) => void
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-rice-deep bg-rice/95 lg:h-[calc(100vh-73px)] lg:w-[24rem] lg:border-b-0 lg:border-r">
      <div className="space-y-5 overflow-y-auto p-5">
        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">Demo 地理数据</p>
          <h1 className="font-serif text-2xl font-black leading-tight text-ink">湖北纹样地理溯源</h1>
          <p className="mt-2 text-sm leading-6 text-ink-light">
            本地矢量轮廓 + 17 个区域点位。Demo 绑定写入浏览器本地存储，不要求登录。
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <MetricCard label="区域" value={hubeiRegions.length} />
          <MetricCard label="地点" value={totalPlaces} />
          <MetricCard label="绑定" value={bindingCount} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">区域索引</h2>
            <button
              type="button"
              onClick={resetView}
              className="inline-flex items-center gap-1 border border-rice-deep bg-white px-2 py-1 text-xs font-bold text-ink-light transition hover:border-gold hover:text-ink"
            >
              <Icon name="center_focus_strong" size={15} />
              重置
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {hubeiRegions.map(region => {
              const isSelected = selectedRegion.id === region.id
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => focusRegion(region.id)}
                  className={`border px-3 py-2 text-left transition ${
                    isSelected
                      ? 'border-cinnabar bg-cinnabar text-white shadow-sm'
                      : 'border-rice-deep bg-white text-ink-medium hover:border-gold hover:bg-gold/10'
                  }`}
                >
                  <span className="block text-sm font-bold leading-none">{region.shortName}</span>
                  <span className={`mt-1 block text-[10px] ${isSelected ? 'text-white/75' : 'text-ink-faint'}`}>
                    {region.stats.ichProjects} 项非遗线索
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="border border-rice-deep bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cinnabar">纹样写入 Demo</p>
              <h2 className="mt-1 text-base font-black text-ink">绑定画廊纹样到地点</h2>
            </div>
            <span className="shrink-0 bg-gold/15 px-2 py-1 text-[10px] font-bold text-ink">本地草稿</span>
          </div>

          <div className="grid grid-cols-2 border border-rice-deep">
            <button
              type="button"
              onClick={() => setMode('bind')}
              className={`py-2 text-xs font-black ${mode === 'bind' ? 'bg-ink text-rice' : 'bg-rice-warm text-ink-light hover:text-ink'}`}
            >
              绑定已有
            </button>
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`py-2 text-xs font-black ${mode === 'create' ? 'bg-ink text-rice' : 'bg-rice-warm text-ink-light hover:text-ink'}`}
            >
              新建纹样
            </button>
          </div>

          {mode === 'bind' ? (
            <BindingForm
              patternQuery={patternQuery}
              filteredPatterns={filteredPatterns}
              selectedPattern={selectedPattern}
              bindingRegionId={bindingRegionId}
              bindingPlaceId={bindingPlaceId}
              bindingRegion={bindingRegion}
              bindingNote={bindingNote}
              setPatternQuery={setPatternQuery}
              setSelectedPatternId={setSelectedPatternId}
              createDraftFromQuery={createDraftFromQuery}
              updateBindingRegion={updateBindingRegion}
              setBindingPlaceId={setBindingPlaceId}
              setBindingNote={setBindingNote}
              addBinding={addBinding}
            />
          ) : (
            <DraftForm
              draftForm={draftForm}
              draftRegion={draftRegion}
              imageError={imageError}
              draftAnalysis={draftAnalysis}
              updateDraftRegion={updateDraftRegion}
              updateDraftForm={updateDraftForm}
              handleDraftImage={handleDraftImage}
              saveDraftAndBind={saveDraftAndBind}
            />
          )}
        </section>

        <section className="border border-rice-deep bg-rice-warm p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-ink">本地绑定记录</h2>
            <span className="text-[11px] text-ink-faint">{storageReady ? '已启用 localStorage' : '读取中'}</span>
          </div>
          <div className="space-y-2">
            {displayBindings.slice(0, 5).map(({ binding, pattern, region, place }) => (
              <div key={binding.id} className="flex items-start gap-2 border border-rice-deep bg-white p-2">
                <PatternThumb pattern={pattern} small />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-ink">{pattern.name}</p>
                  <p className="mt-0.5 text-[10px] text-ink-light">{region.shortName} · {place.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeBinding(binding.id)}
                  className="text-ink-faint transition hover:text-cinnabar"
                  aria-label="删除本地绑定"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
            {displayBindings.length === 0 && (
              <p className="border border-dashed border-rice-deep bg-white px-3 py-4 text-center text-xs text-ink-faint">
                暂无本地绑定。选择画廊纹样或新建草稿后即可在地图上显示。
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}
