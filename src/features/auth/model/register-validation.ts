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

  if (!values.acceptTerms) {
    fieldErrors.acceptTerms = 'You must accept the Terms and Privacy Policy.'
  }

  return {
    fieldErrors,
    passwordChecks,
    isValid: Object.keys(fieldErrors).length === 0,
  }
}

// Mirrors the backend's AuthService.CheckPassword, which tests each UTF-16 code unit with .NET's char
// predicates: IsUpper (Lu), IsLower (Ll), IsDigit (Nd) and !IsLetterOrDigit. Testing code units (not code
// points) keeps the two sides identical, e.g. for an emoji's surrogate halves.
const isUpper = (unit: string) => /^\p{Lu}$/u.test(unit)
const isLower = (unit: string) => /^\p{Ll}$/u.test(unit)
const isDigit = (unit: string) => /^\p{Nd}$/u.test(unit)
const isLetterOrDigit = (unit: string) => /^[\p{L}\p{Nd}]$/u.test(unit)

/** The backend's five password rules, in the prototype's order and with its labels. */
export function getPasswordChecks(password: string): PasswordCheck[] {
  const units = Array.from({ length: password.length }, (_, index) => password[index])

  return [
    { id: 'length', label: '8+ characters', isMet: password.length >= 8 },
    { id: 'uppercase', label: 'Uppercase letter', isMet: units.some(isUpper) },
    { id: 'lowercase', label: 'Lowercase letter', isMet: units.some(isLower) },
    { id: 'number', label: 'Number', isMet: units.some(isDigit) },
    { id: 'special', label: 'Special character', isMet: units.some((unit) => !isLetterOrDigit(unit)) },
  ]
}
