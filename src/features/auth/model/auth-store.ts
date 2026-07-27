import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { resetAllFeatureStores } from '../../../shared/model/reset-all-feature-stores'
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  resendEmailVerification,
  verifyEmail,
} from '../api/auth-api'
import type { AccountStatus, AuthUser, LoginFormValues, RegisterFormValues } from './types'

type AuthStatus = 'idle' | 'submitting' | 'success' | 'error'
type AsyncStatus = 'idle' | 'submitting' | 'success' | 'error'
type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated'
const resendCooldownMs = 60_000

const getAccountStatus = (user: AuthUser): AccountStatus =>
  user.isEmailVerified === false ? 'pendingVerification' : 'active'

type AuthState = {
  currentUser: AuthUser | null
  accountStatus: AccountStatus | null
  sessionStatus: SessionStatus
  loginStatus: AuthStatus
  loginError: string | null
  logoutStatus: AsyncStatus
  logoutError: string | null
  registerStatus: AuthStatus
  registerError: string | null
  resendStatus: AsyncStatus
  resendMessage: string | null
  resendError: string | null
  resendAvailableAt: number | null
  verifyEmailStatus: AsyncStatus
  verifyEmailMessage: string | null
  verifyEmailError: string | null
  login: (values: LoginFormValues) => Promise<AuthUser | null>
  logout: () => Promise<void>
  loadCurrentUser: () => Promise<void>
  register: (values: RegisterFormValues) => Promise<AuthUser | null>
  resendVerificationEmail: () => Promise<void>
  verifyEmailToken: (token: string) => Promise<void>
  resetLoginFeedback: () => void
  resetRegisterFeedback: () => void
  resetResendFeedback: () => void
  resetVerifyEmailFeedback: () => void
  resetAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  accountStatus: null,
  sessionStatus: 'checking',
  loginStatus: 'idle',
  loginError: null,
  logoutStatus: 'idle',
  logoutError: null,
  registerStatus: 'idle',
  registerError: null,
  resendStatus: 'idle',
  resendMessage: null,
  resendError: null,
  resendAvailableAt: null,
  verifyEmailStatus: 'idle',
  verifyEmailMessage: null,
  verifyEmailError: null,
  login: async (values) => {
    set({ loginStatus: 'submitting', loginError: null })

    try {
      const user = await loginUser(values)
      set({
        currentUser: user,
        accountStatus: getAccountStatus(user),
        sessionStatus: 'authenticated',
        loginStatus: 'success',
        loginError: null,
      })
      return user
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not sign you in. Please try again.'

      set({ loginStatus: 'error', loginError: message })
      return null
    }
  },
  logout: async () => {
    set({ logoutStatus: 'submitting', logoutError: null })

    try {
      await logoutUser()
      set({
        currentUser: null,
        accountStatus: null,
        sessionStatus: 'unauthenticated',
        logoutStatus: 'success',
        logoutError: null,
        loginStatus: 'idle',
        loginError: null,
      })
      resetAllFeatureStores()
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not sign you out. Please try again.'

      set({ logoutStatus: 'error', logoutError: message })
    }
  },
  loadCurrentUser: async () => {
    set({ sessionStatus: 'checking' })

    try {
      const user = await getCurrentUser()
      set({
        currentUser: user,
        accountStatus: getAccountStatus(user),
        sessionStatus: 'authenticated',
      })
    } catch {
      const hadUser = useAuthStore.getState().currentUser !== null
      set({
        currentUser: null,
        accountStatus: null,
        sessionStatus: 'unauthenticated',
      })
      // A session that was valid a moment ago (or belongs to a previous browser tab's login)
      // just turned out to be invalid — treat it the same as an explicit logout so no other
      // account's data lingers in the feature stores for whoever logs in next.
      if (hadUser) resetAllFeatureStores()
    }
  },
  register: async (values) => {
    set({ registerStatus: 'submitting', registerError: null })

    try {
      const user = await registerUser(values)
      set({
        currentUser: null,
        accountStatus: 'pendingVerification',
        sessionStatus: 'unauthenticated',
        registerStatus: 'success',
        registerError: null,
        resendAvailableAt: Date.now() + resendCooldownMs,
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
    const { currentUser, resendAvailableAt } = useAuthStore.getState()
    if (!currentUser) {
      return
    }

    if (resendAvailableAt && resendAvailableAt > Date.now()) {
      return
    }

    set({ resendStatus: 'submitting', resendMessage: null, resendError: null })

    try {
      const response = await resendEmailVerification(currentUser.email)
      set({
        resendStatus: 'success',
        resendMessage: response.message,
        resendError: null,
        resendAvailableAt: Date.now() + resendCooldownMs,
      })
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
  resetLoginFeedback: () => {
    set({ loginStatus: 'idle', loginError: null })
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
      sessionStatus: 'unauthenticated',
      loginStatus: 'idle',
      loginError: null,
      logoutStatus: 'idle',
      logoutError: null,
      registerStatus: 'idle',
      registerError: null,
      resendStatus: 'idle',
      resendMessage: null,
      resendError: null,
      resendAvailableAt: null,
      verifyEmailStatus: 'idle',
      verifyEmailMessage: null,
      verifyEmailError: null,
    })
  },
}))
