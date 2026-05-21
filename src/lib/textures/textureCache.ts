import * as THREE from 'three'
import type { PatternGeneratorConfig } from '@/types/create'
import { generatePatternCanvas } from './generatePattern'

const MAX_CACHE_SIZE = 10

interface CacheEntry {
  key: string
  texture: THREE.CanvasTexture
  lastAccess: number
}

const cache: CacheEntry[] = []

function createCacheKey(config: PatternGeneratorConfig): string {
  return JSON.stringify(config)
}

export function getCachedTexture(config: PatternGeneratorConfig): THREE.CanvasTexture {
  const key = createCacheKey(config)
  const existing = cache.find(entry => entry.key === key)

  if (existing) {
    existing.lastAccess = Date.now()
    return existing.texture
  }

  const canvas = generatePatternCanvas(config)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  if (cache.length >= MAX_CACHE_SIZE) {
    cache.sort((a, b) => a.lastAccess - b.lastAccess)
    const evicted = cache.shift()
    evicted?.texture.dispose()
  }

  cache.push({ key, texture, lastAccess: Date.now() })
  return texture
}

export function clearTextureCache() {
  for (const entry of cache) {
    entry.texture.dispose()
  }
  cache.length = 0
}
