// 全屏跨界创作工坊交互视图，不渲染 Footer（Requirement 8.7）
'use client'

import { useMemo, useState } from 'react'
import SiteHeader from '@/components/layout/SiteHeader'
import ParameterSlider from '@/components/ui/ParameterSlider'
import { Icon } from '@/components/icons/Icon'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAuthModal } from '@/stores/useAuthModal'

const categories = ['全部', '楚文化', '织锦工艺', '漆器纹样', '刺绣工艺', '印染工艺']

const placeholderPatterns = [
  { id: 'fengniao', name: '凤鸟云纹', category: '楚文化' },
  { id: 'xilankapu', name: '西兰卡普几何纹', category: '织锦工艺' },
  { id: 'liuyun', name: '汉代流云纹', category: '漆器纹样' },
  { id: 'mudan', name: '汉绣牡丹', category: '刺绣工艺' },
  { id: 'lanyinhua', name: '天门蓝印花', category: '印染工艺' },
  { id: 'shenshou', name: '楚漆神兽纹', category: '漆器纹样' },
]

export default function WorkshopPage() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [selectedPatternId, setSelectedPatternId] = useState('fengniao')
  const [density, setDensity] = useState(75)
  const [metallic, setMetallic] = useState(42)
  const [silk, setSilk] = useState(90)
  const [notice, setNotice] = useState('选择右侧纹样，后续将加载到 Canvas 2D 画布。')
  const user = useAuthStore(state => state.user)
  const { openModal } = useAuthModal()

  const filteredPatterns = useMemo(
    () =>
      activeCategory === '全部'
        ? placeholderPatterns
        : placeholderPatterns.filter(pattern => pattern.category === activeCategory),
    [activeCategory]
  )

  const selectedPattern =
    placeholderPatterns.find(pattern => pattern.id === selectedPatternId) ?? placeholderPatterns[0]

  function requireAuth(message: string, action: () => void) {
    if (!user) {
      openModal(message)
      return
    }
    action()
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-rice">
      <SiteHeader
        logoIcon="grid_view"
        siteName="纹样+ 跨界创作工坊"
        primaryColor="gold"
      />

      <main className="relative flex flex-1 overflow-hidden">
        <div className="relative flex flex-1 flex-col items-center justify-center bg-rice-warm p-6 lg:p-12">
          <div className="absolute left-6 top-4 flex items-center gap-2 text-sm lg:left-8 lg:top-6">
            <span className="text-gold/70">跨界工坊</span>
            <Icon name="chevron_right" size={12} className="text-ink-faint" />
            <span className="text-ink-faint">高端定制</span>
            <Icon name="chevron_right" size={12} className="text-ink-faint" />
            <span className="font-bold text-ink">主题: {selectedPattern.name}</span>
          </div>

          <div className="relative flex aspect-square w-full max-w-2xl items-center justify-center rounded-2xl border border-rice-deep bg-white shadow-card">
            <div className="relative z-10 flex h-full w-full items-center justify-center rounded-2xl bg-rice">
              <div className="text-center">
                <Icon name="brush" size={56} className="mx-auto mb-4 text-gold/40" />
                <p className="text-base font-bold text-ink">{selectedPattern.name}</p>
                <p className="mt-1 text-sm text-ink-faint">Canvas 2D 工作区准备中</p>
              </div>
            </div>

            <div className="glass-panel absolute right-3 top-1/4 max-w-[190px] rounded-lg border-l-4 border-cinnabar p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cinnabar">当前应用纹样</p>
              <p className="text-sm font-bold text-ink">{selectedPattern.name}</p>
            </div>
          </div>

          <div className="glass-panel absolute bottom-6 left-1/2 w-[92%] max-w-4xl -translate-x-1/2 rounded-xl border-t border-white/50 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="tune" className="text-cinnabar" />
                <h3 className="font-bold text-ink">专业调色面板</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-cinnabar px-4 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-cinnabar/90"
                  onClick={() =>
                    requireAuth('登录后即可应用纹样更改', () =>
                      setNotice('当前参数已应用到预览；Canvas 引擎接入后将实时重绘。')
                    )
                  }
                >
                  应用更改
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-rice-warm px-4 py-1.5 text-xs font-bold text-ink-medium transition-all hover:bg-rice-deep"
                  onClick={() => {
                    setDensity(75)
                    setMetallic(42)
                    setSilk(90)
                    setNotice('参数已重置为默认值。')
                  }}
                >
                  重置
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ParameterSlider label="纹样密度" value={density} onChange={setDensity} primaryColor="gold" />
              <ParameterSlider label="金属感" value={metallic} onChange={setMetallic} primaryColor="gold" />
              <ParameterSlider label="丝绸光泽" value={silk} onChange={setSilk} primaryColor="gold" />
            </div>
            <p className="mt-3 text-xs text-ink-faint">{notice}</p>
          </div>
        </div>

        <aside className="hidden w-80 flex-col border-l border-rice-deep/50 bg-white lg:flex xl:w-96">
          <div className="border-b border-rice-deep/30 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <Icon name="auto_awesome" className="text-gold" />
                纹样素材库
              </h2>
              <span className="rounded bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">PREVIEW</span>
            </div>

            <div className="relative mb-4">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                className="w-full rounded-lg border border-rice-deep bg-rice-warm py-2 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-ink-faint focus:border-gold/40 focus:ring-1 focus:ring-gold/30"
                placeholder="搜索纹样..."
                type="text"
              />
            </div>

            <div className="custom-scrollbar flex gap-2 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                    activeCategory === cat
                      ? 'bg-gold text-white shadow-sm'
                      : 'bg-rice text-ink-medium hover:bg-rice-warm'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredPatterns.map(pattern => {
                const isSelected = selectedPatternId === pattern.id
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatternId(pattern.id)
                      setNotice(`${pattern.name} 已选中，真实数据面板将在下一阶段接入。`)
                    }}
                    className="group text-left"
                  >
                    <div
                      className={`aspect-square overflow-hidden rounded-xl border-2 p-1 transition-all group-hover:shadow-lg ${
                        isSelected
                          ? 'border-gold bg-gold/5'
                          : 'border-transparent bg-rice-warm hover:border-rice-deep'
                      }`}
                    >
                      <div className={`h-full w-full rounded-lg ${isSelected ? 'bg-gold' : 'bg-rice-deep'}`} />
                    </div>
                    <p
                      className={`mt-2 text-center text-xs font-bold ${
                        isSelected ? 'text-gold' : 'text-ink-light group-hover:text-ink-medium'
                      }`}
                    >
                      {pattern.name}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-rice-deep/30 bg-rice-warm/50 p-6">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 font-bold text-white shadow-xl transition-all hover:bg-ink-medium"
              onClick={() =>
                requireAuth('登录后即可导出高清设计稿', () =>
                  setNotice('导出将在 Canvas 引擎接入后输出高清设计稿。')
                )
              }
            >
              <Icon name="download" size={16} />
              导出高清设计稿
            </button>
            <p className="mt-3 text-center text-[10px] font-medium text-ink-faint">后续支持 PNG、SVG 设计稿格式</p>
          </div>
        </aside>
      </main>
    </div>
  )
}
