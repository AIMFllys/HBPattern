import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 创作中心',
  description: '使用 AI 技术生成纹绣图案，预览 3D 文创产品效果。',
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children
}
