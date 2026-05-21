import type { Metadata } from 'next'
import SiteHeader from '@/components/layout/SiteHeader'
import HubeiMapClient from '@/components/map/HubeiMapClient'

export const metadata: Metadata = {
  title: '3D 文化地图',
  description: '以本地矢量湖北地图探索纹样、地点与非遗线索的地理分布。',
}

export default function MapPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-rice">
      <SiteHeader
        logoIcon="storm"
        siteName="湖北非遗3D文化地图"
        primaryColor="gold"
      />
      <HubeiMapClient />
    </div>
  )
}
