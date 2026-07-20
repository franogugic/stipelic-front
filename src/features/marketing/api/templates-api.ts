import { apiRequest } from '../../../shared/api/http-client'
import type { EmailTemplate, SaveTemplateRequest } from '../model/types'

type ApiResponse<TData> = {
  statusCode: number
  message: string
  code: string
  data: TData
}

function unwrapApiResponse<TData>(response: ApiResponse<TData>) {
  return response.data
}

export function listTemplates(slug: string) {
  return apiRequest<ApiResponse<EmailTemplate[]>>(
    `/api/creators/${encodeURIComponent(slug)}/email-templates`,
  ).then(unwrapApiResponse)
}

export function getTemplate(slug: string, templatePublicId: string) {
  return apiRequest<ApiResponse<EmailTemplate>>(
    `/api/creators/${encodeURIComponent(slug)}/email-templates/${encodeURIComponent(templatePublicId)}`,
  ).then(unwrapApiResponse)
}

export function createTemplate(slug: string, request: SaveTemplateRequest) {
  return apiRequest<ApiResponse<EmailTemplate>>(
    `/api/creators/${encodeURIComponent(slug)}/email-templates`,
    { method: 'POST', body: request },
  ).then(unwrapApiResponse)
}

export function updateTemplate(slug: string, templatePublicId: string, request: SaveTemplateRequest) {
  return apiRequest<ApiResponse<EmailTemplate>>(
    `/api/creators/${encodeURIComponent(slug)}/email-templates/${encodeURIComponent(templatePublicId)}`,
    { method: 'PUT', body: request },
  ).then(unwrapApiResponse)
}

export function archiveTemplate(slug: string, templatePublicId: string) {
  return apiRequest<ApiResponse<EmailTemplate>>(
    `/api/creators/${encodeURIComponent(slug)}/email-templates/${encodeURIComponent(templatePublicId)}/archive`,
    { method: 'POST' },
  ).then(unwrapApiResponse)
}
