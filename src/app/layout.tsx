import type { Metadata } from "next"
import { headers } from "next/headers"
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
  icons: {
    icon: [
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '湖北纹案',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 读取 proxy.ts 注入的 nonce，给 inline script 加 nonce 属性，
  // 使其在生产环境 CSP（script-src 'self' 'nonce-xxx'）下可执行。
  // 缺失时（如直接 SSR 没经过 middleware）退化为无 nonce，dev 模式仍可用。
  let nonce: string | undefined
  try {
    const h = await headers()
    nonce = h.get('x-nonce') ?? undefined
  } catch {
    // headers() 在某些静态生成场景可能不可用，忽略
  }

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: createThemeScript() }}
          nonce={nonce}
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
