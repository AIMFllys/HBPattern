/**
 * Pattern types shared across API routes, pages, and components.
 * These mirror the Prisma schema but are safe to import in client code
 * (no server-only dependencies).
 */

export interface PatternListItem {
  id: string
  name: string
  nameEn?: string
  era: string
  region: string
  technique: string
  thumbnailUrl?: string
  aspectRatio: string
  imagePlaceholderColor: string
  isAiGenerated: boolean
}

export interface PatternDetail extends PatternListItem {
  description: string
  colorPalette: string[]
  culturalSignificance?: string
  dimensions?: string
  material?: string
  createdAt: string
  updatedAt: string
  likeCount: number
  viewCount: number
  mediaUrls: PatternMedia[]
}

export interface PatternMedia {
  id: string
  url: string
  type: 'image' | 'video' | '3d_model' | 'deep_zoom'
  caption?: string
}

export interface PatternFilterOptions {
  eras: string[]
  regions: string[]
  techniques: string[]
}
