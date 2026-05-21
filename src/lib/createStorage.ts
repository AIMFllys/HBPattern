import type { CreationSnapshot, MaterialParams, ProductId, TextureParams } from '@/types/create'

const STORAGE_KEY = 'hbpattern-creations'
const MAX_SAVES = 20

export function getSavedCreations(): CreationSnapshot[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CreationSnapshot[]
  } catch {
    return []
  }
}

export function saveCreation(
  productId: ProductId,
  patternId: string,
  textureParams: TextureParams,
  materialParams: MaterialParams
): CreationSnapshot {
  const snapshot: CreationSnapshot = {
    productId,
    patternId,
    textureParams,
    materialParams,
    createdAt: new Date().toISOString(),
  }

  const updated = [snapshot, ...getSavedCreations()].slice(0, MAX_SAVES)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return snapshot
}

export function deleteCreation(createdAt: string): void {
  const updated = getSavedCreations().filter(snapshot => snapshot.createdAt !== createdAt)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function clearAllCreations(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
