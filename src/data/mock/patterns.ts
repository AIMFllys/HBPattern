export interface MockPattern {
  id: string
  name: string
  nameEn?: string
  era: string
  region: string
  technique: string
  description: string
  isAiGenerated: boolean
  aspectRatio: string
  colorPalette: string[]
  imagePlaceholderColor: string
}

export const mockPatterns: MockPattern[] = [
  {
    id: '1',
    name: '战国凤鸟纹',
    nameEn: 'Phoenix Bird Pattern',
    era: '楚文化',
    region: '湖北省博物馆 · 楚文化',
    technique: '丝绣',
    description: '以凤凰翱翔于盛开的牡丹花丛为主题，象征着权力的尊贵与生命的繁荣。',
    isAiGenerated: true,
    aspectRatio: '3/4',
    colorPalette: ['#c9a84c', '#a63d33', '#e8e4d9'],
    imagePlaceholderColor: '#2a1f0e',
  },
  {
    id: '2',
    name: '西兰卡普几何纹',
    nameEn: 'Xilankapu Geometric',
    era: '近现代',
    region: '恩施土家族 · 织锦',
    technique: '织锦',
    description: '西兰卡普是土家族传统织锦工艺，以其独特的几何图案闻名。',
    isAiGenerated: false,
    aspectRatio: '1/1',
    colorPalette: ['#1e3a8a', '#ffffff', '#c9a84c'],
    imagePlaceholderColor: '#1e3a8a',
  },
  {
    id: '3',
    name: '汉代流云纹',
    nameEn: 'Han Dynasty Cloud Pattern',
    era: '汉代',
    region: '荆州古城 · 考古发现',
    technique: '漆绘',
    description: '流云纹是汉代常见的装饰纹样，象征着天上的云彩和神仙的意象。',
    isAiGenerated: false,
    aspectRatio: '4/5',
    colorPalette: ['#1a1a14', '#c9a84c', '#f5f0e8'],
    imagePlaceholderColor: '#3d3d30',
  },
  {
    id: '4',
    name: '江陵刺绣牡丹',
    nameEn: 'Jiangling Peony Embroidery',
    era: '清代',
    region: '民间收集 · 丝绣',
    technique: '刺绣',
    description: '牡丹花开富贵的传统寓意，在荆楚地区有着悠久的历史。',
    isAiGenerated: false,
    aspectRatio: '3/2',
    colorPalette: ['#b84a39', '#c9a84c', '#f5f0e8'],
    imagePlaceholderColor: '#8c2f22',
  },
  {
    id: '5',
    name: '天门印花蓝布纹',
    nameEn: 'Tianmen Blue Print',
    era: '近现代',
    region: '天门 · 传统印染',
    technique: '印染',
    description: '传统蓝印花布技术，历史悠久，具有浓郁的乡土气息。',
    isAiGenerated: true,
    aspectRatio: '4/5',
    colorPalette: ['#1e3a8a', '#ffffff', '#1a1a14'],
    imagePlaceholderColor: '#1e3a8a',
  },
  {
    id: '6',
    name: '楚漆器神兽纹',
    nameEn: 'Chu Lacquer Beast Pattern',
    era: '战国',
    region: '随州出土 · 漆绘',
    technique: '漆器',
    description: '楚文化漆器上的神兽图案，展现了古代工匠的精湛技艺。',
    isAiGenerated: false,
    aspectRatio: '1/1',
    colorPalette: ['#c9a84c', '#1a1a14', '#b84a39'],
    imagePlaceholderColor: '#1a1a14',
  },
]

export const filterOptions = {
  eras: ['楚式风格', '汉代纹饰', '唐宋韵味', '明清工艺'],
  regions: ['武汉 (江城)', '荆州 (古城)', '恩施 (土苗)', '襄阳 (汉水)'],
  techniques: ['传统刺绣', '民间蜡染', '织锦 (西兰卡普)', '漆器纹样'],
}
