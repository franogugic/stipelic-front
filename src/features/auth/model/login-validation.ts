import type { LoginFormValues } from './types'

export type LoginFieldName = keyof LoginFormValues

export type LoginValidation = {
  fieldErrors: Partial<Record<LoginFieldName, string>>
  isValid: boolean
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginForm(values: LoginFormValues): LoginValidation {
  const email = values.email.trim()
  const fieldErrors: LoginValidation['fieldErrors'] = {}

  if (!emailPattern.test(email)) {
    fieldErrors.email = 'Enter a valid email address.'
  } else if (email.length > 100) {
    fieldErrors.email = 'Email can be up to 100 characters.'
  }

  if (values.password.length < 8) {
    fieldErrors.password = 'Password needs at least 8 characters.'
  }

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  }
}
