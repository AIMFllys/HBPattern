export default function GalleryLoading() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-surface">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface-overlay backdrop-blur-md px-6 lg:px-10 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            <div className="w-40 h-6 bg-border rounded animate-pulse" />
            <div className="hidden lg:flex gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-16 h-4 bg-border rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-64 h-8 bg-border rounded-lg animate-pulse hidden lg:block" />
            <div className="w-10 h-10 bg-border rounded-full animate-pulse" />
          </div>
        </div>
      </header>

      {/* Filter bar skeleton */}
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="w-32 h-8 bg-border rounded animate-pulse" />
          <div className="flex gap-3">
            <div className="w-24 h-8 bg-border rounded-full animate-pulse" />
            <div className="w-24 h-8 bg-border rounded-full animate-pulse" />
            <div className="w-24 h-8 bg-border rounded-full animate-pulse" />
          </div>
        </div>

        {/* Masonry grid skeleton */}
        <div className="masonry-grid">
          {Array.from({ length: 9 }).map((_, i) => {
            const heights = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-[3/4]']
            return (
              <div key={i} className="masonry-item">
                <div className="card overflow-hidden">
                  <div className={`${heights[i]} bg-border animate-pulse`} />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-border rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-border rounded w-1/2 animate-pulse" />
                    <div className="flex gap-2 mt-2">
                      <div className="w-12 h-5 bg-border rounded-full animate-pulse" />
                      <div className="w-16 h-5 bg-border rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
