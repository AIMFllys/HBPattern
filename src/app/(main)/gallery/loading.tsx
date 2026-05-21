export default function GalleryLoading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-rice-deep overflow-hidden">
      <div className="h-full bg-cinnabar" style={{ width: '0%', animation: 'galleryProgress 1.5s ease-in-out infinite' }} />
      <style>{`
        @keyframes galleryProgress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
