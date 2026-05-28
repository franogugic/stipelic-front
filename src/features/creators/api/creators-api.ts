import { apiRequest } from '../../../shared/api/http-client'
import type { CreateCreatorRequest, Creator, CreatorPlan, CreatorSettings } from '../model/types'

type ApiResponse<TData> = {
  statusCode: number
  message: string
  code: string
  data: TData
}

function unwrapApiResponse<TData>(response: ApiResponse<TData>) {
  return response.data
}

export function getCurrentCreator() {
  return apiRequest<ApiResponse<Creator | null>>('/api/creators/current').then(unwrapApiResponse)
}

export function listCreatorPlans() {
  return apiRequest<ApiResponse<CreatorPlan[]>>('/api/creator-plans').then(unwrapApiResponse)
}

export function getCreatorSettings(slug: string) {
  return apiRequest<ApiResponse<CreatorSettings>>(
    `/api/creators/${encodeURIComponent(slug)}/settings`,
  ).then(unwrapApiResponse)
}

export function createCreator(request: CreateCreatorRequest) {
  return apiRequest<ApiResponse<Creator>>('/api/creators', {
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
      language: request.configureSettingsOnStart ? request.language.trim() || null : null,
    },
  }).then(unwrapApiResponse)
}

export function deleteCurrentCreator() {
  return apiRequest<ApiResponse<null>>('/api/creators/current', {
    method: 'DELETE',
  })
}
