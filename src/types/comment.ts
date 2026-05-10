// 评论领域类型 — Phase 0 占位定义
// Validates: Requirements 4.1, 4.3

export interface Comment {
  id: string
  patternId: string
  userId: string
  parentId: string | null
  content: string
  status: 'approved' | 'pending' | 'rejected'
  createdAt: string
}

export interface CommentWithReplies extends Comment {
  replies: Comment[]
}
