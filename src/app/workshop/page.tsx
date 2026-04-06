'use client'

import { useState } from 'react'
import SiteHeader from '@/components/layout/SiteHeader'

const categories = ['楚式纹样', '敦煌艺术', '故宫典藏', '现代简约']

const patternLibrary = [
  { id: 1, name: '凤鸟云纹', selected: true },
  { id: 2, name: '九色鹿图腾', selected: false },
  { id: 3, name: '青花折枝纹', selected: false },
  { id: 4, name: '锦绣繁花', selected: false },
  { id: 5, name: '涟漪写意', selected: false },
  { id: 6, name: '龙腾祥瑞', selected: false },
]

export default function WorkshopPage() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [density, setDensity] = useState(75)
  const [metallic, setMetallic] = useState(42)
  const [silk, setSilk] = useState(90)

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#fbfbf8]">
      <header className="flex items-center justify-between border-b border-rice-deep/50 bg-white/80 backdrop-blur-md px-8 py-3 z-50">
        <div className="flex items-center gap-4">
          <div className="size-8 bg-gold flex items-center justify-center rounded-lg text-white">
            <span className="material-symbols-outlined">grid_view</span>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-ink">纹样+ 跨界创作工坊</h1>
            <p className="text-[10px] uppercase tracking-widest text-gold/80 font-bold">Crossover Creation Workshop</p>
          </div>
        </div>
        <nav className="flex items-center gap-10">
          <a className="text-gold text-sm font-bold border-b-2 border-gold pb-1" href="#">首页</a>
          <a className="text-ink-medium hover:text-gold text-sm font-medium transition-colors" href="#">工作台</a>
          <a className="text-ink-medium hover:text-gold text-sm font-medium transition-colors" href="#">灵感库</a>
          <a className="text-ink-medium hover:text-gold text-sm font-medium transition-colors" href="#">社区</a>
        </nav>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-rice-warm/30 rounded-full transition-colors">
            <span className="material-symbols-outlined text-ink-medium">settings</span>
          </button>
          <button className="p-2 hover:bg-rice-warm/30 rounded-full transition-colors">
            <span className="material-symbols-outlined text-ink-medium">share</span>
          </button>
          <div className="h-8 w-[1px] bg-rice-deep mx-2"></div>
          <div className="flex items-center gap-3 bg-rice-warm/20 px-3 py-1.5 rounded-full border border-rice-deep/40">
            <span className="text-xs font-bold text-ink-medium">设计者: 暖暖</span>
            <div className="size-8 rounded-full bg-gold/20 border border-white flex items-center justify-center">
              <span className="material-symbols-outlined text-gold text-sm">person</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative flex flex-col items-center justify-center p-12 bg-[#f4f1ea]">
          <div className="absolute top-6 left-8 flex items-center gap-2 text-sm">
            <span className="text-gold/60">跨界工坊</span>
            <span className="material-symbols-outlined text-xs text-ink-faint">chevron_right</span>
            <span className="text-ink-faint">高端定制</span>
            <span className="material-symbols-outlined text-xs text-ink-faint">chevron_right</span>
            <span className="text-ink font-bold">主题: 楚风凤鸟纹</span>
          </div>
          
          <div className="relative w-full max-w-2xl aspect-[4/3] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-radial from-white/60 to-transparent rounded-full blur-3xl opacity-50"></div>
            <div className="relative z-10 w-full h-full bg-contain bg-center bg-no-repeat drop-shadow-2xl transform hover:scale-105 transition-transform duration-700" style={{ backgroundColor: '#8B4513' }}></div>
            
            <div className="absolute top-1/4 right-0 glass-panel p-3 rounded-lg border-l-4 border-cinnabar shadow-sm max-w-[180px]">
              <p className="text-[10px] text-cinnabar font-bold uppercase tracking-wider">当前应用纹样</p>
              <p className="text-sm font-bold text-ink">楚风凤鸟纹 - 金漆版</p>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl glass-panel rounded-xl p-6 shadow-2xl border-t border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cinnabar">tune</span>
                <h3 className="font-bold text-ink">专业调色面板</h3>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 bg-cinnabar text-white text-xs font-bold rounded-lg shadow-lg hover:bg-cinnabar/90 transition-all">应用更改</button>
                <button className="px-4 py-1.5 bg-slate-200 text-ink-medium text-xs font-bold rounded-lg hover:bg-slate-300 transition-all">重置</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-ink-medium">
                  <span>纹样密度</span>
                  <span className="text-gold">{density}%</span>
                </div>
                <input 
                  className="w-full h-1.5 bg-rice-deep rounded-lg appearance-none cursor-pointer accent-cinnabar" 
                  type="range"
                  min="0"
                  max="100"
                  value={density}
                  onChange={(e) => setDensity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-ink-medium">
                  <span>金属感</span>
                  <span className="text-gold">{metallic}%</span>
                </div>
                <input 
                  className="w-full h-1.5 bg-rice-deep rounded-lg appearance-none cursor-pointer accent-cinnabar" 
                  type="range"
                  min="0"
                  max="100"
                  value={metallic}
                  onChange={(e) => setMetallic(Number(e.target.value))}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-ink-medium">
                  <span>丝绸光泽</span>
                  <span className="text-gold">{silk}%</span>
                </div>
                <input 
                  className="w-full h-1.5 bg-rice-deep rounded-lg appearance-none cursor-pointer accent-cinnabar" 
                  type="range"
                  min="0"
                  max="100"
                  value={silk}
                  onChange={(e) => setSilk(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
        
        <aside className="w-96 bg-white border-l border-rice-deep/50 flex flex-col">
          <div className="p-6 border-b border-rice-deep/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="material-symbols-outlined text-gold">auto_awesome</span>
                纹样资产库
              </h2>
              <span className="text-[10px] font-bold bg-gold/10 text-gold px-2 py-0.5 rounded">NEW</span>
            </div>
            
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">search</span>
              <input className="w-full pl-9 pr-4 py-2 bg-rice border-none rounded-lg text-sm focus:ring-1 focus:ring-gold/50" placeholder="搜索纹样..." type="text"/>
            </div>
            
            <div className="flex gap-2 overflow-x-auto custom-scrollbar">
              {categories.map((cat, index) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(index)}
                  className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
                    activeCategory === index
                      ? 'bg-gold text-white shadow-sm'
                      : 'bg-rice text-ink-medium hover:bg-rice-warm/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              {patternLibrary.map((pattern) => (
                <div key={pattern.id} className="group cursor-pointer">
                  <div className={`aspect-square rounded-xl overflow-hidden border-2 p-1 transition-all group-hover:shadow-lg ${
                    pattern.selected ? 'border-gold bg-gold/5' : 'border-transparent hover:border-rice-deep bg-rice-warm'
                  }`}>
                    <div className={`w-full h-full rounded-lg ${pattern.selected ? 'bg-gold' : 'bg-rice-warm'}`} />
                  </div>
                  <p className={`mt-2 text-xs font-bold text-center ${
                    pattern.selected ? 'text-gold' : 'text-ink-light group-hover:text-ink-medium'
                  }`}>
                    {pattern.name} {pattern.selected && '(选中)'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-rice-warm/50 border-t border-rice-deep/30">
            <button className="w-full py-3 bg-ink text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-ink-medium transition-all shadow-xl">
              <span className="material-symbols-outlined text-sm">download</span>
              导出高清设计稿
            </button>
            <p className="text-[10px] text-center mt-3 text-ink-faint font-medium">支持 PNG, SVG, 3D OBJ 格式</p>
          </div>
        </aside>
      </main>
    </div>
  )
}
