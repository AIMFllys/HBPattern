import type { StyleSpecification } from 'maplibre-gl'

/**
 * 楚文化水墨风 MapLibre style
 *
 * 数据源：
 * - openfreemap: OpenMapTiles schema 矢量瓦片（免费无 token）
 * - terrain: AWS Terrarium 高程瓦片（raster-dem，用于 hillshade）
 * - hubei-regions: 湖北地市 GeoJSON（addSource 时注入）
 * - hubei-places: 关键地点 GeoJSON
 * - hubei-bindings: 纹样绑定点 GeoJSON
 * - hubei-rivers: 长江/汉江主干 polyline
 * - neighbor-provinces: 邻省边界 GeoJSON
 *
 * 配色：宣纸底 + 淡墨青水域 + 朱砂省界 + 金色省面淡晕 + 棕辅色地市界
 */

const OPENFREEMAP_TILES = 'https://tiles.openfreemap.org/planet'
const OPENFREEMAP_GLYPHS = 'https://tiles.openfreemap.org/glyphs/{fontstack}/{range}.pbf'
const OPENFREEMAP_SPRITE = 'https://tiles.openfreemap.org/sprites/openmaptiles'

const TERRAIN_TILES = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'

export const INK_STYLE_COLORS = {
  paper: '#f5f0e6',
  paperWarm: '#ede4d2',
  inkDeep: '#1a1a14',
  inkMedium: '#3d3d30',
  inkLight: '#6b6b58',
  water: '#c8d4dc',
  waterDeep: '#a8bcc8',
  cinnabar: '#b84a39',
  cinnabarDeep: '#8c2f22',
  gold: '#c9a84c',
  goldLight: '#e8c97a',
  brown: '#a96d38',
  neighbor: '#e8e2d4',
  neighborBorder: '#7a6a4a',
} as const

export const HUBEI_MAP_INITIAL = {
  center: [114.305, 30.593] as [number, number],
  zoom: 6.8,
  pitch: 0,
  bearing: 0,
  minZoom: 5,
  maxZoom: 14,
} as const

