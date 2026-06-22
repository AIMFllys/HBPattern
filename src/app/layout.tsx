import type { Metadata } from "next"
import "./globals.css"
import AuthProvider from '@/components/providers/AuthProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import AuthModal from '@/components/auth/AuthModal'
import { ServiceWorkerRegistration } from '@/components/providers/ServiceWorkerRegistration'
import ThemeProvider from '@/components/providers/ThemeProvider'
import { createThemeScript } from '@/lib/theme'

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '湖北纹案',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: createThemeScript() }}
          suppressHydrationWarning
        />
      </head>
      <body>
        <ThemeProvider>
          <ServiceWorkerRegistration />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[400] btn-primary"
        >
          跳到主内容
        </a>
        <QueryProvider>
          <AuthProvider>
            <AuthModal />
            {children}
          </AuthProvider>
        </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
