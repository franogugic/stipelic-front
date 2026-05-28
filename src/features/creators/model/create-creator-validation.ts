import type { CreateCreatorFormValues } from './types'

export type CreatorStep = 'identity' | 'plan' | 'setup' | 'settings' | 'review'
export type CreateCreatorFieldName = keyof CreateCreatorFormValues

export type CreateCreatorValidation = {
  fieldErrors: Partial<Record<CreateCreatorFieldName, string>>
  isIdentityValid: boolean
  isPlanValid: boolean
  isSetupValid: boolean
  isSettingsValid: boolean
  isValid: boolean
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function validateCreateCreatorForm(
  values: CreateCreatorFormValues,
): CreateCreatorValidation {
  const name = values.name.trim()
  const slug = values.slug.trim()
  const fieldErrors: CreateCreatorValidation['fieldErrors'] = {}

  if (name.length < 2) {
    fieldErrors.name = 'Creator name needs at least 2 characters.'
  } else if (name.length > 100) {
    fieldErrors.name = 'Creator name can be up to 100 characters.'
  }

  if (slug.length < 3) {
    fieldErrors.slug = 'Creator URL needs at least 3 characters.'
  } else if (slug.length > 100) {
    fieldErrors.slug = 'Creator URL can be up to 100 characters.'
  } else if (!slugPattern.test(slug)) {
    fieldErrors.slug = 'Use lowercase letters, numbers, and dashes only.'
  }

  if (values.planCode !== 'free') {
    fieldErrors.planCode = 'Only the free plan is available right now.'
  }

  if (values.defaultCurrency !== 'EUR' && values.defaultCurrency !== 'USD') {
    fieldErrors.defaultCurrency = 'Choose EUR or USD.'
  }

  if (values.configureSettingsOnStart) {
    if (values.supportEmail.trim() && !emailPattern.test(values.supportEmail.trim())) {
      fieldErrors.supportEmail = 'Enter a valid support email.'
    }

    if (values.supportEmail.trim().length > 100) {
      fieldErrors.supportEmail = 'Support email can be up to 100 characters.'
    }

    if (values.brandName.trim().length > 100) {
      fieldErrors.brandName = 'Brand name can be up to 100 characters.'
    }

    if (values.logoUrl.trim().length > 500) {
      fieldErrors.logoUrl = 'Logo URL can be up to 500 characters.'
    }

    if (values.logoUrl.trim()) {
      try {
        const parsedUrl = new URL(values.logoUrl.trim())
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          fieldErrors.logoUrl = 'Logo URL must start with http or https.'
        }
      } catch {
        fieldErrors.logoUrl = 'Enter a valid logo URL.'
      }
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(values.primaryColor.trim())) {
      fieldErrors.primaryColor = 'Primary color must be a hex color, like #111827.'
    }

    if (values.timezone.trim().length > 100) {
      fieldErrors.timezone = 'Timezone can be up to 100 characters.'
    }
  }

  const isIdentityValid = !fieldErrors.name && !fieldErrors.slug
  const isPlanValid = !fieldErrors.planCode
  const isSetupValid = !fieldErrors.defaultCurrency
  const isSettingsValid =
    !fieldErrors.supportEmail &&
    !fieldErrors.brandName &&
    !fieldErrors.logoUrl &&
    !fieldErrors.primaryColor &&
    !fieldErrors.timezone

  return {
    fieldErrors,
    isIdentityValid,
    isPlanValid,
    isSetupValid,
    isSettingsValid,
    isValid: isIdentityValid && isPlanValid && isSetupValid && isSettingsValid,
  }
}
