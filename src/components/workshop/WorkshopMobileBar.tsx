'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import type { PatternListItem } from '@/types/pattern'
import type { WorkshopTool } from '@/types/workshop'
import { AdjustPanel } from './AdjustPanel'
import { LayerPanel } from './LayerPanel'
import { PatternAssetPanel } from './PatternAssetPanel'

type MobileSheet = 'patterns' | 'tools' | 'layers' | null

interface WorkshopMobileBarProps {
  initialPatterns: PatternListItem[]
  initialTotal: number
}

const TOOL_OPTIONS: { id: WorkshopTool; icon: string; label: string }[] = [
  { id: 'select', icon: 'near_me', label: '选择' },
  { id: 'pan', icon: 'pan_tool', label: '平移' },
  { id: 'transform', icon: 'transform', label: '变换' },
  { id: 'color', icon: 'palette', label: '调色' },
  { id: 'symmetry', icon: 'texture', label: '对称' },
]

export function WorkshopMobileBar({ initialPatterns, initialTotal }: WorkshopMobileBarProps) {
  const [activeSheet, setActiveSheet] = useState<MobileSheet>(null)
  const setIsExporting = useWorkshopStore(state => state.setIsExporting)
  const activeTool = useWorkshopStore(state => state.activeTool)
  const setActiveTool = useWorkshopStore(state => state.setActiveTool)

  const toggleSheet = (sheet: Exclude<MobileSheet, null>) => {
    setActiveSheet(current => (current === sheet ? null : sheet))
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-rice-deep bg-white px-3 py-2 shadow-modal lg:hidden">
        <MobileButton
          icon="auto_awesome"
          label="纹样"
          active={activeSheet === 'patterns'}
          onClick={() => toggleSheet('patterns')}
        />
        <MobileButton
          icon="handyman"
          label="工具"
          active={activeSheet === 'tools'}
          onClick={() => toggleSheet('tools')}
        />
        <MobileButton
          icon="layers"
          label="图层"
          active={activeSheet === 'layers'}
          onClick={() => toggleSheet('layers')}
        />
        <MobileButton
          icon="download"
          label="导出"
          active={false}
          onClick={() => setIsExporting(true)}
        />
      </nav>

      <AnimatePresence>
        {activeSheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-14 left-0 right-0 z-30 max-h-[72vh] overflow-hidden rounded-t-2xl border-t border-rice-deep bg-white shadow-modal lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-rice-deep px-4 py-2">
              <span className="h-1 w-10 rounded-full bg-rice-deep" />
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="text-ink-faint"
                aria-label="关闭面板"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {activeSheet === 'patterns' && (
              <PatternAssetPanel
                initialPatterns={initialPatterns}
                initialTotal={initialTotal}
                compact
                className="h-[calc(72vh-45px)] w-full border-l-0"
              />
            )}

            {activeSheet === 'tools' && (
              <div className="custom-scrollbar max-h-[calc(72vh-45px)] overflow-y-auto">
                <div className="grid grid-cols-5 gap-2 border-b border-rice-deep p-3">
                  {TOOL_OPTIONS.map(tool => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTool(tool.id)}
                      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold transition-colors ${
                        activeTool === tool.id
                          ? 'bg-gold text-white'
                          : 'bg-rice-warm text-ink-light'
                      }`}
                    >
                      <Icon name={tool.icon} size={18} />
                      {tool.label}
                    </button>
                  ))}
                </div>
                <AdjustPanel />
              </div>
            )}

            {activeSheet === 'layers' && (
              <div className="custom-scrollbar max-h-[calc(72vh-45px)] overflow-y-auto">
                <LayerPanel />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function MobileButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-16 flex-col items-center gap-0.5 rounded-lg px-3 py-1 transition-colors ${
        active ? 'text-gold' : 'text-ink-faint'
      }`}
    >
      <Icon name={icon} size={20} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  )
}
