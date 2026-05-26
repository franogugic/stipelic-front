import { apiRequest } from '../../../shared/api/http-client'
import type {
  RegisterUserRequest,
  RegisterUserResponse,
  ResendEmailVerificationResponse,
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
    },
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
