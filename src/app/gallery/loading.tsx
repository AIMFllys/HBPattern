export default function GalleryLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-rice gap-6">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M50 15 C60 20 75 18 80 30 C85 42 78 55 70 60 C62 65 55 75 50 85 C45 75 38 65 30 60 C22 55 15 42 20 30 C25 18 40 20 50 15 Z"
            fill="none"
            stroke="var(--color-cinnabar)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: 'drawGallery 2s ease-in-out infinite' }}
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-ink font-serif tracking-widest">即将进入 · 纹样画廊</p>
        <p className="text-ink-faint text-xs mt-1">浏览千年纹饰精品</p>
      </div>
      <style>{`
        @keyframes drawGallery {
          0% { stroke-dashoffset: 300; }
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
