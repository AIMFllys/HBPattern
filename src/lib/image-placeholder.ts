/**
 * Generates a base64 blur placeholder SVG for use with next/image blurDataURL.
 * Uses a brand-adjacent colour (#8B2E2B cinnabar) as the default tint.
 */
export function generateBlurDataURL(color = '#8B2E2B'): string {
  const svg = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="${color}"/></svg>`
  // Use global btoa (available in both Node and browser) to avoid Buffer dependency at edge.
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
