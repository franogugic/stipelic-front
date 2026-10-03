import { apiRequest } from '../../../shared/api/http-client'
import type {
  CreateLandingPageRequest,
  EmailCaptureItem,
  LandingPage,
  LandingPageAnalytics,
  LandingPageWithSections,
  SaveEditorRequest,
  SectionTemplate,
  TimeSeriesPeriod,
  TimeSeriesResponse,
} from '../model/types'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

export async function listLandingPages(slug: string, includeArchived = false): Promise<LandingPage[]> {
  const query = includeArchived ? '?includeArchived=true' : ''
  const res = await apiRequest<ApiResponse<LandingPage[]>>(`/api/creators/${slug}/landing-pages${query}`)
  return res.data
}

export async function getLandingPage(slug: string, pageId: string): Promise<LandingPageWithSections> {
  const res = await apiRequest<ApiResponse<LandingPageWithSections>>(`/api/creators/${slug}/landing-pages/${pageId}`)
  return res.data
}

export async function createLandingPage(slug: string, request: CreateLandingPageRequest): Promise<LandingPage> {
  const res = await apiRequest<ApiResponse<LandingPage>>(`/api/creators/${slug}/landing-pages`, { method: 'POST', body: request })
  return res.data
}

export async function publishLandingPage(slug: string, pageId: string): Promise<void> {
  await apiRequest<unknown>(`/api/creators/${slug}/landing-pages/${pageId}/publish`, { method: 'POST' })
}

export async function unpublishLandingPage(slug: string, pageId: string): Promise<void> {
  await apiRequest<unknown>(`/api/creators/${slug}/landing-pages/${pageId}/unpublish`, { method: 'POST' })
}

export async function archiveLandingPage(slug: string, pageId: string): Promise<void> {
  await apiRequest<unknown>(`/api/creators/${slug}/landing-pages/${pageId}`, { method: 'DELETE' })
}

export async function restoreLandingPage(slug: string, pageId: string): Promise<LandingPage> {
  const res = await apiRequest<ApiResponse<LandingPage>>(
    `/api/creators/${slug}/landing-pages/${pageId}/restore`,
    { method: 'POST' },
  )
  return res.data
}

export async function saveEditor(slug: string, pageId: string, request: SaveEditorRequest): Promise<LandingPageWithSections> {
  const res = await apiRequest<ApiResponse<LandingPageWithSections>>(
    `/api/creators/${slug}/landing-pages/${pageId}/editor`,
    { method: 'PUT', body: request },
  )
  return res.data
}

export async function getSectionTemplates(slug: string): Promise<SectionTemplate[]> {
  const res = await apiRequest<ApiResponse<SectionTemplate[]>>(`/api/creators/${slug}/landing-pages/section-templates`)
  return res.data
}

export async function getLandingPageAnalytics(slug: string, pageId: string): Promise<LandingPageAnalytics> {
  const res = await apiRequest<ApiResponse<LandingPageAnalytics>>(`/api/creators/${slug}/landing-pages/${pageId}/analytics`)
  return res.data
}

export async function getLandingPageTimeSeries(
  slug: string,
  pageId: string,
  period: TimeSeriesPeriod,
): Promise<TimeSeriesResponse> {
  const res = await apiRequest<ApiResponse<TimeSeriesResponse>>(
    `/api/creators/${slug}/landing-pages/${pageId}/timeseries?period=${period}`,
  )
  return res.data
}

/** The newest captures of the page, newest first. The API caps `limit` at 100 (default 20). */
export async function listEmailCaptures(slug: string, pageId: string, limit: number): Promise<EmailCaptureItem[]> {
  const res = await apiRequest<ApiResponse<EmailCaptureItem[]>>(
    `/api/creators/${slug}/landing-pages/${pageId}/captures?limit=${limit}`,
  )
  return res.data
}
