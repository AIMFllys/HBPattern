import type { ProductConfig } from '@/types/create'

export const PRODUCT_CONFIGS: ProductConfig[] = [
  {
    id: 'frame',
    name: '画框',
    nameEn: 'Frame',
    icon: 'crop_square',
    description: '展示传统纹样之美',
    available: true,
  },
  {
    id: 'scarf',
    name: '丝巾',
    nameEn: 'Scarf',
    icon: 'style',
    description: '精致典雅的纹样丝巾',
    available: true,
  },
  {
    id: 'phone-case',
    name: '手机壳',
    nameEn: 'Phone Case',
    icon: 'smartphone',
    description: '将传统纹样带入日常',
    available: true,
  },
  {
    id: 'fan',
    name: '折扇',
    nameEn: 'Fan',
    icon: 'flare',
    description: '楚风雅韵折扇',
    available: true,
  },
  {
    id: 'tea-cup',
    name: '茶杯',
    nameEn: 'Tea Cup',
    icon: 'coffee',
    description: '陶瓷茶盏',
    available: true,
  },
  {
    id: 'tshirt',
    name: 'T恤',
    nameEn: 'T-Shirt',
    icon: 'checkroom',
    description: '纹样潮流服饰',
    available: true,
  },
]
