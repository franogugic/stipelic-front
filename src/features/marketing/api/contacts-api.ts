import { downloadFile } from '../../../shared/api/download'
import { apiRequest } from '../../../shared/api/http-client'
import type { AnalyticsPeriod } from '../../analytics/model/types'
import type { ContactImportSummary, ContactPeriodStats, ContactStats, ContactsPage } from '../model/types'

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
  /** "active" or "unsubscribed"; omitted for everyone. */
  status?: string
}

function filterParams(filters: ContactFilters) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.landingPageId) params.set('landingPageId', filters.landingPageId)
  if (filters.status) params.set('status', filters.status)
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

/** The overview with the growth cut to one period (creator timezone). */
export function getContactPeriodStats(slug: string, period: AnalyticsPeriod) {
  return apiRequest<ApiResponse<ContactPeriodStats>>(
    `/api/creators/${encodeURIComponent(slug)}/contacts/stats?${new URLSearchParams({ period })}`,
  ).then(unwrapApiResponse)
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

/**
 * Imports contacts from a CSV file. A dry run saves nothing and says what an import would do; the real import
 * (`dryRun: false`, consent attested) takes the same file again, and is all or nothing against the plan's contact limit.
 */
export function importContacts(slug: string, file: File, { dryRun, consentAttested }: { dryRun: boolean; consentAttested: boolean }) {
  const form = new FormData()
  form.append('file', file)
  form.append('consentAttested', String(consentAttested))
  form.append('dryRun', String(dryRun))
  return apiRequest<ApiResponse<ContactImportSummary>>(`/api/creators/${encodeURIComponent(slug)}/contacts/import`, {
    method: 'POST',
    body: form,
  }).then(unwrapApiResponse)
}
