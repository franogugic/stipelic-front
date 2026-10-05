import { apiRequest } from '../../../shared/api/http-client'
import type {
  ConfirmEmailChangeResponse,
  InspectResetTokenResponse,
  LogoutResponse,
  LoginUserRequest,
  LoginUserResponse,
  PendingEmailChange,
  RequestEmailChangeRequest,
  RegisterUserRequest,
  RegisterUserResponse,
  RequestPasswordResetResponse,
  ResendEmailVerificationResponse,
  ResetPasswordResponse,
  UpdateProfileRequest,
  VerifyEmailResponse,
} from '../model/types'

export function registerUser(request: RegisterUserRequest) {
  return apiRequest<RegisterUserResponse>('/api/auth/register', {
    method: 'POST',
    body: {
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      email: request.email.trim().toLowerCase(),
      password: request.password,
      acceptTerms: request.acceptTerms,
    },
  })
}

export function loginUser(request: LoginUserRequest) {
  return apiRequest<LoginUserResponse>('/api/auth/login', {
    method: 'POST',
    body: {
      email: request.email.trim().toLowerCase(),
      password: request.password,
    },
  })
}

export function getCurrentUser() {
  return apiRequest<LoginUserResponse>('/api/auth/me')
}

export function logoutUser() {
  return apiRequest<LogoutResponse>('/api/auth/logout', {
    method: 'POST',
  })
}

export function resendEmailVerification(email: string) {
  return apiRequest<ResendEmailVerificationResponse>('/api/auth/resend-verification-email', {
    method: 'POST',
    body: {
      email: email.trim().toLowerCase(),
    },
  })
}

export function verifyEmail(token: string) {
  return apiRequest<VerifyEmailResponse>('/api/auth/verify-email', {
    method: 'POST',
    body: {
      token: token.trim(),
    },
  })
}

export function requestPasswordReset(email: string) {
  return apiRequest<RequestPasswordResetResponse>('/api/auth/request-password-reset', {
    method: 'POST',
    body: {
      email: email.trim().toLowerCase(),
    },
  })
}

export function inspectResetToken(token: string) {
  return apiRequest<InspectResetTokenResponse>('/api/auth/reset-password/inspect', {
    method: 'POST',
    body: {
      token: token.trim(),
    },
  })
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<ResetPasswordResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: token.trim(),
      newPassword,
    },
  })
}

export function updateProfile(request: UpdateProfileRequest) {
  return apiRequest<LoginUserResponse>('/api/auth/me/profile', {
    method: 'PUT',
    body: { firstName: request.firstName.trim(), lastName: request.lastName.trim() },
  })
}

/** Needs the current password; always answers 202, whether or not the new address is taken. */
export function requestEmailChange(request: RequestEmailChangeRequest) {
  return apiRequest<{ message: string }>('/api/auth/me/email-change', {
    method: 'POST',
    body: { newEmail: request.newEmail.trim().toLowerCase(), currentPassword: request.currentPassword },
  })
}

/** The user's newest unused, unexpired email change, or null. */
export async function getPendingEmailChange(): Promise<PendingEmailChange | null> {
  const pending = await apiRequest<PendingEmailChange | null | undefined>('/api/auth/me/email-change')
  return pending ?? null
}

export function resendEmailChange() {
  return apiRequest<unknown>('/api/auth/me/email-change/resend', { method: 'POST' })
}

export function cancelEmailChange() {
  return apiRequest<unknown>('/api/auth/me/email-change', { method: 'DELETE' })
}

export function confirmEmailChange(token: string) {
  return apiRequest<ConfirmEmailChangeResponse>('/api/auth/email-change/confirm', {
    method: 'POST',
    body: { token },
  })
}
