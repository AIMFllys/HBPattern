'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force'

export interface GraphNode extends SimulationNodeDatum {
  id: string
  name: string
  imageUrl?: string | null
  isCurrent?: boolean
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  type: 'evolved_from' | 'influenced_by' | 'variant_of' | 'same_origin'
}

interface KnowledgeGraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
}

const LINK_COLORS: Record<string, string> = {
  evolved_from: '#c9a84c',
  influenced_by: '#b84a39',
  variant_of: '#6b6b60',
  same_origin: '#d9a859',
}

const LINK_LABELS: Record<string, string> = {
  evolved_from: '演化自',
  influenced_by: '受影响于',
  variant_of: '变体',
  same_origin: '同源',
}

export function KnowledgeGraph({ nodes, links }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<Simulation<GraphNode, GraphLink> | null>(null)
  const router = useRouter()

  const handleClick = useCallback((nodeId: string) => {
    router.push(`/gallery/${nodeId}`)
  }, [router])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || nodes.length === 0) return

    const rect = svg.getBoundingClientRect()
    const width = rect.width || 800
    const height = rect.height || 500

    // Clear previous content
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    svg.appendChild(g)

    // Create simulation
    const simulation = forceSimulation(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(120))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(40))

    simRef.current = simulation

    // Create link elements
    const linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.appendChild(linkGroup)

    const linkEls = links.map((link) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('stroke', LINK_COLORS[link.type] ?? '#ccc')
      line.setAttribute('stroke-width', '2')
      line.setAttribute('stroke-dasharray', link.type === 'variant_of' ? '6,3' : 'none')
      line.setAttribute('opacity', '0.6')
      linkGroup.appendChild(line)
      return line
    })

    // Create link labels
    const linkLabelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.appendChild(linkLabelGroup)

    const linkLabelEls = links.map((link) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('font-size', '10')
      text.setAttribute('fill', '#8c8c80')
      text.setAttribute('text-anchor', 'middle')
      text.textContent = LINK_LABELS[link.type] ?? ''
      linkLabelGroup.appendChild(text)
      return text
    })

    // Create node groups
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.appendChild(nodeGroup)

    const nodeEls = nodes.map((node) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      group.style.cursor = 'pointer'

      // Circle background
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('r', node.isCurrent ? '28' : '22')
      circle.setAttribute('fill', node.isCurrent ? '#b84a39' : '#f5f0e8')
      circle.setAttribute('stroke', node.isCurrent ? '#8c2f22' : '#c9a84c')
      circle.setAttribute('stroke-width', node.isCurrent ? '3' : '2')
      group.appendChild(circle)

      // Pattern image (clipped)
      if (node.imageUrl) {
        const clipId = `clip-${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath')
        clipPath.setAttribute('id', clipId)
        const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        clipCircle.setAttribute('r', node.isCurrent ? '24' : '18')
        clipPath.appendChild(clipCircle)
        defs.appendChild(clipPath)
        group.appendChild(defs)

        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
        const imgR = node.isCurrent ? 24 : 18
        image.setAttribute('href', node.imageUrl)
        image.setAttribute('x', String(-imgR))
        image.setAttribute('y', String(-imgR))
        image.setAttribute('width', String(imgR * 2))
        image.setAttribute('height', String(imgR * 2))
        image.setAttribute('clip-path', `url(#${clipId})`)
        image.setAttribute('preserveAspectRatio', 'xMidYMid slice')
        group.appendChild(image)
      }

      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('y', String((node.isCurrent ? 28 : 22) + 16))
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('font-size', '12')
      text.setAttribute('font-weight', node.isCurrent ? '700' : '500')
      text.setAttribute('fill', node.isCurrent ? '#b84a39' : '#4a4a40')
      text.textContent = node.name
      group.appendChild(text)

      // Click handler
      group.addEventListener('click', () => handleClick(node.id))

      // Drag handlers
      let dragging = false
      group.addEventListener('pointerdown', (e) => {
        dragging = false
        const onStartPointerMove = (ev: PointerEvent) => {
          dragging = true
          node.fx = (ev.clientX - rect.left - width / 2) / 1 + width / 2
          node.fy = (ev.clientY - rect.top - height / 2) / 1 + height / 2
          // Convert client coords to SVG coords
          const svgPt = svg.createSVGPoint()
          svgPt.x = ev.clientX
          svgPt.y = ev.clientY
          const ctm = g.getScreenCTM()
          if (ctm) {
            const pt = svgPt.matrixTransform(ctm.inverse())
            node.fx = pt.x
            node.fy = pt.y
          }
          simulation.alphaTarget(0.3).restart()
        }
        const onEndPointerMove = () => {
          window.removeEventListener('pointermove', onStartPointerMove)
          window.removeEventListener('pointerup', onEndPointerMove)
          if (!dragging) {
            handleClick(node.id)
          } else {
            simulation.alphaTarget(0)
            node.fx = null
            node.fy = null
          }
        }
        window.addEventListener('pointermove', onStartPointerMove)
        window.addEventListener('pointerup', onEndPointerMove)
        e.preventDefault()
      })

      nodeGroup.appendChild(group)
      return group
    })

    // Tick handler
    simulation.on('tick', () => {
      links.forEach((link, i) => {
        const source = link.source as GraphNode
        const target = link.target as GraphNode
        linkEls[i].setAttribute('x1', String(source.x))
        linkEls[i].setAttribute('y1', String(source.y))
        linkEls[i].setAttribute('x2', String(target.x))
        linkEls[i].setAttribute('y2', String(target.y))

        linkLabelEls[i].setAttribute('x', String(((source.x ?? 0) + (target.x ?? 0)) / 2))
        linkLabelEls[i].setAttribute('y', String(((source.y ?? 0) + (target.y ?? 0)) / 2 - 8))
      })

      nodes.forEach((node, i) => {
        nodeEls[i].setAttribute('transform', `translate(${node.x},${node.y})`)
      })
    })

    return () => {
      simulation.stop()
      simRef.current = null
    }
  }, [nodes, links, handleClick])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-rice-deep bg-white">
      <div className="flex items-center gap-4 px-6 py-3 border-b border-rice-deep/50">
        <h3 className="font-serif text-lg font-bold text-ink">演化关系图谱</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(LINK_LABELS).map(([type, label]) => (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block w-4 h-0.5 rounded-full"
                style={{
                  backgroundColor: LINK_COLORS[type],
                  ...(type === 'variant_of' ? { backgroundImage: `repeating-linear-gradient(90deg, ${LINK_COLORS[type]} 0, ${LINK_COLORS[type]} 4px, transparent 4px, transparent 7px)` } : {}),
                }}
              />
              <span className="text-ink-medium">{label}</span>
            </span>
          ))}
        </div>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-[500px]"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid meet"
        aria-label="纹样演化关系知识图谱"
      />
    </div>
  )
}
