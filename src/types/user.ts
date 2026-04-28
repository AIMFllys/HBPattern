/**
 * User types shared across auth, API, and UI layers.
 */

export type Role = 'admin' | 'moderator' | 'user'
export type ContributorLevel = 'newcomer' | 'contributor' | 'expert' | 'inheritor'

export interface UserProfile {
  id: string
  email: string
  nickname: string
  avatarUrl?: string
  role: Role
  contributorLevel: ContributorLevel
  createdAt: string
}
