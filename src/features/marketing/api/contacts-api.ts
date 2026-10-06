import { downloadFile } from '../../../shared/api/download'
import { apiRequest } from '../../../shared/api/http-client'
import type { ContactStats, ContactsPage } from '../model/types'

type ApiResponse<TData> = {
  statusCode: number
  message: string
  code: string
  data: TData
}

function unwrapApiResponse<TData>(response: ApiResponse<TData>) {
  return response.data
}

export type ContactFilters = {
  /** Part of an email. */
  search?: string
  /** Public id of the landing page the contact signed up on. */
  landingPageId?: string
}

function filterParams(filters: ContactFilters) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.landingPageId) params.set('landingPageId', filters.landingPageId)
  return params
}

export function searchContacts(slug: string, options: ContactFilters & { afterEmail?: string; limit?: number } = {}) {
  const params = filterParams(options)
  if (options.afterEmail) params.set('afterEmail', options.afterEmail)
  if (options.limit) params.set('limit', String(options.limit))

  const query = params.toString()
  return apiRequest<ApiResponse<ContactsPage>>(
    `/api/creators/${encodeURIComponent(slug)}/contacts${query ? `?${query}` : ''}`,
  ).then(unwrapApiResponse)
}

export function getContactStats(slug: string) {
  return apiRequest<ApiResponse<ContactStats>>(`/api/creators/${encodeURIComponent(slug)}/contacts/stats`).then(
    unwrapApiResponse,
  )
}

/** Removes the contact from the workspace's pages; an opt-out on record stays. */
export async function deleteContact(slug: string, email: string): Promise<void> {
  await apiRequest<unknown>(`/api/creators/${encodeURIComponent(slug)}/contacts/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  })
}

/** Saves the contacts matching the filters as a CSV (the file name comes from the server). */
export function exportContacts(slug: string, filters: ContactFilters): Promise<void> {
  const query = filterParams(filters).toString()
  return downloadFile(
    `/api/creators/${encodeURIComponent(slug)}/contacts/export${query ? `?${query}` : ''}`,
    `contacts-${slug}.csv`,
  )
}
