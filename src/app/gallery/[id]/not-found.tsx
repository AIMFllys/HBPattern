import Link from 'next/link'
import { Icon } from '@/components/icons'

export default function PatternNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#f8f8f6] px-6 text-center">
      <div className="w-24 h-32 border-2 border-dashed border-gold/30 flex items-center justify-center mb-6">
        <Icon name="texture" size={40} className="text-gold/40" />
      </div>
      <h2 className="text-2xl font-bold font-serif text-ink mb-2">该纹样档案未找到</h2>
      <p className="text-ink-light max-w-sm mb-8">
        此纹样档案可能尚未收录，或已被管理员移至内部资料库。
      </p>
      <div className="flex gap-4">
        <Link href="/gallery" className="flex items-center gap-2 border border-gold text-gold font-bold px-6 py-2 rounded-lg hover:bg-gold/10 transition-colors">
          <Icon name="grid_view" size={18} />
          浏览其他纹样
        </Link>
        <Link href="/" className="px-6 py-2 text-ink-medium hover:text-ink font-bold transition-colors">
          返回首页
        </Link>
      </div>
    </div>
  )
}
