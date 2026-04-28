export interface MockRegion {
  id: string
  name: string
  namePinyin: string
  positionTop: string
  positionLeft: string
  isHighlighted: boolean
  stats: {
    ichProjects: number
    inheritors: number
    featuredProjects: string[]
  }
}

export const mockRegions: MockRegion[] = [
  {
    id: 'wuhan',
    name: '武汉市',
    namePinyin: 'Wuhan',
    positionTop: '45%',
    positionLeft: '65%',
    isHighlighted: true,
    stats: {
      ichProjects: 18,
      inheritors: 42,
      featuredProjects: ['汉绣', '武汉铜锣制作技艺'],
    },
  },
  {
    id: 'shiyan',
    name: '十堰市',
    namePinyin: 'Shiyan',
    positionTop: '35%',
    positionLeft: '30%',
    isHighlighted: false,
    stats: {
      ichProjects: 8,
      inheritors: 15,
      featuredProjects: ['武当山道教音乐', '郧阳花鼓'],
    },
  },
  {
    id: 'enshi',
    name: '恩施州',
    namePinyin: 'Enshi',
    positionTop: '55%',
    positionLeft: '25%',
    isHighlighted: false,
    stats: {
      ichProjects: 12,
      inheritors: 28,
      featuredProjects: ['西兰卡普', '土家族摆手舞'],
    },
  },
  {
    id: 'jingzhou',
    name: '荆州市',
    namePinyin: 'Jingzhou',
    positionTop: '60%',
    positionLeft: '45%',
    isHighlighted: false,
    stats: {
      ichProjects: 10,
      inheritors: 22,
      featuredProjects: ['荆州花鼓', '楚绣'],
    },
  },
]
