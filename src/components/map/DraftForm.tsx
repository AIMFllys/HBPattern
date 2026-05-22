import { Icon } from '@/components/icons/Icon'
import { hubeiRegions } from '@/data/map/hubei'
import type { HubeiRegion, PatternAnalysisResult } from '@/types'
import { AnalysisPanel } from './AnalysisPanel'
import { Field, SelectField } from './MapFormControls'
import type { DraftForm as DraftFormState } from './mapDemoTypes'

export function DraftForm({
  draftForm,
  draftRegion,
  imageError,
  draftAnalysis,
  updateDraftRegion,
  updateDraftForm,
  handleDraftImage,
  saveDraftAndBind,
}: {
  draftForm: DraftFormState
  draftRegion: HubeiRegion
  imageError: string
  draftAnalysis: PatternAnalysisResult
  updateDraftRegion: (regionId: string) => void
  updateDraftForm: (patch: Partial<DraftFormState>) => void
  handleDraftImage: (file: File | undefined) => void
  saveDraftAndBind: () => void
}) {
  return (
    <div className="mt-4 space-y-4">
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-rice-deep bg-rice text-center transition hover:border-cinnabar">
        {draftForm.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draftForm.imageDataUrl} alt="Demo 纹样预览" className="h-32 w-full object-cover" />
        ) : (
          <>
            <Icon name="upload_file" size={34} className="text-ink-faint" />
            <span className="mt-2 text-xs font-bold text-ink-light">上传本地 Demo 图片</span>
            <span className="text-[10px] text-ink-faint">自动压缩预览并提取主色</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleDraftImage(event.target.files?.[0])}
        />
      </label>
      {imageError && <p className="text-xs font-bold text-cinnabar">{imageError}</p>}

      <Field label="名称">
        <input
          value={draftForm.name}
          onChange={(event) => updateDraftForm({ name: event.target.value })}
          maxLength={80}
          className="w-full border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
          placeholder="如：汉绣凤穿牡丹"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="年代">
          <input
            value={draftForm.era}
            onChange={(event) => updateDraftForm({ era: event.target.value })}
            maxLength={40}
            className="w-full border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
            placeholder="清代"
          />
        </Field>
        <Field label="工艺">
          <input
            value={draftForm.technique}
            onChange={(event) => updateDraftForm({ technique: event.target.value })}
            maxLength={40}
            className="w-full border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
            placeholder="刺绣"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="地区" value={draftForm.regionId} onChange={updateDraftRegion}>
          {hubeiRegions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
        </SelectField>
        <SelectField label="地点" value={draftForm.placeId} onChange={(placeId) => updateDraftForm({ placeId })}>
          {draftRegion.keyPlaces.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}
        </SelectField>
      </div>
      <Field label="说明">
        <textarea
          value={draftForm.description}
          onChange={(event) => updateDraftForm({ description: event.target.value })}
          rows={3}
          maxLength={500}
          className="w-full resize-none border border-rice-deep bg-rice px-3 py-2 text-sm outline-none transition focus:border-cinnabar"
          placeholder="纹样的来源、寓意、采样地点或工艺特征..."
        />
      </Field>

      <AnalysisPanel analysis={draftAnalysis} />

      <button
        type="button"
        onClick={saveDraftAndBind}
        disabled={!draftForm.name.trim()}
        className="flex w-full items-center justify-center gap-2 bg-ink px-4 py-2.5 text-sm font-black text-rice transition hover:bg-cinnabar disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon name="save" size={18} />
        保存草稿并绑定地点
      </button>
    </div>
  )
}
