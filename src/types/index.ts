/**
 * 类型系统统一导出入口
 *
 * 所有业务模块应从 '@/types' 导入类型，而非直接引用子模块。
 * Validates: Requirements 4.1, 4.8, 4.9
 */

export * from './api'
export * from './pattern'
export * from './user'
export * from './collection'
export * from './comment'
export * from './notification'
export * from './search'
export * from './ai'
