import type { Metadata } from "next"
import "./globals.css"
import AuthProvider from '@/components/providers/AuthProvider'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:6427'
  ),
  title: {
    default: "湖北纹案文化展示平台",
    template: "%s | 湖北纹案",
  },
  description: "探索湖北传统纹绣文化，收录千年织法，聚合非遗传承——湖北纹案文化展示与创作平台",
  keywords: ["湖北纹案", "非遗", "传统纹绣", "AI创作", "文化数字化"],
  authors: [{ name: "AIMFllys" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "湖北纹案文化展示平台",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
