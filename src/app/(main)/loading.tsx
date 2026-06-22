export default function Loading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-cinnabar border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-secondary">加载中…</p>
      </div>
    </div>
  )
}
