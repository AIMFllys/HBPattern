export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-rice gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-rice-deep rounded-full"></div>
        <div className="absolute inset-0 border-4 border-cinnabar rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-ink-medium font-serif tracking-widest text-sm animate-pulse">正在加载资源...</p>
    </div>
  )
}
