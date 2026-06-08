/** Seed-generated SVG data URLs — suitable for cards/thumbnails, not full-bleed hero backgrounds. */
export function isPlaceholderMediaUrl(url: string | null | undefined): boolean {
  if (!url) return true
  return url.startsWith('data:image/svg+xml')
}

/** Design-reference fallback until featured patterns have real storage URLs. */
export const DEFAULT_FEATURED_FRAME_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAsNXdBQSzIk8lxkjO_09UAZEGl79AJKULYueXNcqoCPTfBYGPNoLJzHJ_sX4UnAEAbexD1L_TM-cqEgtIkYVe2OkZq0LiMrPFnr66BPMNBnxGt0DYyYaH0W-9iOI5P2YKWzGYc2N75wvmaMkUYQR7jq2-NQ0n9nMuy7jW9OmvvVpVAst36tFCNLlDdNv7w2rcySF9exdhQylitge3g7k_xMdsYt8MnQquNOpDAiPBwpsicZoJJaGIqIydCEZ32LumBEgl_DjiJfg'

export function resolveFeaturedFrameImageUrl(url: string | null | undefined): string {
  if (url && !isPlaceholderMediaUrl(url)) return url
  return DEFAULT_FEATURED_FRAME_IMAGE
}
