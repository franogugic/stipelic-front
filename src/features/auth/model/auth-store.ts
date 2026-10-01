import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { resetAllFeatureStores } from '../../../shared/model/reset-all-feature-stores'
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resendEmailVerification,
  resetPassword,
  verifyEmail,
} from '../api/auth-api'
import type { AccountStatus, AuthUser, LoginFormValues, RegisterFormValues, VerifyEmailOutcome } from './types'

type AuthStatus = 'idle' | 'submitting' | 'success' | 'error'
type AsyncStatus = 'idle' | 'submitting' | 'success' | 'error'
type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated'
export const resendCooldownMs = 60_000

// A pending verification: the email of an account that still has to be verified, and when the next
// resend is allowed. Registering creates no session, so the check-inbox screen only knows these from
// here; sessionStorage keeps both across a refresh.
const pendingVerificationEmailKey = 'luma.pendingVerificationEmail'
const resendAvailableAtKey = 'luma.resendAvailableAt'

function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key: string, value: string | null) {
  try {
    if (value) window.sessionStorage.setItem(key, value)
    else window.sessionStorage.removeItem(key)
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the in-memory value still works.
  }
}

function readResendAvailableAt(): number | null {
  const availableAt = Number(readSession(resendAvailableAtKey))
  const now = Date.now()
  // Only a running cooldown counts: ignore a missing or garbled value, one that is over, and one longer
  // than a single cooldown.
  return Number.isFinite(availableAt) && availableAt > now && availableAt <= now + resendCooldownMs
    ? availableAt
    : null
}

function startResendCooldown() {
  const resendAvailableAt = Date.now() + resendCooldownMs
  writeSession(resendAvailableAtKey, String(resendAvailableAt))
  return resendAvailableAt
}

function storePendingVerificationEmail(email: string | null) {
  writeSession(pendingVerificationEmailKey, email)
}

/** Forgets the pending verification (email and resend cooldown) in storage; pair with `noPendingVerification`. */
function forgetPendingVerification() {
  writeSession(pendingVerificationEmailKey, null)
  writeSession(resendAvailableAtKey, null)
}

const noPendingVerification = { pendingVerificationEmail: null, resendAvailableAt: null }

const getAccountStatus = (user: AuthUser): AccountStatus =>
  user.isEmailVerified === false ? 'pendingVerification' : 'active'

