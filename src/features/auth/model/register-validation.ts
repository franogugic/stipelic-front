import type { RegisterFormValues } from './types'

export type RegisterFieldName = keyof RegisterFormValues

export type RegisterValidation = {
  fieldErrors: Partial<Record<RegisterFieldName, string>>
  passwordChecks: PasswordCheck[]
  isValid: boolean
}

export type PasswordCheck = {
  id: string
  label: string
  isMet: boolean
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegisterForm(values: RegisterFormValues): RegisterValidation {
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()
  const email = values.email.trim()
  const passwordChecks = getPasswordChecks(values.password)

  const fieldErrors: RegisterValidation['fieldErrors'] = {}

  if (firstName.length < 2) {
    fieldErrors.firstName = 'First name needs at least 2 characters.'
  } else if (firstName.length > 50) {
    fieldErrors.firstName = 'First name can be up to 50 characters.'
  }

  if (lastName.length < 2) {
    fieldErrors.lastName = 'Last name needs at least 2 characters.'
  } else if (lastName.length > 50) {
    fieldErrors.lastName = 'Last name can be up to 50 characters.'
  }

  if (!emailPattern.test(email)) {
    fieldErrors.email = 'Enter a valid email address.'
  } else if (email.length > 100) {
    fieldErrors.email = 'Email can be up to 100 characters.'
  }

  if (!passwordChecks.every((check) => check.isMet)) {
    fieldErrors.password = 'Password does not meet all requirements.'
  }

  return {
    fieldErrors,
    passwordChecks,
    isValid: Object.keys(fieldErrors).length === 0,
  }
}

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      id: 'length',
      label: 'At least 8 characters',
      isMet: password.length >= 8,
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      isMet: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      isMet: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'One number',
      isMet: /\d/.test(password),
    },
  ]
}
