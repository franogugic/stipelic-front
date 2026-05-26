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

export type RegisterUserRequest = RegisterFormValues

export type RegisterUserResponse = AuthUser
