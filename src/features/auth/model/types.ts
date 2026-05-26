export type RegisterFormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
}

export type AuthUser = {
  publicId: string
  firstName: string
  lastName: string
  email: string
}

export type AccountStatus = 'pendingVerification' | 'active'

export type RegisterUserRequest = RegisterFormValues

export type RegisterUserResponse = AuthUser

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
}
