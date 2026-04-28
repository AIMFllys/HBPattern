import Link from 'next/link'
import { Icon } from '@/components/icons'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-rice px-6 text-center">
      <div className="text-9xl font-black text-rice-deep mb-2 font-serif opacity-50">404</div>
      <h2 className="text-2xl font-bold font-serif text-ink mb-4">遗失的档案</h2>
      <p className="text-ink-light max-w-md mb-8">
        您寻找的文化档案似乎不在我们的书架上。它可能已被归档，或者您输入了错误的路径。
      </p>
      <Link href="/" className="flex items-center gap-2 btn-primary">
        <Icon name="arrow_back" size={18} />
        返回首页
      </Link>
    </div>
  )
}
