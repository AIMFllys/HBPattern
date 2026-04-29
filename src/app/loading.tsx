export default function Loading() {
  return (
    <>
      {/* Top progress bar - subtle, non-intrusive */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-rice-deep overflow-hidden">
        <div className="h-full bg-cinnabar loading-bar" />
      </div>
      <style>{`
        .loading-bar {
          width: 0%;
          animation: progress 1.5s ease-in-out infinite;
        }
        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-bar { animation: none; width: 100%; opacity: 0.3; }
        }
      `}</style>
    </>
  )
}
