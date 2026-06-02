import { apiRequest } from '../../../shared/api/http-client'
import type {
  LogoutResponse,
  LoginUserRequest,
  LoginUserResponse,
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
