'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icons/Icon'
import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen w-full flex bg-rice">
      {/* Left side: Image / Brand */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 bg-ink overflow-hidden">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAsNXdBQSzIk8lxkjO_09UAZEGl79AJKULYueXNcqoCPTfBYGPNoLJzHJ_sX4UnAEAbexD1L_TM-cqEgtIkYVe2OkZq0LiMrPFnr66BPMNBnxGt0DYyYaH0W-9iOI5P2YKWzGYc2N75wvmaMkUYQR7jq2-NQ0n9nMuy7jW9OmvvVpVAst36tFCNLlDdNv7w2rcySF9exdhQylitge3g7k_xMdsYt8MnQquNOpDAiPBwpsicZoJJaGIqIydCEZ32LumBEgl_DjiJfg")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/50"></div>

        <Link href="/" className="relative z-10 flex items-center gap-3 text-white group w-fit">
          <div className="text-cinnabar group-hover:scale-110 transition-transform">
            <Icon name="filter_vintage" size={32} />
          </div>
          <span className="text-xl font-bold tracking-widest font-serif">湖北传统纹样库</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="seal-tag writing-vertical text-xs font-bold px-1 border-cinnabar/60 text-cinnabar mb-6">楚风遗韵</div>
          <h2 className="text-4xl font-serif font-bold text-white mb-4 leading-tight">
            传承千年<br />
            遇见数字新生
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            加入我们，探索荆楚大地的非物质文化遗产。解锁高清纹样图谱，使用 AI 工具进行跨界创作。
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 relative">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2 text-ink">
            <Icon name="filter_vintage" className="text-cinnabar" />
            <span className="font-bold font-serif">湖北传统纹样库</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <AuthForm
            redirectAfterOAuth="/"
            onLoginSuccess={() => { router.push('/'); router.refresh() }}
          />
        </div>
      </div>
    </div>
  )
}
