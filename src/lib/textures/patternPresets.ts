import type { PatternCategory, PatternPreset } from '@/types/create'

export const PATTERN_PRESETS: PatternPreset[] = [
  {
    id: 'phoenix-cloud',
    name: '凤鸟云纹',
    category: '楚文化',
    generatorConfig: {
      type: 'phoenix',
      primaryColor: '#c9a84c',
      secondaryColor: '#b84a39',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 5,
      style: 'bold',
    },
    suggestedBaseColor: '#2a1f0e',
    palette: ['#c9a84c', '#b84a39', '#2a1f0e'],
  },
  {
    id: 'geometric-weave',
    name: '西兰卡普几何',
    category: '织锦图案',
    generatorConfig: {
      type: 'geometric',
      primaryColor: '#1e3a8a',
      secondaryColor: '#ffffff',
      backgroundColor: 'transparent',
      lineWidth: 3,
      density: 8,
      style: 'bold',
    },
    suggestedBaseColor: '#1e3a8a',
    palette: ['#1e3a8a', '#ffffff', '#c9a84c'],
  },
  {
    id: 'flowing-cloud',
    name: '汉代流云纹',
    category: '漆器纹样',
    generatorConfig: {
      type: 'cloud',
      primaryColor: '#c9a84c',
      secondaryColor: '#f5f0e8',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 4,
      style: 'delicate',
    },
    suggestedBaseColor: '#1a1a14',
    palette: ['#c9a84c', '#f5f0e8', '#1a1a14'],
  },
  {
    id: 'peony-embroidery',
    name: '刺绣牡丹',
    category: '丝绸工艺',
    generatorConfig: {
      type: 'floral',
      primaryColor: '#b84a39',
      secondaryColor: '#c9a84c',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 5,
      style: 'delicate',
    },
    suggestedBaseColor: '#f5f0e8',
    palette: ['#b84a39', '#c9a84c', '#f5f0e8'],
  },
  {
    id: 'indigo-print',
    name: '天门蓝印花',
    category: '印染工艺',
    generatorConfig: {
      type: 'floral',
      primaryColor: '#1e3a8a',
      secondaryColor: '#ffffff',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 6,
      style: 'minimal',
    },
    suggestedBaseColor: '#1e3a8a',
    palette: ['#1e3a8a', '#ffffff'],
  },
  {
    id: 'lacquer-beast',
    name: '楚漆神兽纹',
    category: '漆器纹样',
    generatorConfig: {
      type: 'dragon',
      primaryColor: '#c9a84c',
      secondaryColor: '#b84a39',
      backgroundColor: 'transparent',
      lineWidth: 3,
      density: 3,
      style: 'bold',
    },
    suggestedBaseColor: '#1a1a14',
    palette: ['#c9a84c', '#b84a39', '#1a1a14'],
  },
  {
    id: 'wave-pattern',
    name: '水波纹',
    category: '当代创意',
    generatorConfig: {
      type: 'wave',
      primaryColor: '#4a6b8a',
      secondaryColor: '#c9a84c',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 7,
      style: 'delicate',
    },
    suggestedBaseColor: '#f5f0e8',
    palette: ['#4a6b8a', '#c9a84c'],
  },
  {
    id: 'diamond-grid',
    name: '万字回纹',
    category: '楚文化',
    generatorConfig: {
      type: 'geometric',
      primaryColor: '#b84a39',
      secondaryColor: '#c9a84c',
      backgroundColor: 'transparent',
      lineWidth: 2,
      density: 9,
      style: 'minimal',
    },
    suggestedBaseColor: '#f5f0e8',
    palette: ['#b84a39', '#c9a84c', '#f5f0e8'],
  },
]

export const PATTERN_CATEGORIES = [
  '全部',
  '楚文化',
  '丝绸工艺',
  '漆器纹样',
  '织锦图案',
  '印染工艺',
  '当代创意',
] as const

export type PatternCategoryFilter = (typeof PATTERN_CATEGORIES)[number]

export function getPatternsByCategory(category: PatternCategory): PatternPreset[] {
  return PATTERN_PRESETS.filter(pattern => pattern.category === category)
}
