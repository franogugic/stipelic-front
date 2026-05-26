import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { registerUser } from '../api/auth-api'
import type { AuthUser, RegisterFormValues } from './types'

type AuthStatus = 'idle' | 'submitting' | 'success' | 'error'

type AuthState = {
  currentUser: AuthUser | null
  registerStatus: AuthStatus
  registerError: string | null
  register: (values: RegisterFormValues) => Promise<AuthUser | null>
  resetRegisterFeedback: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  registerStatus: 'idle',
  registerError: null,
  register: async (values) => {
    set({ registerStatus: 'submitting', registerError: null })

    try {
      const user = await registerUser(values)
      set({ currentUser: user, registerStatus: 'success', registerError: null })
      return user
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not create your account. Please try again.'

      set({ registerStatus: 'error', registerError: message })
      return null
    }
  },
  resetRegisterFeedback: () => {
    set({ registerStatus: 'idle', registerError: null })
  },
}))