export function createInkStyle(): StyleSpecification {
  return {
    version: 8,
    name: 'HBPattern Ink (楚文化水墨风)',
    metadata: {
      'maplibre:autocomposite': false,
      'openmaptiles:version': 3,
    },
    glyphs: OPENFREEMAP_GLYPHS,
    sprite: OPENFREEMAP_SPRITE,
    sources: {
      openfreemap: {
        type: 'vector',
        tiles: [OPENFREEMAP_TILES],
        maxzoom: 14,
        attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors',
      },
      terrain: {
        type: 'raster-dem',
        tiles: [TERRAIN_TILES],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 13,
        attribution: '© Mapzen Terrain Tiles',
      },
      'hubei-regions': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      'hubei-places': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      'hubei-bindings': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      'hubei-rivers': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      'neighbor-provinces': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      // ─── 陆地底色（宣纸色） ───────────────────────────────────
      {
        id: 'land-base',
        type: 'background',
        paint: { 'background-color': INK_STYLE_COLORS.paper },
      },

      // ─── 地形晕渲（hillshade，山势墨色） ─────────────────────
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        paint: {
          'hillshade-shadow-color': INK_STYLE_COLORS.inkDeep,
          'hillshade-highlight-color': INK_STYLE_COLORS.paperWarm,
          'hillshade-accent-color': INK_STYLE_COLORS.gold,
          'hillshade-exaggeration': 0.65,
          'hillshade-illumination-direction': 315,
          'hillshade-illumination-anchor': 'map',
        },
        layout: { visibility: 'visible' },
      },

      // ─── 水域（淡墨青） ─────────────────────────────────────
      {
        id: 'water',
        type: 'fill',
        source: 'openfreemap',
        'source-layer': 'water',
        paint: {
          'fill-color': INK_STYLE_COLORS.water,
          'fill-opacity': 0.85,
        },
      },
      {
        id: 'water-line',
        type: 'line',
        source: 'openfreemap',
        'source-layer': 'water',
        paint: {
          'line-color': INK_STYLE_COLORS.waterDeep,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.3, 12, 1.2],
        },
      },

      // ─── 河流（OpenMapTiles waterway） ──────────────────────
      {
        id: 'waterway-river',
        type: 'line',
        source: 'openfreemap',
        'source-layer': 'waterway',
        filter: ['==', ['get', 'class'], 'river'],
        paint: {
          'line-color': INK_STYLE_COLORS.waterDeep,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 12, 3.2],
          'line-opacity': 0.9,
        },
      },
      {
        id: 'waterway-stream',
        type: 'line',
        source: 'openfreemap',
        'source-layer': 'waterway',
        filter: ['!=', ['get', 'class'], 'river'],
        paint: {
          'line-color': INK_STYLE_COLORS.waterDeep,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 1.4],
          'line-opacity': 0.6,
        },
      },

      // ─── 长江/汉江主干（内置 GeoJSON，强化显示） ─────────────
      {
        id: 'hubei-rivers-main',
        type: 'line',
        source: 'hubei-rivers',
        paint: {
          'line-color': INK_STYLE_COLORS.waterDeep,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.6, 12, 4.5],
          'line-opacity': 0.95,
        },
      },

      // ─── 邻省面（灰度弱化） ─────────────────────────────────
      {
        id: 'neighbor-fill',
        type: 'fill',
        source: 'neighbor-provinces',
        paint: {
          'fill-color': INK_STYLE_COLORS.neighbor,
          'fill-opacity': 0.55,
        },
      },
      {
        id: 'neighbor-border',
        type: 'line',
        source: 'neighbor-provinces',
        paint: {
          'line-color': INK_STYLE_COLORS.neighborBorder,
          'line-width': 0.4,
          'line-opacity': 0.5,
        },
      },

      // ─── 湖北地市面（金色淡晕，选中朱砂） ───────────────────
      {
        id: 'hubei-region-fill',
        type: 'fill',
        source: 'hubei-regions',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'selected'], true],
            INK_STYLE_COLORS.cinnabar,
            INK_STYLE_COLORS.gold,
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'selected'], true],
            0.18,
            0.08,
          ],
        },
      },
      {
        id: 'hubei-region-fill-hover',
        type: 'fill',
        source: 'hubei-regions',
        filter: ['==', ['id'], ['feature-state', 'hover']],
        paint: {
          'fill-color': INK_STYLE_COLORS.goldLight,
          'fill-opacity': 0.22,
        },
      },
      {
        id: 'hubei-region-border',
        type: 'line',
        source: 'hubei-regions',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'selected'], true],
            INK_STYLE_COLORS.cinnabarDeep,
            INK_STYLE_COLORS.brown,
          ],
          'line-width': [
            'case',
            ['==', ['get', 'selected'], true],
            1.8,
            0.6,
          ],
        },
      },

      // ─── 县级边界（zoom 8+ 显示，OpenMapTiles admin_level=6） ─
      {
        id: 'county-border',
        type: 'line',
        source: 'openfreemap',
        'source-layer': 'boundary',
        filter: [
          'all',
          ['==', ['get', 'admin_level'], 6],
          ['!=', ['get', 'maritime'], 1],
        ],
        minzoom: 8,
        paint: {
          'line-color': INK_STYLE_COLORS.brown,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.3, 12, 0.8],
          'line-opacity': 0.5,
          'line-dasharray': [2, 1.5],
        },
      },

      // ─── 省界（朱砂主色，OpenMapTiles admin_level=4） ───────
      {
        id: 'province-border',
        type: 'line',
        source: 'openfreemap',
        'source-layer': 'boundary',
        filter: [
          'all',
          ['==', ['get', 'admin_level'], 4],
          ['!=', ['get', 'maritime'], 1],
        ],
        paint: {
          'line-color': INK_STYLE_COLORS.cinnabarDeep,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.0, 12, 2.4],
          'line-opacity': 0.85,
        },
      },

      // ─── 关键地点（circle marker，墨色） ───────────────────
      {
        id: 'hubei-places-square',
        type: 'circle',
        source: 'hubei-places',
        minzoom: 8,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 5],
          'circle-color': [
            'case',
            ['==', ['get', 'selected'], true],
            INK_STYLE_COLORS.cinnabar,
            INK_STYLE_COLORS.inkDeep,
          ],
          'circle-stroke-color': INK_STYLE_COLORS.paper,
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.9,
        },
      },
      {
        id: 'hubei-places-label',
        type: 'symbol',
        source: 'hubei-places',
        minzoom: 9,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans CJK SC Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 9, 11, 14, 14],
          'text-offset': [0.9, 0.2],
          'text-anchor': 'left',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': INK_STYLE_COLORS.inkMedium,
          'text-halo-color': INK_STYLE_COLORS.paper,
          'text-halo-width': 1.5,
        },
      },

      // ─── 纹样绑定点（circle，朱砂/金色） ─────────────────────
      {
        id: 'hubei-bindings-circle',
        type: 'circle',
        source: 'hubei-bindings',
        minzoom: 7,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 3, 10, 6, 14, 10],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': INK_STYLE_COLORS.paper,
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.95,
        },
      },
      {
        id: 'hubei-bindings-label',
        type: 'symbol',
        source: 'hubei-bindings',
        minzoom: 10,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans CJK SC Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 13],
          'text-offset': [0, -1.4],
          'text-anchor': 'bottom',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': INK_STYLE_COLORS.cinnabarDeep,
          'text-halo-color': INK_STYLE_COLORS.paper,
          'text-halo-width': 1.8,
        },
      },

      // ─── 城市标签（OpenMapTiles place） ─────────────────────
      {
        id: 'place-city-label',
        type: 'symbol',
        source: 'openfreemap',
        'source-layer': 'place',
        filter: ['==', ['get', 'class'], 'city'],
        minzoom: 6,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans CJK SC Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, 12, 12, 18],
          'text-anchor': 'center',
        },
        paint: {
          'text-color': INK_STYLE_COLORS.inkDeep,
          'text-halo-color': INK_STYLE_COLORS.paper,
          'text-halo-width': 2,
        },
      },
      {
        id: 'place-town-label',
        type: 'symbol',
        source: 'openfreemap',
        'source-layer': 'place',
        filter: ['==', ['get', 'class'], 'town'],
        minzoom: 9,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans CJK SC Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 14, 13],
          'text-anchor': 'center',
        },
        paint: {
          'text-color': INK_STYLE_COLORS.inkMedium,
          'text-halo-color': INK_STYLE_COLORS.paper,
          'text-halo-width': 1.5,
        },
      },
    ],
  }
}
