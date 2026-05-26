import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { registerUser, resendEmailVerification, verifyEmail } from '../api/auth-api'
import type { AccountStatus, AuthUser, RegisterFormValues } from './types'

type AuthStatus = 'idle' | 'submitting' | 'success' | 'error'
type AsyncStatus = 'idle' | 'submitting' | 'success' | 'error'

type AuthState = {
  currentUser: AuthUser | null
  accountStatus: AccountStatus | null
  registerStatus: AuthStatus
  registerError: string | null
  resendStatus: AsyncStatus
  resendMessage: string | null
  resendError: string | null
  verifyEmailStatus: AsyncStatus
  verifyEmailMessage: string | null
  verifyEmailError: string | null
  register: (values: RegisterFormValues) => Promise<AuthUser | null>
  resendVerificationEmail: () => Promise<void>
  verifyEmailToken: (token: string) => Promise<void>
  resetRegisterFeedback: () => void
  resetResendFeedback: () => void
  resetVerifyEmailFeedback: () => void
  resetAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  accountStatus: null,
  registerStatus: 'idle',
  registerError: null,
  resendStatus: 'idle',
  resendMessage: null,
  resendError: null,
  verifyEmailStatus: 'idle',
  verifyEmailMessage: null,
  verifyEmailError: null,
  register: async (values) => {
    set({ registerStatus: 'submitting', registerError: null })

    try {
      const user = await registerUser(values)
      set({
        currentUser: user,
        accountStatus: 'pendingVerification',
        registerStatus: 'success',
        registerError: null,
      })
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
  resendVerificationEmail: async () => {
    const currentUser = useAuthStore.getState().currentUser
    if (!currentUser) {
      return
    }

    set({ resendStatus: 'submitting', resendMessage: null, resendError: null })

    try {
      const response = await resendEmailVerification(currentUser.email)
      set({ resendStatus: 'success', resendMessage: response.message, resendError: null })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not send another verification email. Please try again.'

      set({ resendStatus: 'error', resendMessage: null, resendError: message })
    }
  },
  verifyEmailToken: async (token) => {
    if (!token.trim()) {
      set({
        verifyEmailStatus: 'error',
        verifyEmailMessage: null,
        verifyEmailError: 'Verification link is missing a token.',
      })
      return
    }

    set({ verifyEmailStatus: 'submitting', verifyEmailMessage: null, verifyEmailError: null })

    try {
      const response = await verifyEmail(token)
      set({
        accountStatus: 'active',
        verifyEmailStatus: 'success',
        verifyEmailMessage: response.message,
        verifyEmailError: null,
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not verify your email. Please request a new verification link.'

      set({ verifyEmailStatus: 'error', verifyEmailMessage: null, verifyEmailError: message })
    }
  },
  resetRegisterFeedback: () => {
    set({ registerStatus: 'idle', registerError: null })
  },
  resetResendFeedback: () => {
    set({ resendStatus: 'idle', resendMessage: null, resendError: null })
  },
  resetVerifyEmailFeedback: () => {
    set({ verifyEmailStatus: 'idle', verifyEmailMessage: null, verifyEmailError: null })
  },
  resetAuth: () => {
    set({
      currentUser: null,
      accountStatus: null,
      registerStatus: 'idle',
      registerError: null,
      resendStatus: 'idle',
      resendMessage: null,
      resendError: null,
      verifyEmailStatus: 'idle',
      verifyEmailMessage: null,
      verifyEmailError: null,
    })
  },
}))
