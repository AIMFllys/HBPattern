import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  role?: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
}))
