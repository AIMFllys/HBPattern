'use client'

import { memo } from 'react'
import { useWorkshopStore } from '@/stores/useWorkshopStore'
import { ColorAdjustSection } from './adjust/ColorAdjustSection'
import { SymmetrySection } from './adjust/SymmetrySection'
import { TransformSection } from './adjust/TransformSection'

export const AdjustPanel = memo(function AdjustPanel() {
  const activeTool = useWorkshopStore(state => state.activeTool)

  if (activeTool === 'color') return <ColorAdjustSection />
  if (activeTool === 'transform') return <TransformSection />
  if (activeTool === 'symmetry') return <SymmetrySection />

  return null
})
