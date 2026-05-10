export type NotificationType = 'comment_reply' | 'like' | 'moderation_result' | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}
