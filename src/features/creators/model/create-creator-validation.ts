import type { CreateCreatorFormValues } from './types'
import { creatorConstraints } from './creator-constraints'

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

  if (name.length < creatorConstraints.name.minLength) {
    fieldErrors.name = `Creator name needs at least ${creatorConstraints.name.minLength} characters.`
  } else if (name.length > creatorConstraints.name.maxLength) {
    fieldErrors.name = `Creator name can be up to ${creatorConstraints.name.maxLength} characters.`
  }

  if (slug.length < creatorConstraints.slug.minLength) {
    fieldErrors.slug = `Creator URL needs at least ${creatorConstraints.slug.minLength} characters.`
  } else if (slug.length > creatorConstraints.slug.maxLength) {
    fieldErrors.slug = `Creator URL can be up to ${creatorConstraints.slug.maxLength} characters.`
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

    if (values.supportEmail.trim().length > creatorConstraints.supportEmail.maxLength) {
      fieldErrors.supportEmail = `Support email can be up to ${creatorConstraints.supportEmail.maxLength} characters.`
    }

    if (values.brandName.trim().length > creatorConstraints.brandName.maxLength) {
      fieldErrors.brandName = `Brand name can be up to ${creatorConstraints.brandName.maxLength} characters.`
    }

    if (values.logoUrl.trim().length > creatorConstraints.logoUrl.maxLength) {
      fieldErrors.logoUrl = `Logo URL can be up to ${creatorConstraints.logoUrl.maxLength} characters.`
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

    if (values.timezone.trim().length > creatorConstraints.timezone.maxLength) {
      fieldErrors.timezone = `Timezone can be up to ${creatorConstraints.timezone.maxLength} characters.`
    }

    if (values.language.trim().toLowerCase() !== 'en') {
      fieldErrors.language = 'English is the only language available right now.'
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
    !fieldErrors.timezone &&
    !fieldErrors.language

  return {
    fieldErrors,
    isIdentityValid,
    isPlanValid,
    isSetupValid,
    isSettingsValid,
    isValid: isIdentityValid && isPlanValid && isSetupValid && isSettingsValid,
  }
}
