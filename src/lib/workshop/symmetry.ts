import type { LayerTransform, SymmetryConfig, SymmetryType } from '@/types/workshop'

export interface DrawInstruction {
  transform: LayerTransform
  rotationOffset: number
  mirrorX: boolean
  mirrorY: boolean
}

export interface SymmetryGuideLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function getRadialFoldCount(type: SymmetryType) {
  if (type === 'radial-4') return 4
  if (type === 'radial-6') return 6
  if (type === 'radial-8') return 8
  return 1
}

export function createSymmetryInstructions(
  transform: LayerTransform,
  symmetry: SymmetryConfig
): DrawInstruction[] {
  if (symmetry.type === 'none') {
    return [{ transform, rotationOffset: 0, mirrorX: false, mirrorY: false }]
  }

  if (symmetry.type === 'horizontal') {
    return [
      { transform, rotationOffset: 0, mirrorX: false, mirrorY: false },
      { transform, rotationOffset: 0, mirrorX: false, mirrorY: true },
    ]
  }

  if (symmetry.type === 'vertical') {
    return [
      { transform, rotationOffset: 0, mirrorX: false, mirrorY: false },
      { transform, rotationOffset: 0, mirrorX: true, mirrorY: false },
    ]
  }

  if (symmetry.type === 'both') {
    return [
      { transform, rotationOffset: 0, mirrorX: false, mirrorY: false },
      { transform, rotationOffset: 0, mirrorX: true, mirrorY: false },
      { transform, rotationOffset: 0, mirrorX: false, mirrorY: true },
      { transform, rotationOffset: 0, mirrorX: true, mirrorY: true },
    ]
  }

  const foldCount = getRadialFoldCount(symmetry.type)
  const angleStep = (Math.PI * 2) / foldCount
  return Array.from({ length: foldCount }, (_, index) => ({
    transform,
    rotationOffset: angleStep * index,
    mirrorX: false,
    mirrorY: false,
  }))
}

export function createSymmetryGuideLines(
  symmetry: SymmetryConfig,
  width: number,
  height: number
): SymmetryGuideLine[] {
  if (!symmetry.showGuides || symmetry.type === 'none') return []

  const centerX = width * symmetry.centerX
  const centerY = height * symmetry.centerY

  if (symmetry.type === 'horizontal') {
    return [{ x1: 0, y1: centerY, x2: width, y2: centerY }]
  }

  if (symmetry.type === 'vertical') {
    return [{ x1: centerX, y1: 0, x2: centerX, y2: height }]
  }

  if (symmetry.type === 'both') {
    return [
      { x1: centerX, y1: 0, x2: centerX, y2: height },
      { x1: 0, y1: centerY, x2: width, y2: centerY },
    ]
  }

  const foldCount = getRadialFoldCount(symmetry.type)
  const radius = Math.hypot(width, height)
  const angleStep = (Math.PI * 2) / foldCount

  return Array.from({ length: foldCount }, (_, index) => {
    const angle = angleStep * index
    return {
      x1: centerX - Math.cos(angle) * radius,
      y1: centerY - Math.sin(angle) * radius,
      x2: centerX + Math.cos(angle) * radius,
      y2: centerY + Math.sin(angle) * radius,
    }
  })
}
