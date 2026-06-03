/**
 * 中国传统色定义
 * 用于纹样颜色搜索功能
 */

export interface TraditionalColor {
  name: string
  hex: string
  keywords: string[]
}

export const TRADITIONAL_COLORS: TraditionalColor[] = [
  { name: '朱砂', hex: '#b84a39', keywords: ['红', '朱'] },
  { name: '烫金', hex: '#c9a84c', keywords: ['金', '黄'] },
  { name: '靛蓝', hex: '#2e4e7e', keywords: ['蓝', '靛'] },
  { name: '石青', hex: '#1d8bab', keywords: ['青', '蓝'] },
  { name: '竹绿', hex: '#4a7c59', keywords: ['绿', '青'] },
  { name: '藕荷', hex: '#d4796a', keywords: ['粉', '红'] },
  { name: '月白', hex: '#d5e3f0', keywords: ['白', '淡'] },
  { name: '墨色', hex: '#1a1a14', keywords: ['黑', '墨'] },
  { name: '香色', hex: '#ede7d9', keywords: ['米', '黄'] },
  { name: '银红', hex: '#e8757a', keywords: ['红', '粉'] },
  { name: '秋香色', hex: '#d9a859', keywords: ['黄', '褐'] },
  { name: '豆绿', hex: '#91ad70', keywords: ['绿', '嫩'] },
]
