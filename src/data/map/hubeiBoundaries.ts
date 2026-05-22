import boundaryData from './hubei-boundaries.json'

export interface HubeiBoundaryFeature {
  id: string
  adcode: number
  name: string
  center: [number, number]
  centroid: [number, number]
  childNum: number
  path: string
}

export const HUBEI_BOUNDARY_SOURCE = boundaryData.source
export const hubeiBoundaryFeatures = boundaryData.features as HubeiBoundaryFeature[]
