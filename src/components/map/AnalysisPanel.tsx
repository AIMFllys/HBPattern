import type { PatternAnalysisResult } from '@/types'

export function AnalysisPanel({ analysis }: { analysis: PatternAnalysisResult }) {
  return (
    <div className="border border-gold/50 bg-gold/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-black text-text">基础分析</span>
        <span className="text-xs font-black text-cinnabar">{analysis.completenessScore}%</span>
      </div>
      <div className="h-1.5 bg-surface-inset">
        <div className="h-full bg-cinnabar" style={{ width: `${analysis.completenessScore}%` }} />
      </div>
      <p className="mt-2 text-[11px] leading-5 text-text-secondary">{analysis.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {analysis.dominantColors.map(color => (
          <span key={color} className="size-5 border border-surface-inset shadow-sm" style={{ backgroundColor: color }} title={color} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {analysis.recommendedTags.map(tag => (
          <span key={tag} className="bg-surface-inset px-2 py-0.5 text-[10px] font-bold text-text-secondary">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
