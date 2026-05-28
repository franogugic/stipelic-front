import { apiRequest } from '../../../shared/api/http-client'
import type { CreateCreatorRequest, Creator, CreatorPlan } from '../model/types'

export function getCurrentCreator() {
  return apiRequest<Creator | null | undefined>('/api/creators/me')
}

export function listCreatorPlans() {
  return apiRequest<CreatorPlan[]>('/api/creator-plans')
}

export function createCreator(request: CreateCreatorRequest) {
  return apiRequest<Creator>('/api/creators', {
    method: 'POST',
    body: {
      name: request.name.trim(),
      slug: request.slug.trim(),
      planCode: request.planCode,
      defaultCurrency: request.defaultCurrency,
      supportEmail: request.configureSettingsOnStart ? request.supportEmail.trim() || null : null,
      brandName: request.configureSettingsOnStart ? request.brandName.trim() || null : null,
      logoUrl: request.configureSettingsOnStart ? request.logoUrl.trim() || null : null,
      primaryColor: request.configureSettingsOnStart ? request.primaryColor.trim() || null : null,
      timezone: request.configureSettingsOnStart ? request.timezone.trim() || null : null,
    },
  })
}
