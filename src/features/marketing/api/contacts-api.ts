import { apiRequest } from '../../../shared/api/http-client'
import type { ContactsPage } from '../model/types'

type ApiResponse<TData> = {
  statusCode: number
  message: string
  code: string
  data: TData
}

function unwrapApiResponse<TData>(response: ApiResponse<TData>) {
  return response.data
}

export function searchContacts(
  slug: string,
  options: { search?: string; afterEmail?: string; limit?: number } = {},
) {
  const params = new URLSearchParams()
  if (options.search) params.set('search', options.search)
  if (options.afterEmail) params.set('afterEmail', options.afterEmail)
  if (options.limit) params.set('limit', String(options.limit))

  const query = params.toString()
  return apiRequest<ApiResponse<ContactsPage>>(
    `/api/creators/${encodeURIComponent(slug)}/contacts${query ? `?${query}` : ''}`,
  ).then(unwrapApiResponse)
}