type AuthState = {
  currentUser: AuthUser | null
  accountStatus: AccountStatus | null
  sessionStatus: SessionStatus
  loginStatus: AuthStatus
  loginError: string | null
  /** The `ApiError.code` of the last failed login, e.g. `EMAIL_NOT_VERIFIED`. */
  loginErrorCode: string | null
  /** The submitted email when the login failed with `EMAIL_NOT_VERIFIED`, so the link can be resent. */
  unverifiedEmail: string | null
  logoutStatus: AsyncStatus
  logoutError: string | null
  registerStatus: AuthStatus
  registerError: string | null
  resendStatus: AsyncStatus
  resendMessage: string | null
  resendError: string | null
  resendAvailableAt: number | null
  /** Set after registering (no session yet), cleared once verified, on logout and on a verified login. */
  pendingVerificationEmail: string | null
  verifyEmailStatus: AsyncStatus
  verifyEmailMessage: string | null
  verifyEmailError: string | null
  verifyEmailOutcome: VerifyEmailOutcome | null
  /** The token the current outcome belongs to, so a page never shows another link's result. */
  verifyEmailCheckedToken: string | null
  /** From a `verified` outcome, to greet the user. */
  verifiedFirstName: string | null
  /** From an `expired` outcome: where a new link can be sent. */
  expiredEmail: string | null
  requestPasswordResetStatus: AsyncStatus
  requestPasswordResetMessage: string | null
  requestPasswordResetError: string | null
  resetPasswordStatus: AsyncStatus
  resetPasswordMessage: string | null
  resetPasswordError: string | null
  login: (values: LoginFormValues) => Promise<AuthUser | null>
  logout: () => Promise<void>
  loadCurrentUser: () => Promise<void>
  register: (values: RegisterFormValues) => Promise<AuthUser | null>
  /**
   * Sends to `email`, or to the signed-in user's address when omitted. Without a session the given email
   * becomes the pending verification, so the check-inbox screen can show it.
   */
  resendVerificationEmail: (email?: string) => Promise<void>
  verifyEmailToken: (token: string) => Promise<void>
  requestPasswordResetForEmail: (email: string) => Promise<void>
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<boolean>
  resetLoginFeedback: () => void
  resetRegisterFeedback: () => void
  resetResendFeedback: () => void
  resetVerifyEmailFeedback: () => void
  resetRequestPasswordResetFeedback: () => void
  resetResetPasswordFeedback: () => void
  resetAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  accountStatus: null,
  sessionStatus: 'checking',
  loginStatus: 'idle',
  loginError: null,
  loginErrorCode: null,
  unverifiedEmail: null,
  logoutStatus: 'idle',
  logoutError: null,
  registerStatus: 'idle',
  registerError: null,
  resendStatus: 'idle',
  resendMessage: null,
  resendError: null,
  resendAvailableAt: readResendAvailableAt(),
  pendingVerificationEmail: readSession(pendingVerificationEmailKey),
  verifyEmailStatus: 'idle',
  verifyEmailMessage: null,
  verifyEmailError: null,
  verifyEmailOutcome: null,
  verifyEmailCheckedToken: null,
  verifiedFirstName: null,
  expiredEmail: null,
  requestPasswordResetStatus: 'idle',
  requestPasswordResetMessage: null,
  requestPasswordResetError: null,
  resetPasswordStatus: 'idle',
  resetPasswordMessage: null,
  resetPasswordError: null,
  login: async (values) => {
    set({ loginStatus: 'submitting', loginError: null, loginErrorCode: null, unverifiedEmail: null })

    try {
      const user = await loginUser(values)
      if (user.isEmailVerified) forgetPendingVerification()
      set({
        currentUser: user,
        accountStatus: getAccountStatus(user),
        sessionStatus: 'authenticated',
        loginStatus: 'success',
        loginError: null,
        ...(user.isEmailVerified ? noPendingVerification : {}),
      })
      return user
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not sign you in. Please try again.'

      const code = error instanceof ApiError ? (error.code ?? null) : null

      set({
        loginStatus: 'error',
        loginError: message,
        loginErrorCode: code,
        unverifiedEmail: code === 'EMAIL_NOT_VERIFIED' ? values.email.trim() : null,
      })
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
        loginErrorCode: null,
        unverifiedEmail: null,
        ...noPendingVerification,
      })
      forgetPendingVerification()
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
      const pendingVerificationEmail = values.email.trim().toLowerCase()
      storePendingVerificationEmail(pendingVerificationEmail)
      set({
        currentUser: null,
        pendingVerificationEmail,
        accountStatus: 'pendingVerification',
        sessionStatus: 'unauthenticated',
        registerStatus: 'success',
        registerError: null,
        resendAvailableAt: startResendCooldown(),
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
  resendVerificationEmail: async (email) => {
    const { currentUser, resendAvailableAt } = useAuthStore.getState()
    const recipient = email ?? currentUser?.email
    if (!recipient) {
      return
    }

    // Signed out (e.g. from an expired link opened on another device), the address is only known here.
    const rememberRecipient = () => {
      if (currentUser) return
      storePendingVerificationEmail(recipient)
      set({ pendingVerificationEmail: recipient })
    }

    if (resendAvailableAt && resendAvailableAt > Date.now()) {
      rememberRecipient()
      return
    }

    set({ resendStatus: 'submitting', resendMessage: null, resendError: null })

    try {
      const response = await resendEmailVerification(recipient)
      rememberRecipient()
      set({
        resendStatus: 'success',
        resendMessage: response.message,
        resendError: null,
        resendAvailableAt: startResendCooldown(),
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
        verifyEmailOutcome: 'invalid',
        verifyEmailCheckedToken: token,
        verifiedFirstName: null,
        expiredEmail: null,
      })
      return
    }

    set({
      verifyEmailStatus: 'submitting',
      verifyEmailMessage: null,
      verifyEmailError: null,
      verifyEmailOutcome: null,
      verifyEmailCheckedToken: token,
      verifiedFirstName: null,
      expiredEmail: null,
    })

    try {
      const response = await verifyEmail(token)

      if (response.outcome === 'Expired') {
        set({
          verifyEmailStatus: 'success',
          verifyEmailMessage: response.message,
          verifyEmailOutcome: 'expired',
          expiredEmail: response.email ?? null,
        })
        return
      }

      forgetPendingVerification()
      const { currentUser } = useAuthStore.getState()
      set({
        ...noPendingVerification,
        currentUser: currentUser ? { ...currentUser, isEmailVerified: true } : null,
        accountStatus: 'active',
        verifyEmailStatus: 'success',
        verifyEmailMessage: response.message,
        verifyEmailError: null,
        verifyEmailOutcome: 'verified',
        verifiedFirstName: response.firstName ?? null,
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not verify your email. Please request a new verification link.'

      set({ verifyEmailStatus: 'error', verifyEmailMessage: null, verifyEmailError: message, verifyEmailOutcome: 'invalid' })
    }
  },
  requestPasswordResetForEmail: async (email) => {
    set({
      requestPasswordResetStatus: 'submitting',
      requestPasswordResetMessage: null,
      requestPasswordResetError: null,
    })

    try {
      const response = await requestPasswordReset(email)
      set({
        requestPasswordResetStatus: 'success',
        requestPasswordResetMessage: response.message,
        requestPasswordResetError: null,
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not process your request. Please try again.'

      set({
        requestPasswordResetStatus: 'error',
        requestPasswordResetMessage: null,
        requestPasswordResetError: message,
      })
    }
  },
  resetPasswordWithToken: async (token, newPassword) => {
    set({ resetPasswordStatus: 'submitting', resetPasswordMessage: null, resetPasswordError: null })

    try {
      const response = await resetPassword(token, newPassword)
      set({
        resetPasswordStatus: 'success',
        resetPasswordMessage: response.message,
        resetPasswordError: null,
      })
      return true
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not reset your password. Please try again.'

      set({ resetPasswordStatus: 'error', resetPasswordMessage: null, resetPasswordError: message })
      return false
    }
  },
  resetLoginFeedback: () => {
    set({ loginStatus: 'idle', loginError: null, loginErrorCode: null, unverifiedEmail: null })
  },
  resetRegisterFeedback: () => {
    set({ registerStatus: 'idle', registerError: null })
  },
  resetResendFeedback: () => {
    set({ resendStatus: 'idle', resendMessage: null, resendError: null })
  },
  resetVerifyEmailFeedback: () => {
    set({
      verifyEmailStatus: 'idle',
      verifyEmailMessage: null,
      verifyEmailError: null,
      verifyEmailOutcome: null,
      verifyEmailCheckedToken: null,
      verifiedFirstName: null,
      expiredEmail: null,
    })
  },
  resetRequestPasswordResetFeedback: () => {
    set({
      requestPasswordResetStatus: 'idle',
      requestPasswordResetMessage: null,
      requestPasswordResetError: null,
    })
  },
  resetResetPasswordFeedback: () => {
    set({ resetPasswordStatus: 'idle', resetPasswordMessage: null, resetPasswordError: null })
  },
  resetAuth: () => {
    forgetPendingVerification()
    set({
      currentUser: null,
      accountStatus: null,
      sessionStatus: 'unauthenticated',
      loginStatus: 'idle',
      loginError: null,
      loginErrorCode: null,
      unverifiedEmail: null,
      logoutStatus: 'idle',
      logoutError: null,
      registerStatus: 'idle',
      registerError: null,
      resendStatus: 'idle',
      resendMessage: null,
      resendError: null,
      resendAvailableAt: null,
      pendingVerificationEmail: null,
      verifyEmailStatus: 'idle',
      verifyEmailMessage: null,
      verifyEmailError: null,
      verifyEmailOutcome: null,
      verifyEmailCheckedToken: null,
      verifiedFirstName: null,
      expiredEmail: null,
      requestPasswordResetStatus: 'idle',
      requestPasswordResetMessage: null,
      requestPasswordResetError: null,
      resetPasswordStatus: 'idle',
      resetPasswordMessage: null,
      resetPasswordError: null,
    })
  },
}))
