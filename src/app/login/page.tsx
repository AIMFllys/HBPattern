'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/icons/Icon'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const errorParam = searchParams.get('error')

  async function handleOAuth() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const displayError = error || (errorParam ? '认证失败，请重试' : null)

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

        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-ink mb-2">欢迎回来</h1>
            <p className="text-ink-light text-sm">登录以访问您的收藏与创作</p>
          </div>

          {displayError && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm text-center">
              {displayError}
            </div>
          )}

          <div className="space-y-4 mt-10">
            <button
              onClick={handleOAuth}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-rice-deep rounded-lg bg-white text-ink font-bold shadow-sm hover:bg-rice-warm transition-colors focus:ring-2 focus:ring-cinnabar/20 outline-none"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path></svg>
              使用 GitHub 登录
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-rice-deep"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-rice px-4 text-ink-faint">或使用邮箱密码</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-medium uppercase tracking-wider" htmlFor="email">邮箱</label>
                <div className="relative">
                  <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-rice-deep rounded-lg text-sm focus:border-cinnabar focus:ring-1 focus:ring-cinnabar outline-none transition-all placeholder:text-ink-faint/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink-medium uppercase tracking-wider" htmlFor="password">密码</label>
                  <a href="#" className="text-xs text-cinnabar hover:underline font-medium">忘记密码?</a>
                </div>
                <div className="relative">
                  <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-rice-deep rounded-lg text-sm focus:border-cinnabar focus:ring-1 focus:ring-cinnabar outline-none transition-all placeholder:text-ink-faint/50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-cinnabar text-white rounded-lg font-bold shadow-lg shadow-cinnabar/20 hover:bg-cinnabar-deep hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-ink-light pt-8">
            还没有账号? <a href="#" className="text-cinnabar font-bold hover:underline">立即注册</a>
          </p>
        </div>
      </div>
    </div>
  )
}
