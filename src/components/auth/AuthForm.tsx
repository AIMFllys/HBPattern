'use client'

import { Icon } from '@/components/icons/Icon'
import { useAuthForm } from '@/hooks/useAuthForm'

interface AuthFormProps {
  redirectAfterOAuth?: string
  onLoginSuccess?: () => void
  /** 显示在表单顶部的提示信息 */
  message?: string
}

export default function AuthForm({ redirectAfterOAuth, onLoginSuccess, message }: AuthFormProps) {
  const {
    email, setEmail,
    password, setPassword,
    error, setError,
    loading,
    isRegister, setIsRegister,
    emailSent, setEmailSent,
    handleOAuth,
    handleSubmit,
  } = useAuthForm({ redirectAfterOAuth, onLoginSuccess })

  if (emailSent) {
    return (
      <div className="text-center space-y-5 py-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-success/10 flex items-center justify-center">
          <Icon name="mail" size={28} className="text-success" />
        </div>
        <h2 className="text-xl font-bold text-ink">验证邮件已发送</h2>
        <p className="text-ink-light text-sm">
          我们已向 <span className="font-bold text-ink">{email}</span> 发送了一封验证邮件。
          <br />请查收并点击链接完成注册。
        </p>
        <p className="text-xs text-ink-faint">没有收到？请检查垃圾邮件文件夹</p>
        <button
          onClick={() => { setEmailSent(false); setIsRegister(false) }}
          className="text-cinnabar font-bold text-sm hover:underline"
        >
          返回登录
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-ink mb-1">
          {isRegister ? '创建账号' : '欢迎回来'}
        </h2>
        <p className="text-ink-light text-sm">
          {message || (isRegister ? '注册以开始探索与创作' : '登录以访问您的收藏与创作')}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleOAuth}
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-rice-deep rounded-lg bg-white text-ink font-bold shadow-sm hover:bg-rice-warm transition-colors focus:ring-2 focus:ring-cinnabar/20 outline-none"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
          使用 GitHub 登录
        </button>

        <div className="relative py-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-rice-deep" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-rice px-4 text-ink-faint">或使用邮箱密码</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-medium uppercase tracking-wider" htmlFor="auth-email">邮箱</label>
            <div className="relative">
              <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
              <input
                id="auth-email"
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
              <label className="text-xs font-bold text-ink-medium uppercase tracking-wider" htmlFor="auth-password">密码</label>
              {!isRegister && (
                <a href="#" className="text-xs text-cinnabar hover:underline font-medium">忘记密码?</a>
              )}
            </div>
            <div className="relative">
              <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
              <input
                id="auth-password"
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
            {loading ? (isRegister ? '注册中...' : '登录中...') : (isRegister ? '注册' : '登录')}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-ink-light">
        {isRegister ? (
          <>已有账号? <button onClick={() => { setIsRegister(false); setError(null) }} className="text-cinnabar font-bold hover:underline">返回登录</button></>
        ) : (
          <>还没有账号? <button onClick={() => { setIsRegister(true); setError(null) }} className="text-cinnabar font-bold hover:underline">立即注册</button></>
        )}
      </p>
    </div>
  )
}
