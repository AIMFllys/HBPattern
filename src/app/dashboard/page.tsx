import SiteHeader from '@/components/layout/SiteHeader'
import { Icon } from '@/components/icons'
import { mockStats } from '../_mock/stats'

export default function DashboardPage() {
  return (
    <div className="layout-container flex h-full grow flex-col min-h-screen bg-[#f8f8f6]">
      <SiteHeader 
        logoIcon="account_balance" 
        siteName="2026年度管理后台" 
        primaryColor="gold" 
      />
      
      <main className="max-w-[1200px] mx-auto w-full p-6 md:p-10 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-ink text-4xl font-black tracking-tight">2026年度数据概览</h1>
          <p className="text-ink-light text-lg">实时监控学术平台核心指标与增长趋势</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-rice-deep shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-ink-light text-sm font-medium uppercase tracking-wider">总模式数量</p>
              <Icon name="schema" className="text-cinnabar/60" />
            </div>
            <p className="text-ink text-3xl font-bold tabular-nums">{mockStats.totalPatterns.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
              <Icon name="trending_up" size={16} />
              <span>+{mockStats.patternGrowth}%</span>
              <span className="text-ink-faint font-normal ml-1">较上月</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-rice-deep shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-ink-light text-sm font-medium uppercase tracking-wider">累计用户数</p>
              <Icon name="group" className="text-cinnabar/60" />
            </div>
            <p className="text-ink text-3xl font-bold tabular-nums">{mockStats.totalUsers.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
              <Icon name="trending_up" size={16} />
              <span>+{mockStats.userGrowth}%</span>
              <span className="text-ink-faint font-normal ml-1">较上月</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-rice-deep shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-ink-light text-sm font-medium uppercase tracking-wider">AI 调用次数</p>
              <Icon name="smart_toy" className="text-cinnabar/60" />
            </div>
            <p className="text-ink text-3xl font-bold tabular-nums">{mockStats.aiCalls}</p>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
              <Icon name="trending_up" size={16} />
              <span>+{mockStats.aiCallsGrowth}%</span>
              <span className="text-ink-faint font-normal ml-1">较上月</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl p-6 bg-white border border-rice-deep shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-ink text-xl font-bold">2026年内容增长趋势</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-cinnabar/10 text-cinnabar text-xs font-bold rounded">年度数据</span>
              </div>
            </div>
            
            <div className="flex items-baseline gap-4 mb-4">
              <p className="text-ink text-4xl font-bold tabular-nums">{mockStats.totalPatterns.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Icon name="arrow_upward" size={16} />
                <span className="text-sm">+15.8%</span>
              </div>
            </div>
            
            <div className="w-full h-64 relative mt-4">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <defs>
                  <linearGradient id="gradient-red" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#b34d4d" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#b34d4d" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,150 Q100,140 200,100 T400,80 T600,120 T800,40 T1000,20 V200 H0 Z" fill="url(#gradient-red)" />
                <path d="M0,150 Q100,140 200,100 T400,80 T600,120 T800,40 T1000,20" fill="none" stroke="#b34d4d" strokeLinecap="round" strokeWidth="3" />
              </svg>
              <div className="flex justify-between mt-4 text-ink-faint text-xs font-medium">
                <span>1月</span><span>3月</span><span>5月</span><span>7月</span><span>9月</span><span>11月</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl p-6 bg-white border border-rice-deep shadow-sm">
            <h3 className="text-ink text-xl font-bold mb-6">区域模式分布</h3>
            <div className="space-y-4">
              {mockStats.regionalDistribution.map((item) => (
                <div key={item.region} className="relative pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink-medium">{item.region}</span>
                    <span className="text-sm font-bold text-ink">{item.percentage}%</span>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-rice-deep">
                    <div 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-cinnabar" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded bg-[#f8f8f6] p-4 border border-dashed border-rice-deep">
              <div className="flex items-center gap-2 text-ink-light text-xs">
                <Icon name="info" size={16} />
                <span>数据根据2026年IP地理位置聚合而成。</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl overflow-hidden bg-white border border-rice-deep shadow-sm">
          <div className="p-6 border-b border-rice-deep flex justify-between items-center">
            <h3 className="text-ink text-xl font-bold">近期模式更新</h3>
            <button className="text-cinnabar text-sm font-bold hover:underline">查看全部</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f8f8f6] text-ink-light text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">模式名称</th>
                  <th className="px-6 py-4 font-semibold">类别</th>
                  <th className="px-6 py-4 font-semibold">状态</th>
                  <th className="px-6 py-4 font-semibold text-right">更新日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rice-deep">
                {mockStats.recentUpdates.map((update) => (
                  <tr key={update.id} className="hover:bg-[#f8f8f6]/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-ink">{update.name}</td>
                    <td className="px-6 py-4 text-sm text-ink-light">{update.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        update.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {update.status === 'active' ? '活跃' : '处理中'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-light text-right">{update.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      <footer className="mt-auto border-t border-rice-deep p-8 text-center bg-[#f8f8f6]">
        <p className="text-ink-faint text-sm">© 2026 学术管理平台 - 专业 · 严谨 · 智能</p>
      </footer>
    </div>
  )
}
