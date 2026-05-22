import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYER_TRANSFORM, DEFAULT_SYMMETRY } from '@/types/workshop'
import { createSymmetryGuideLines, createSymmetryInstructions, getRadialFoldCount } from '../symmetry'

describe('workshop symmetry helpers', () => {
  it('creates mirror instructions for both-axis symmetry', () => {
    const instructions = createSymmetryInstructions(DEFAULT_LAYER_TRANSFORM, {
      ...DEFAULT_SYMMETRY,
      type: 'both',
    })

    expect(instructions).toHaveLength(4)
    expect(instructions.map(item => [item.mirrorX, item.mirrorY])).toEqual([
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ])
  })

  it('maps radial symmetry types to their fold count and rotations', () => {
    expect(getRadialFoldCount('radial-6')).toBe(6)

    const instructions = createSymmetryInstructions(DEFAULT_LAYER_TRANSFORM, {
      ...DEFAULT_SYMMETRY,
      type: 'radial-4',
    })

    expect(instructions).toHaveLength(4)
    expect(instructions[1].rotationOffset).toBeCloseTo(Math.PI / 2)
  })

  it('does not emit guide lines when guide rendering is disabled', () => {
    expect(createSymmetryGuideLines({ ...DEFAULT_SYMMETRY, type: 'vertical', showGuides: false }, 100, 80)).toEqual([])
  })

  it('creates centered guide lines for both-axis symmetry', () => {
    const lines = createSymmetryGuideLines({ ...DEFAULT_SYMMETRY, type: 'both', showGuides: true }, 100, 80)

    expect(lines).toEqual([
      { x1: 50, y1: 0, x2: 50, y2: 80 },
      { x1: 0, y1: 40, x2: 100, y2: 40 },
    ])
  })
})
