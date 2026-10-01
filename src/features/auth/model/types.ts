export type RegisterFormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  /** The Terms and Privacy Policy checkbox; the backend refuses registration without it. */
  acceptTerms: boolean
}

export type LoginFormValues = {
  email: string
  password: string
}

export type AuthUser = {
  publicId: string
  firstName: string
  lastName: string
  email: string
  isEmailVerified?: boolean
  status?: string
  roles?: string[]
}

export type AccountStatus = 'pendingVerification' | 'active'

export type RegisterUserRequest = RegisterFormValues

export type RegisterUserResponse = AuthUser

export type LoginUserRequest = LoginFormValues

export type LoginUserResponse = AuthUser

export type ResendEmailVerificationRequest = {
  email: string
}

export type ResendEmailVerificationResponse = {
  message: string
}

export type VerifyEmailRequest = {
  token: string
}

export type VerifyEmailResponse = {
  message: string
  outcome: 'Verified' | 'Expired'
  /** Set for `Verified`. */
  firstName?: string | null
  /** Set for `Expired`: the address the link was sent to. */
  email?: string | null
}

/** What a verification link turned out to be; `invalid` covers a missing, unknown or rejected token. */
export type VerifyEmailOutcome = 'verified' | 'expired' | 'invalid'

export type LogoutResponse = {
  message: string
}

export type RequestPasswordResetRequest = {
  email: string
}

export type RequestPasswordResetResponse = {
  message: string
}

export type ResetPasswordRequest = {
  token: string
  newPassword: string
}

export type ResetPasswordResponse = {
  message: string
}
