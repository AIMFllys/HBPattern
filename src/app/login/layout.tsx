import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登录',
  description: '登录湖北纹案文化展示平台，访问收藏与创作功能。',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
