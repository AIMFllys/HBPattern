'use client'

import { useState } from 'react'
import SiteHeader from '@/components/layout/SiteHeader'

const categories = ['陶瓷', '丝绸', '漆器', '壁画']

const patternLibrary = [
  { id: 1, name: '缠枝莲纹', selected: true },
  { id: 2, name: '祥云瑞气', selected: false },
  { id: 3, name: '龙纹云锦', selected: false },
  { id: 4, name: '花鸟图卷', selected: false },
  { id: 5, name: '万字回纹', selected: false },
  { id: 6, name: '水墨江山', selected: false },
]

export default function CreatePage() {
  const [activeTab, setActiveTab] = useState(0)
  const [scale, setScale] = useState(65)
  const [rotation, setRotation] = useState(45)
  const [opacity, setOpacity] = useState(80)

  return (
    <div className="min-h-screen flex flex-col bg-rice">
      <SiteHeader logoIcon="storm" siteName="AI 创意中心" primaryColor="cinnabar" activeNav={0} />
      
      <main className="flex flex-1 overflow-hidden">
        <aside className="w-16 border-r border-rice-deep flex flex-col items-center py-6 gap-6 bg-rice">
          <button className="w-10 h-10 flex items-center justify-center rounded bg-cinnabar text-white shadow-sm">
            <span className="material-symbols-outlined">deployed_code</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-rice-warm text-ink-medium">
            <span className="material-symbols-outlined">brush</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-rice-warm text-ink-medium">
            <span className="material-symbols-outlined">layers</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-rice-warm text-ink-medium">
            <span className="material-symbols-outlined">photo_camera</span>
          </button>
        </aside>
        
        <section className="flex-1 flex flex-col relative bg-[#efede8]">
          <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinnabar via-transparent to-transparent"></div>
            
            <div className="relative w-80 h-[450px] group">
              <div className="absolute inset-0 bg-white rounded-t-[100px] rounded-b-[40px] shadow-2xl border border-slate-200 overflow-hidden">
                <div className="absolute inset-0 opacity-60 mix-blend-multiply bg-repeat" style={{ backgroundColor: '#c9a84c' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/30"></div>
                <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </div>
              <div className="absolute -right-12 top-24 w-20 h-32 border-[16px] border-white rounded-full shadow-lg -z-10"></div>
            </div>
            
            <div className="absolute top-6 left-6 bg-white/60 backdrop-blur px-4 py-2 rounded border border-white/40 shadow-sm">
              <span className="text-xs uppercase tracking-widest text-ink-faint font-bold">当前模型</span>
              <p className="text-sm font-bold">白瓷茶盏 - 极简系列</p>
            </div>
            
            <div className="absolute bottom-32 right-6 flex flex-col gap-2">
              <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-ink-medium hover:text-cinnabar">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-ink-medium hover:text-cinnabar">
                <span className="material-symbols-outlined">sync</span>
              </button>
            </div>
          </div>
          
          <div className="h-32 bg-white border-t border-rice-deep flex items-center justify-between px-10">
            <div className="flex flex-1 gap-12 max-w-4xl">
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-ink-faint uppercase tracking-tighter">图案缩放 SCALE</label>
                  <span className="text-xs font-medium text-cinnabar">{scale}%</span>
                </div>
                <input 
                  className="w-full h-1 bg-rice-deep rounded-lg appearance-none cursor-pointer accent-cinnabar" 
                  type="range"
                  min="0"
                  max="100"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-ink-faint uppercase tracking-tighter">图案旋转 ROTATION</label>
                  <span className="text-xs font-medium text-cinnabar">{rotation}°</span>
                </div>
                <input 
                  className="w-full h-1 bg-rice-deep rounded-lg appearance-none cursor-pointer accent-cinnabar" 
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-ink-faint uppercase tracking-tighter">透明度 OPACITY</label>
                  <span className="text-xs font-medium text-cinnabar">{opacity}%</span>
                </div>
                <input 
                  className="w-full h-1 bg-rice-deep rounded-lg appearance-none cursor-pointer accent-cinnabar" 
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="ml-10 flex gap-4">
              <button className="px-6 py-2 border border-cinnabar text-cinnabar text-sm font-bold rounded-lg hover:bg-cinnabar/5 transition-colors">
                重置
              </button>
              <button className="px-8 py-2 bg-cinnabar text-white text-sm font-bold rounded-lg shadow-lg shadow-cinnabar/20 hover:bg-cinnabar-deep transition-transform active:scale-95">
                保存成品
              </button>
            </div>
          </div>
        </section>
        
        <aside className="w-80 border-l border-rice-deep flex flex-col bg-rice">
          <div className="p-6 border-b border-rice-deep">
            <h3 className="text-lg font-bold text-ink mb-1">文化素材库</h3>
            <p className="text-sm text-ink-light">选择传统纹样应用于3D模型</p>
          </div>
          
          <div className="flex p-2 gap-1 border-b border-rice-deep bg-rice-warm/30">
            {categories.map((cat, index) => (
              <button
                key={cat}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-1.5 text-xs font-bold rounded shadow-sm transition-colors ${
                  activeTab === index
                    ? 'bg-white text-cinnabar'
                    : 'text-ink-light hover:text-ink-medium'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {patternLibrary.map((pattern) => (
                <div key={pattern.id} className="group cursor-pointer">
                  <div className={`aspect-square rounded-lg border-2 overflow-hidden relative ${
                    pattern.selected ? 'border-cinnabar' : 'border-rice-deep hover:border-cinnabar'
                  }`}>
                    <div className="w-full h-full transition-transform group-hover:scale-110" style={{ backgroundColor: pattern.selected ? '#c9a84c' : '#ede7d9' }} />
                    {pattern.selected && (
                      <div className="absolute inset-0 bg-cinnabar/10">
                        <div className="absolute bottom-1 right-1 bg-cinnabar text-white p-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs">check</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`mt-2 text-xs font-medium text-center ${
                    pattern.selected ? 'text-cinnabar' : 'text-ink-light group-hover:text-ink-medium'
                  }`}>
                    {pattern.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-rice-warm/20 border-t border-rice-deep">
            <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-cinnabar/40 rounded-lg text-cinnabar text-sm font-bold hover:bg-cinnabar/5 transition-colors">
              <span className="material-symbols-outlined">add_circle</span>
              上传自定义图案
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}
