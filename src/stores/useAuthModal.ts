import { create } from 'zustand'

interface AuthModalState {
  open: boolean
  message: string
  openModal: (message?: string) => void
  closeModal: () => void
}

export const useAuthModal = create<AuthModalState>((set) => ({
  open: false,
  message: '',
  openModal: (message = '') => set({ open: true, message }),
  closeModal: () => set({ open: false, message: '' }),
}))
