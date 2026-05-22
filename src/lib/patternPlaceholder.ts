const FALLBACK_PALETTE = ['#8c2f22', '#c9a84c', '#f5f0e8']

export function createPatternPlaceholderDataUrl({
  name,
  subtitle,
  palette,
}: {
  name: string
  subtitle?: string
  palette?: string[] | null
}) {
  const colors = palette?.length ? palette : FALLBACK_PALETTE
  const stops = colors
    .map((color, index) => {
      const offset = Math.round((index / Math.max(1, colors.length - 1)) * 100)
      return `<stop offset="${offset}%" stop-color="${escapeXml(color)}"/>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">${stops}</linearGradient><pattern id="p" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M45 8 82 45 45 82 8 45Z" fill="none" stroke="rgba(255,255,255,.34)" stroke-width="8"/></pattern></defs><rect width="900" height="900" fill="url(#g)"/><rect width="900" height="900" fill="url(#p)" opacity=".66"/><text x="450" y="430" fill="rgba(255,255,255,.92)" font-size="74" font-family="serif" font-weight="700" text-anchor="middle">${escapeXml(name.slice(0, 6))}</text><text x="450" y="505" fill="rgba(255,255,255,.72)" font-size="30" font-family="sans-serif" text-anchor="middle">${escapeXml(subtitle ?? '湖北纹样')}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]!))
}
