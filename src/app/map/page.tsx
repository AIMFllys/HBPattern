import SiteHeader from '@/components/layout/SiteHeader'
import { Icon } from '@/components/icons/Icon'
import { mockRegions } from '@/data/mock/regions'

export const metadata = {
  title: '3D 文化地图',
  description: '以交互式地图探索湖北各地纹绣文化的地理分布与非遗传承。',
}

export default function MapPage() {
  const highlightedRegion = mockRegions.find(r => r.isHighlighted) || mockRegions[0]

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <SiteHeader 
        logoIcon="storm" 
        siteName="湖北非遗3D文化地图" 
        primaryColor="gold" 
      />
      
      <main className="flex flex-col lg:flex-row h-[calc(100vh-73px)] overflow-hidden">
        <aside className="w-full lg:w-72 border-r border-rice-deep flex flex-col bg-rice overflow-y-auto">
          <div className="p-5 flex flex-col gap-5">
            <div>
              <h3 className="text-[11px] font-bold text-ink-faint uppercase tracking-widest mb-3">实时数据看板</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 bg-rice-warm rounded-lg border border-rice-deep/50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-ink-light">传统纹样总数</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">+5.2%</span>
                  </div>
                  <div className="text-xl font-bold text-ink">1,284 <span className="text-[10px] font-normal text-ink-faint ml-0.5">件</span></div>
                </div>
                <div className="p-3.5 bg-rice-warm rounded-lg border border-rice-deep/50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-ink-light">活跃工艺大师</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">+2.1%</span>
                  </div>
                  <div className="text-xl font-bold text-ink">456 <span className="text-[10px] font-normal text-ink-faint ml-0.5">位</span></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[11px] font-bold text-ink-faint uppercase tracking-widest mb-2.5">层级筛选</h3>
              <button className="flex items-center gap-2.5 px-3 py-2.5 rounded bg-gold/90 text-ink font-medium">
                <Icon name="grid_view" size={18} />
                <span className="text-xs">全省概览</span>
              </button>
              <button className="flex items-center gap-2.5 px-3 py-2.5 rounded hover:bg-rice-warm text-ink-medium transition-colors">
                <Icon name="map" size={18} />
                <span className="text-xs font-medium">地区分布</span>
              </button>
              <button className="flex items-center gap-2.5 px-3 py-2.5 rounded hover:bg-rice-warm text-ink-medium transition-colors">
                <Icon name="category" size={18} />
                <span className="text-xs font-medium">类别检索</span>
              </button>
              <button className="flex items-center gap-2.5 px-3 py-2.5 rounded hover:bg-rice-warm text-ink-medium transition-colors">
                <Icon name="bookmark" size={18} />
                <span className="text-xs font-medium">我的收藏</span>
              </button>
            </div>
            
            <div className="mt-auto pt-4">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-cinnabar/90 hover:bg-cinnabar text-white rounded font-bold text-xs shadow-md shadow-cinnabar/20 transition-colors">
                <Icon name="download" size={16} />
                下载年度研究报告
              </button>
            </div>
          </div>
        </aside>
        
        <section className="flex-1 relative bg-[#fdfcf9]">
          <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-multiply" style={{ backgroundColor: '#e6e2d1' }} />
          
          <div className="relative z-10 w-full h-full p-6 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start pointer-events-auto">
              <div className="bg-white/80 backdrop-blur p-3 rounded-xl border border-rice-deep shadow-sm max-w-[14rem]">
                <h4 className="text-gold font-bold text-[10px] tracking-widest uppercase mb-0.5">当前视图</h4>
                <p className="text-ink font-bold text-base">湖北省行政区域</p>
                <p className="text-ink-light text-[10px] mt-1 leading-tight">点击城市锚点查看详细非遗数据洞察</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="bg-white rounded shadow-sm overflow-hidden flex flex-col border border-rice-deep">
                  <button className="p-1.5 hover:bg-rice-warm text-ink-medium">
                    <Icon name="add" size={18} />
                  </button>
                  <div className="h-px bg-rice-deep mx-2"></div>
                  <button className="p-1.5 hover:bg-rice-warm text-ink-medium">
                    <Icon name="remove" size={18} />
                  </button>
                </div>
                <button className="bg-white p-1.5 rounded shadow-sm border border-rice-deep text-ink-medium pointer-events-auto hover:bg-rice-warm">
                  <Icon name="my_location" size={18} />
                </button>
                <button className="bg-white p-1.5 rounded shadow-sm border border-rice-deep text-ink-medium pointer-events-auto hover:bg-rice-warm">
                  <Icon name="layers" size={18} />
                </button>
              </div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {mockRegions.map((region) => (
                <div
                  key={region.id}
                  className={`absolute pointer-events-auto ${region.isHighlighted ? 'opacity-100' : 'opacity-60'}`}
                  style={{ top: region.positionTop, left: region.positionLeft }}
                >
                  <div className="relative cursor-pointer">
                    {region.isHighlighted && (
                      <div className="absolute -inset-4 bg-gold/20 rounded-full animate-pulse" />
                    )}
                    <div 
                      className={`relative rounded-full border-2 border-white ${
                        region.isHighlighted ? 'size-4 bg-cinnabar marker-red' : 'size-3 bg-gold map-glow'
                      }`}
                    />
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-ink shadow-sm border border-rice-deep">
                      {region.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-auto pointer-events-auto self-start">
              <div className="bg-white border-l-4 border-cinnabar p-5 rounded-r-xl shadow-xl max-w-[20rem] border-y border-r border-rice-deep">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-cinnabar font-bold text-[10px] uppercase tracking-tighter">地区洞察</span>
                    <h2 className="text-lg font-bold text-ink leading-tight">{highlightedRegion.name} <span className="text-sm text-ink-medium font-medium">({highlightedRegion.namePinyin})</span></h2>
                  </div>
                  <Icon name="info" size={16} className="text-ink-faint mt-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-ink-faint">国家级非遗项目</p>
                    <p className="text-lg font-bold text-ink">{highlightedRegion.stats.ichProjects} <span className="text-[10px] font-normal">项</span></p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-ink-faint">省级代表传承人</p>
                    <p className="text-lg font-bold text-ink">{highlightedRegion.stats.inheritors} <span className="text-[10px] font-normal">位</span></p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-ink-medium flex items-center gap-1.5">
                    <span className="size-1 bg-cinnabar rounded-full"></span> 重点推荐项目
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {highlightedRegion.stats.featuredProjects.map((project) => (
                      <div key={project} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-rice-warm hover:bg-gold/10 transition-colors cursor-pointer group">
                        <span className="text-xs text-ink-medium group-hover:text-ink transition-colors">{project}</span>
                        <Icon name="chevron_right" size={14} className="text-ink-faint" />
                      </div>
                    ))}
                  </div>
                </div>
                
                <button className="w-full mt-5 py-2 border border-rice-deep text-ink-medium text-[11px] font-bold rounded hover:bg-rice-warm transition-colors">
                  查看该地区完整数字档案
                </button>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur px-3 py-2.5 rounded border border-rice-deep shadow-sm pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-cinnabar rounded-full"></div>
              <span className="text-[10px] text-ink-medium font-medium leading-none">重点文化保护区</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-gold rounded-full"></div>
              <span className="text-[10px] text-ink-medium font-medium leading-none">一般非遗集聚地</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-slate-200 rounded-full border border-slate-300"></div>
              <span className="text-[10px] text-ink-medium font-medium leading-none">待考察区域</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
