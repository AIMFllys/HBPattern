'use client'

import { Icon } from '@/components/icons/Icon'

export type MobileCreateTab = 'viewport' | 'pattern' | 'params'

interface Props {
  activeTab: MobileCreateTab
  onTabChange: (tab: MobileCreateTab) => void
}

const TABS: { value: MobileCreateTab; label: string; icon: string }[] = [
  { value: 'viewport', label: '视口', icon: 'deployed_code' },
  { value: 'pattern', label: '纹样', icon: 'palette' },
  { value: 'params', label: '参数', icon: 'tune' },
]

export function MobileToolbar({ activeTab, onTabChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-surface-inset px-4 py-2 shadow-modal lg:hidden">
      {TABS.map(tab => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={`flex min-w-20 flex-col items-center gap-0.5 rounded-lg px-4 py-1 transition-colors ${
            activeTab === tab.value ? 'text-cinnabar' : 'text-text-faint'
          }`}
        >
          <Icon name={tab.icon} size={20} />
          <span className="text-xs font-bold">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
