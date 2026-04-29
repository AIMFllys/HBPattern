export default function DetailLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#f8f8f6] gap-6">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M25 25 H75 V75 H25 V35 H65 V65 H35 V45 H55 V55 H45 V50"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="1.5"
            strokeLinecap="square"
            style={{ strokeDasharray: 350, strokeDashoffset: 350, animation: 'drawDetail 2s ease-in-out infinite' }}
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-ink font-serif tracking-widest">即将进入 · 纹样详情</p>
        <p className="text-ink-faint text-xs mt-1">解读纹饰背后的故事</p>
      </div>
      <style>{`
        @keyframes drawDetail {
          0% { stroke-dashoffset: 350; }
          70% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          svg path { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </div>
  )
}
