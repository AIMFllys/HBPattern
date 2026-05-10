/**
 * 搜索相关类型定义
 * Validates: Requirements 4.1, 4.5
 */

/** 以图搜图的请求参数 */
export interface ImageSearchParams {
  imageUrl: string
  limit?: number
}

/** 以颜色搜索的请求参数 */
export interface ColorSearchParams {
  hexColors: string[]
  limit?: number
}
