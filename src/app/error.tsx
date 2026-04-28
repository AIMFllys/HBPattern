'use client'
 
import { useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icons'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-rice px-6 text-center">
      <div className="w-20 h-20 bg-cinnabar/10 text-cinnabar rounded-full flex items-center justify-center mb-6">
        <Icon name="error" size={40} />
      </div>
      <h2 className="text-3xl font-bold font-serif text-ink mb-4">出错了</h2>
      <p className="text-ink-light max-w-md mb-8">
        抱歉，我们在加载您请求的资源时遇到了问题。可能是网络异常或服务器繁忙。
      </p>
      <div className="flex gap-4">
        <button
          className="btn-primary"
          onClick={() => reset()}
        >
          尝试恢复
        </button>
        <Link href="/" className="btn-ghost">
          返回首页
        </Link>
      </div>
    </div>
  )
}
