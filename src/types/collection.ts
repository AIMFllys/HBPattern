/**
 * 收藏夹相关类型定义
 * Validates: Requirements 4.1, 4.2
 */

/** 收藏夹 */
export interface Collection {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
}

/** 收藏夹条目（收藏夹与纹样的关联记录） */
export interface CollectionItem {
  id: string;
  collectionId: string;
  patternId: string;
  addedAt: string;
}
