import type { CanvasBlendMode, SerializableLayer, WorkshopLayer } from '@/types/workshop'

const SUPPORTED_BLEND_MODES = new Set<CanvasBlendMode>([
  'source-over',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
])

export function normalizeBlendMode(mode: CanvasBlendMode): GlobalCompositeOperation {
  return SUPPORTED_BLEND_MODES.has(mode) ? mode : 'source-over'
}

export function serializeWorkshopLayers(layers: WorkshopLayer[]): SerializableLayer[] {
  return layers.map(layer => ({
    id: layer.id,
    name: layer.name,
    type: layer.type,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
    blendMode: layer.blendMode,
    sourceImageUrl: layer.sourceImageUrl,
    sourcePatternId: layer.sourcePatternId,
    sourcePatternName: layer.sourcePatternName,
    fillColor: layer.fillColor,
    transform: layer.transform,
    colorAdjust: layer.colorAdjust,
    loadStatus: layer.loadStatus,
    errorMessage: layer.errorMessage,
    createdAt: layer.createdAt,
  }))
}

export function hasRenderablePattern(layer: WorkshopLayer) {
  return layer.type === 'pattern' && Boolean(layer.sourceImageUrl) && layer.visible && layer.opacity > 0
}
