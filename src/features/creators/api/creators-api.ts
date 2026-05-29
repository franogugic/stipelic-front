import { apiRequest } from '../../../shared/api/http-client'
import type {
  CreateCreatorRequest,
  CreateCreatorResult,
  Creator,
  CreatorPlan,
  CreatorSettings,
  CreatorSubscriptionCheckoutResult,
  UpdateCreatorSettingsRequest,
} from '../model/types'

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

export function updateCreatorSettings(slug: string, request: UpdateCreatorSettingsRequest) {
  return apiRequest<ApiResponse<CreatorSettings>>(
    `/api/creators/${encodeURIComponent(slug)}/settings`,
    {
      method: 'PUT',
      body: {
        supportEmail: request.supportEmail.trim() || null,
        brandName: request.brandName.trim() || null,
        logoUrl: request.logoUrl.trim() || null,
        primaryColor: request.primaryColor.trim() || null,
        timezone: request.timezone.trim() || null,
        language: request.language.trim() || null,
      },
    },
  ).then(unwrapApiResponse)
}

export function createCreator(request: CreateCreatorRequest) {
  return apiRequest<ApiResponse<CreateCreatorResult>>('/api/creators', {
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

export function startCreatorSubscriptionCheckout() {
  return apiRequest<ApiResponse<CreatorSubscriptionCheckoutResult>>(
    '/api/creators/current/subscription/checkout',
    {
      method: 'POST',
    },
  ).then(unwrapApiResponse)
}

export function deleteCurrentCreator() {
  return apiRequest<ApiResponse<null>>('/api/creators/current', {
    method: 'DELETE',
  })
}
