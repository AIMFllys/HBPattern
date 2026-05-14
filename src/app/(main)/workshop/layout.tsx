import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '跨界工坊',
  description: '参数化调节纹样密度、金属感与光泽，实现高端定制设计。',
}

export default function WorkshopLayout({ children }: { children: React.ReactNode }) {
  return children
}
