export interface MockStats {
  totalPatterns: number
  patternGrowth: number
  totalUsers: number
  userGrowth: number
  aiCalls: string
  aiCallsGrowth: number
  monthlyData: { month: string; value: number }[]
  regionalDistribution: { region: string; percentage: number }[]
  recentUpdates: {
    id: string
    name: string
    category: string
    status: 'active' | 'processing'
    date: string
  }[]
}

export const mockStats: MockStats = {
  totalPatterns: 12840,
  patternGrowth: 12.5,
  totalUsers: 85600,
  userGrowth: 8.2,
  aiCalls: '1.2M',
  aiCallsGrowth: 24.0,
  monthlyData: [
    { month: '1月', value: 150 },
    { month: '3月', value: 140 },
    { month: '5月', value: 100 },
    { month: '7月', value: 80 },
    { month: '9月', value: 120 },
    { month: '11月', value: 40 },
  ],
  regionalDistribution: [
    { region: '华东地区', percentage: 42 },
    { region: '华北地区', percentage: 28 },
    { region: '华南地区', percentage: 18 },
    { region: '西部地区', percentage: 12 },
  ],
  recentUpdates: [
    {
      id: '1',
      name: '学术本体论 v2.4',
      category: '语义架构',
      status: 'active',
      date: '2026-10-24',
    },
    {
      id: '2',
      name: '深度神经网络映射',
      category: '计算模型',
      status: 'processing',
      date: '2026-10-22',
    },
    {
      id: '3',
      name: '多模态知识图谱',
      category: '知识表示',
      status: 'active',
      date: '2026-10-20',
    },
  ],
}
