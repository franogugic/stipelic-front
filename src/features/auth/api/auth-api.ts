import { apiRequest } from '../../../shared/api/http-client'
import type { RegisterUserRequest, RegisterUserResponse } from '../model/types'

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
