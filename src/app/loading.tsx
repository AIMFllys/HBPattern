export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-rice gap-8">
      {/* Animated pattern SVGs */}
      <div className="relative w-32 h-32">
        {/* Phoenix bird pattern - 凤鸟纹 */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pattern-svg pattern-1">
          <path
            d="M50 15 C60 20 75 18 80 30 C85 42 78 55 70 60 C62 65 55 75 50 85 C45 75 38 65 30 60 C22 55 15 42 20 30 C25 18 40 20 50 15 Z M50 30 C55 35 60 33 62 38 C64 43 60 48 55 50 C50 52 48 58 50 62"
            fill="none"
            stroke="var(--color-cinnabar)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="pattern-stroke"
          />
        </svg>
        {/* Cloud pattern - 云纹 */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pattern-svg pattern-2">
          <path
            d="M20 60 C20 45 30 40 40 42 C42 32 52 28 60 35 C65 28 78 30 80 40 C88 42 90 52 85 58 C88 65 82 72 75 70 C72 78 62 80 55 75 C48 80 38 78 35 72 C28 75 18 70 20 60 Z"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="pattern-stroke"
          />
        </svg>
        {/* Geometric hui pattern - 回纹 */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pattern-svg pattern-3">
          <path
            d="M25 25 H75 V75 H25 V35 H65 V65 H35 V45 H55 V55 H45 V50"
            fill="none"
            stroke="var(--color-cinnabar-light)"
            strokeWidth="1.5"
            strokeLinecap="square"
            className="pattern-stroke"
          />
        </svg>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-2">
        <p className="text-ink font-serif text-lg tracking-widest loading-text">正在加载</p>
        <p className="text-ink-faint text-xs tracking-wider">探索千年纹饰之美</p>
      </div>

      <style>{`
        .pattern-svg {
          opacity: 0;
          animation: patternFade 7.5s ease-in-out infinite;
        }
        .pattern-1 { animation-delay: 0s; }
        .pattern-2 { animation-delay: 2.5s; }
        .pattern-3 { animation-delay: 5s; }

        @keyframes patternFade {
          0%, 5% { opacity: 0; }
          10%, 28% { opacity: 1; }
          33%, 100% { opacity: 0; }
        }

        .pattern-stroke {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: draw 2.2s ease-in-out infinite;
        }
        .pattern-1 .pattern-stroke { animation-delay: 0s; }
        .pattern-2 .pattern-stroke { animation-delay: 2.5s; }
        .pattern-3 .pattern-stroke { animation-delay: 5s; }

        @keyframes draw {
          0% { stroke-dashoffset: 400; }
          80% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }

        .loading-text::after {
          content: '';
          animation: dots 1.5s steps(3) infinite;
        }
        @keyframes dots {
          0% { content: ''; }
          33% { content: '·'; }
          66% { content: '··'; }
          100% { content: '···'; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pattern-svg { animation: none; opacity: 1; }
          .pattern-2, .pattern-3 { opacity: 0; }
          .pattern-stroke { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
