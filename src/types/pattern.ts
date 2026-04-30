/**
 * Pattern types shared across API routes, pages, and components.
 * These mirror the Supabase query results and are safe to import in client code.
 * IMPORTANT: This file is the single source of truth for pattern types.
 */

/** Compact pattern item used in gallery list and homepage grids. */
export interface PatternListItem {
  id: string
  name: string
  description: string | null
  era: string | null
  is_ai_generated: boolean
  status: string
  color_palette: string[] | null
  view_count: number
  like_count: number
  region: { name: string } | null
  technique: { name: string } | null
  media: { url: string; thumbnail_url: string | null }[]
  tags: { tag: { name: string } }[]
}

/** Full pattern detail returned by getPatternById. */
export interface PatternDetail extends PatternListItem {
  uploader_id: string
  region_id: string | null
  technique_id: string | null
  license_type: string
  ai_model_version: string | null
  created_at: string
  updated_at: string
  region: { id: string; name: string; province: string } | null
  technique: { id: string; name: string; category: string } | null
  ich_record: { id: string; name: string; level: string } | null
  media: { id: string; url: string; thumbnail_url: string | null; media_type: string; sort_order: number }[]
  tags: { tag: { id: string; name: string } }[]
}

/** Media attached to a pattern. */
export interface PatternMedia {
  id: string
  url: string
  thumbnail_url: string | null
  media_type: 'image' | 'video' | '3d_model' | 'deep_zoom'
  sort_order: number
}

/** Filter options for gallery sidebar. */
export interface PatternFilterOptions {
  eras: string[]
  regions: { id: string; name: string }[]
  techniques: { id: string; name: string }[]
}
